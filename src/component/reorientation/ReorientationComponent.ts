import { Observable, Subject } from "rxjs";
import { filter, first } from "rxjs/operators";
import * as THREE from "three";

import { Component } from "../Component";
import { ComponentName } from "../ComponentName";
import { ReorientationConfiguration }
    from "../interfaces/ReorientationConfiguration";
import {
    bearingToBasicX,
    DEFAULT_REORIENTATION_CONFIGURATION,
    ReorientationEngine,
    ReorientationImage,
    ReorientationProvider,
    ReorientationResult,
    wrapDelta,
} from "./ReorientationEngine";

import { Image } from "../../graph/Image";
import { NavigationDirection } from "../../graph/edge/NavigationDirection";
import { Sequence } from "../../graph/Sequence";
import { isSpherical } from "../../geo/Geo";
import { Transform } from "../../geo/Transform";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { RenderCamera } from "../../render/RenderCamera";
import { hasReconstructionMesh } from "../../util/Mesh";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";

// Skip a reorientation when it would move the current view less than this many
// degrees (on either axis) — small moves are just jitter.
const MIN_REORIENT_DEG = 15;
const MAX_HORIZON_CORRECTION_DEG = 75;
const MAX_REORIENTATION_ROLL_DEG = 45;
const MAX_PERSPECTIVE_AUTO_ZOOM = 0.75;
const MAX_PERSPECTIVE_FOV = 125;
const PERSPECTIVE_EDGE_MARGIN = 1e-3;
const USER_ZOOM_EPSILON = 1e-2;

/**
 * The heading an image ended up being shown at, once reorientation has decided
 * whether to turn it. Emitted on {@link ReorientationComponent.settled$}.
 */
export interface ReorientationSettledEvent {
    id: string;
    bearing: number;
}

/**
 * @class ReorientationComponent
 *
 * @classdesc Reorients spherical images to face the direction of travel and
 * levels their horizon. Perspective images keep their heading but are leveled
 * and fitted so rotation does not expose the image boundary. If the user drags
 * to look around, that manual offset is preserved across the rest of a
 * spherical sequence rather than re-facing forward on every step.
 *
 * Crossing into a new spherical sequence with a direction arrow keeps the
 * carried view rather than snapping to travel — the arrow's own transition
 * already matched the angle — and adopts it as the new sequence's look-around
 * offset. Every other way into a new sequence — Next/Prev, map click, or a
 * fresh load without an explicitly adopted view — resets to travel + horizon.
 *
 * Active by default; disable with `component: { reorientation: false }`.
 *
 * @example
 * ```js
 * var viewer = new Viewer({
 *     accessToken: "<my-access-token>",
 *     container: "<my-container-id>",
 *     component: { reorientation: false },
 * });
 * ```
 */
export class ReorientationComponent
    extends Component<ReorientationConfiguration> {

    public static componentName: ComponentName = "reorientation";

    private _engine: ReorientationEngine;
    private _activeId: string;
    private _computedBasicX: number;

    // Sequence of the last image we resolved, so a change of sequence (a fresh
    // load or a deliberate jump to another capture) can be reoriented even when
    // the landing image's own GPS speed reads as stationary.
    private _lastSeq: string;
    private _imageSequence: string;
    private _sequenceChanged: boolean;
    private _appliedPerspectiveZoom: number;
    private _userZoomOverride: boolean;
    private _automaticHorizonLeveling: boolean;
    private _reorientToFront: boolean;
    private _reorientOnSpatialNav: boolean;
    private _adoptedView: number[];
    private _adoptedSequence: string;
    private _settled$: Subject<ReorientationSettledEvent> =
        new Subject<ReorientationSettledEvent>();

    // Live viewer bearing, and its value snapshotted at the moment an image
    // change arrives — see the currentImage$ subscription for why the snapshot
    // is needed.
    private _liveBearing: number;
    private _incomingBearing: number;
    private _dragging: boolean = false;
    private _userViewChanged: boolean = false;

    // Manual horizontal look-around offset, preserved within a sequence so the
    // engine doesn't yank the view back to the travel direction on every step.
    private _userOffsetX: number;

    // Vertical look offset from the reconstructed horizon. Seeded once per
    // activation from the current view and updated on drag. Re-reading the live
    // y every image round-trips through the spherical projection and drifts, so
    // it is held, not re-read.
    private _userOffsetY: number;
    private _ySeeded: boolean;
    private _currentTransform: Transform;
    private _viewportCoords: ViewportCoords = new ViewportCoords();

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    /**
     * The heading each image settles on, emitted once this component has
     * decided whether to turn it.
     *
     * A host drawing its own indicator cannot infer this: the decision is
     * asynchronous (it waits on the engine), and when the view is carried
     * across — any direction arrow, or a turn below the reorientation
     * threshold — no camera moves, so no bearing event is produced either.
     */
    public get settled$(): Observable<ReorientationSettledEvent> {
        return this._settled$;
    }

    /**
     * The reoriented viewer bearing (degrees clockwise from north) the given
     * image will be shown at once navigated to: its travel direction plus the
     * manual look-around offset preserved across the sequence — the exact
     * heading the reoriented view (and any cone tracking it) ends up at.
     *
     * Synchronous: reads only the engine's precomputed cache (populated for the
     * images around the current one), so there is no network round-trip.
     * Returns null when there is no valid reorientation for the id — not a
     * reoriented pano, end of sequence, or not yet computed — so callers can
     * fall back to the image's own compass angle.
     */
    public getReorientedBearing(id: string): number | null {
        const engine = this._engine;
        if (!engine) {
            return null;
        }
        const result = engine.get(id);
        if (!result || !result.valid || typeof result.travel !== "number") {
            return null;
        }
        if (!this._reorientToFront &&
            result.seq != null && result.seq === this._lastSeq) {
            const active = this._engine.get(this._activeId);
            if (active?.valid &&
                typeof active.viewCompassAngle === "number" &&
                typeof this._liveBearing === "number") {
                return this._mapBearing(active, this._liveBearing);
            }
        }
        // The look-around offset belongs to the active sequence and is reset on
        // a cross-sequence jump, so apply it only to same-sequence ids —
        // otherwise the hover cone predicts travel+offset while the actual
        // landing (fresh sequence → offset 0) shows plain travel.
        const offset = result.seq != null && result.seq === this._lastSeq ?
            this._userOffsetX * 360 : 0;
        return ((result.travel + offset) % 360 + 360) % 360;
    }

    /** Resolve an uncached image before returning its predicted view bearing. */
    public getReorientedBearingAsync(id: string): Promise<number | null> {
        const engine = this._engine;
        if (engine == null) {
            return Promise.resolve(null);
        }

        return engine.precompute(id, undefined, 0)
            .then((): number | null =>
                this._engine === engine ? this.getReorientedBearing(id) : null)
            .catch((): null => null);
    }

    /**
     * The GPS-derived direction of travel for an image, independent of its
     * compass orientation and the viewer's look-around offset.
     *
     * Returns null until the reorientation engine has resolved the image or
     * when the sequence cannot provide a valid neighboring segment.
     */
    public getTravelBearing(id: string): number | null {
        const result = this._engine == null ? null : this._engine.get(id);
        if (!result || !result.valid || typeof result.travel !== "number") {
            return null;
        }

        return ((result.travel % 360) + 360) % 360;
    }

    /**
     * Treat the given basic coordinates as the user's look-around offset rather
     * than reorienting away from them, and land the current image on them.
     *
     * For a view the host already knows about but this component never observed
     * — a shared link carrying explicit basic coordinates, say — the offset
     * would otherwise be discarded and the next navigation would snap to the
     * travel direction. Coordinates are passed in rather than read from the
     * viewer so the call does not race the host applying them.
     */
    public adoptView(basic: number[]): void {
        this._adoptedView = basic != null && basic.length === 2 ?
            [basic[0], basic[1]] : null;
        this._adoptedSequence = this._adoptedView != null ?
            this._imageSequence : null;
    }

    /**
     * The heading the given image would be shown at if it were reached right
     * now with a direction arrow, or null when that cannot be determined
     * (reorientation absent, nothing cached yet, not a reorientable pano).
     *
     * Mirrors the decision _reorient makes on arrival, including the minimum
     * turn threshold, so a host can draw a hover indicator that matches where
     * the view will actually land. The travel direction alone is not that
     * answer: an arrow carries the view across a sequence boundary or a
     * sideways hop, and a turn smaller than the threshold is skipped.
     */
    public predictBearingTo(id: string): number | null {
        const engine = this._engine;
        if (engine == null ||
            this._activeId == null ||
            typeof this._liveBearing !== "number") {
            return null;
        }
        const from = engine.get(this._activeId);
        if (from == null || !from.valid ||
            typeof from.cca !== "number" ||
            typeof from.viewCompassAngle !== "number") {
            return null;
        }
        const liveBearing = this._mapBearing(from, this._liveBearing);
        // Answered before looking the target up: anything that is not the
        // in-sequence neighbour is a sideways hop or a sequence crossing, both
        // of which carry the view. The engine only caches within the current
        // sequence, so those targets are usually absent and requiring them here
        // would return null for exactly the cases the host most needs.
        const neighbor = from.nextId === id || from.prevId === id;
        if (!neighbor || !this._reorientToFront ||
            !this._reorientOnSpatialNav) {
            return liveBearing;
        }

        const to = engine.get(id);
        if (to == null || !to.valid ||
            typeof to.viewCompassAngle !== "number" ||
            typeof to.travel !== "number") {
            return null;
        }
        if (to.seq == null || to.seq !== this._lastSeq) {
            return liveBearing;
        }

        const targetX = this._applyOffsetX(to.basicX);
        const viewX = bearingToBasicX(liveBearing, to.viewCompassAngle);
        const dxDeg = Math.abs(wrapDelta(targetX - viewX)) * 360;

        return dxDeg >= MIN_REORIENT_DEG ?
            this._bearingForView(to, targetX) :
            liveBearing;
    }

    protected _activate(): void {
        const subs = this._subscriptions;

        this._navigator.setMovePreparer(
            (id: string, direction: NavigationDirection): Promise<void> =>
                this._prepareMove(id, direction));

        subs.push(this._configuration$.subscribe(
            (configuration: ReorientationConfiguration): void => {
                this._automaticHorizonLeveling =
                    configuration.automaticHorizonLeveling ??
                    DEFAULT_REORIENTATION_CONFIGURATION.automaticHorizonLeveling;
                this._reorientToFront = configuration.reorientToFront ??
                    DEFAULT_REORIENTATION_CONFIGURATION.reorientToFront;
                this._reorientOnSpatialNav =
                    configuration.reorientOnSpatialNav ??
                    DEFAULT_REORIENTATION_CONFIGURATION.reorientOnSpatialNav;
                this._engine = new ReorientationEngine(
                    this._createProvider(), configuration);
                this._activeId = null;
                this._computedBasicX = 0.5;
                this._lastSeq = null;
                this._imageSequence = null;
                this._sequenceChanged = false;
                this._appliedPerspectiveZoom = 0;
                this._userZoomOverride = false;
                this._userViewChanged = false;
                // NOT _adoptedView: it is host intent that can be handed over
                // before this fires (activation and configure() both re-run
                // this), and clearing it here silently drops the view the host
                // asked to keep.
                this._resetOffset();
            }));

        // currentImage$ fires reliably on every navigation, including in-app
        // jumps to another sequence (currentState$ did not deliver those).
        subs.push(this._navigator.stateService.currentImage$.subscribe(
            (image: Image): void => {
                if (!image) {
                    return;
                }
                this._currentTransform = new Transform(
                    image.exifOrientation,
                    image.width,
                    image.height,
                    image.scale,
                    image.rotation,
                    [0, 0, 0],
                    image.image,
                    image.camera);
                const fromId = this._activeId;
                if (this._adoptedView != null &&
                    this._adoptedSequence == null) {
                    this._adoptedSequence = image.sequenceId;
                }
                this._sequenceChanged = fromId != null &&
                    image.sequenceId !== this._imageSequence;
                if (this._sequenceChanged) {
                    this._navigator.stateService.setZoom(0);
                    this._appliedPerspectiveZoom = 0;
                    this._userZoomOverride = false;
                }
                this._activeId = image.id;
                this._imageSequence = image.sequenceId;
                // Snapshot now, synchronously with the change. By the time the
                // engine resolves, the transition has already begun moving the
                // camera, so neither the live bearing nor getCenter() still
                // describes the view the user carried in.
                this._incomingBearing = this._liveBearing;
                // Consume the direction here, synchronously with the landing, so
                // it attributes to this image and not a later re-emit.
                const direction = this._navigator.consumeMoveDirection();
                const commitSequenceView = this._userViewChanged &&
                    (direction === NavigationDirection.Next ||
                        direction === NavigationDirection.Prev);
                this._userViewChanged = false;
                this._reorient(
                    image,
                    direction,
                    fromId,
                    this._dragging,
                    commitSequenceView);
            }));

        subs.push(this._container.renderService.bearing$.subscribe(
            (bearing: number): void => { this._liveBearing = bearing; }));

        subs.push(this._container.mouseService.mouseDragStart$.subscribe(
            (): void => { this._dragging = true; }));

        // A finished drag is a genuine user look-around (our own steering goes
        // through the state, not pointer events), so capture the offset. During
        // playback, stop residual momentum from spilling into later images.
        subs.push(this._container.mouseService.mouseDragEnd$.subscribe(
            (): void => {
                if (this._navigator.playService.playing) {
                    this._navigator.stateService
                        .rotateBasicWithoutInertia([0, 0]);
                }
                this._dragging = false;
                this._userViewChanged = true;
                this._captureOffset();
            }));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();
        this._navigator.setMovePreparer(null);
        this._engine = null;
        this._activeId = null;
        this._lastSeq = null;
        this._imageSequence = null;
        this._sequenceChanged = false;
        this._appliedPerspectiveZoom = 0;
        this._userZoomOverride = false;
        this._dragging = false;
        this._userViewChanged = false;
        this._resetOffset();
    }

    protected _getDefaultConfiguration(): ReorientationConfiguration {
        return {};
    }

    private _reorient(
        image: Image,
        direction: NavigationDirection,
        fromId: string,
        draggingAtNavigation: boolean,
        commitSequenceView: boolean): void {
        const id = image.id;
        const seed = this._seed(image);
        const engine = this._engine;
        engine.precompute(id, seed)
            .then((): void => {
                // Ignore stale results from navigation that has moved on.
                if (this._activeId !== id || this._engine !== engine) {
                    return;
                }
                const result = engine.get(id);
                if (this._adoptedView != null &&
                    this._adoptedSequence != null &&
                    image.sequenceId !== this._adoptedSequence) {
                    this._clearAdoptedView();
                }
                if (!isSpherical(image.cameraType)) {
                    this._levelPerspective(id);
                    return;
                }
                // A disconnected image still hard-cuts after navigation so its
                // image change is not followed by a distracting pan. On initial
                // load there is no preceding image cut, so use the same smooth
                // orientation as a reconstructed image.
                const hasReconstruction =
                    hasReconstructionMesh(image.mesh) &&
                    result?.computedCompassOutlier !== true;
                const hardCut = !hasReconstruction && fromId != null;
                const horizonY = (x: number): number =>
                    hasReconstruction && this._automaticHorizonLeveling ?
                        this._horizonY(x) : 0.5;
                const sequenceId = result?.seq ?? image.sequenceId;
                const freshSequence =
                    sequenceId != null && sequenceId !== this._lastSeq;
                this._lastSeq = sequenceId;

                // An arrow move already lands at the heading the user was
                // looking at, because the state layer carries the view across
                // the image change. Crossing into a new sequence that way keeps
                // that view and adopts it as this sequence's look-around offset,
                // so nothing rotates here and the following in-sequence steps
                // preserve the framing the user arrived with. A direct jump
                // within the same sequence preserves that manual offset too;
                // entering another sequence resets to travel.
                const spatialNav =
                    this._isStep(direction) || this._isTurn(direction);
                const leftAnother = fromId != null && fromId !== id;
                const fromResult = leftAnother ? engine.get(fromId) : null;
                const neighbor = fromResult != null &&
                    (fromResult.nextId === id || fromResult.prevId === id);
                // A user's drag can keep moving after mouse-up, but automatic
                // camera movement must not become a persistent look offset.
                if ((commitSequenceView ||
                    (draggingAtNavigation && this._dragging)) && neighbor &&
                    fromResult.valid &&
                    typeof fromResult.cca === "number" &&
                    typeof fromResult.basicX === "number" &&
                    typeof this._incomingBearing === "number") {
                    const incomingX = bearingToBasicX(
                        this._incomingBearing, fromResult.cca);
                    this._userOffsetX =
                        wrapDelta(incomingX - fromResult.basicX);
                }
                // An arrow that lands somewhere other than the image next to
                // the one we left is a sideways hop, not a step along the road:
                // a parallel pass, or the return leg of a capture that doubles
                // back, whose travel direction can be the reverse of ours.
                // Facing its travel would swing the user around, so treat it
                // like a sequence crossing and keep the carried view.
                const lateralHop =
                    spatialNav && leftAnother && fromResult != null && !neighbor;
                const carryView = spatialNav && (freshSequence || lateralHop);
                // A directionless non-neighbor landing is a map/pKey jump. It
                // still bypasses the low-motion guard, while resetView below
                // distinguishes a same-capture jump from a new capture.
                const jump = direction == null && leftAnother && !neighbor;
                const resetView = freshSequence && !carryView;

                if (freshSequence) {
                    // Drop look-ahead hints from the prior sequence so nothing
                    // carries over; this sequence registers its own as it goes.
                    this._navigator.stateService.clearReorientations();
                }

                if (!result || !result.valid) {
                    // Switching out of Gravity can reset a center queued before
                    // the image loaded, so restore an explicit shared-link view
                    // after the fallback transition. Keep it pending because an
                    // endpoint has no travel result from which to derive the
                    // offset that its first valid same-sequence neighbor needs.
                    const adoptedView = this._adoptedView;
                    this._navigator.stateService.traverse();
                    if (resetView) {
                        this._resetOffset();
                    }
                    if (adoptedView != null) {
                        this._navigator.stateService.setCenter(adoptedView);
                    } else if (resetView) {
                        this._navigator.stateService.setCenter([0.5, 0.5]);
                    }

                    return;
                }
                const safetyCenter = [result.basicX, horizonY(result.basicX)];
                const rollDeg = hasReconstruction &&
                    this._automaticHorizonLeveling ?
                    this._rollDeg(safetyCenter) : 0;
                if (rollDeg == null ||
                    rollDeg > MAX_REORIENTATION_ROLL_DEG) {
                    this._navigator.stateService.traverse();
                    if (resetView) {
                        this._resetOffset();
                    }
                    let fallbackCenter =
                        this._adoptedView ?? [result.basicX, 0.5];
                    if (this._adoptedView == null &&
                        this._isStep(direction) &&
                        typeof this._incomingBearing === "number" &&
                        typeof result.cca === "number") {
                        const carriedX = bearingToBasicX(
                            this._incomingBearing, result.cca);
                        fallbackCenter = [carriedX, 0.5];
                        this._userOffsetX =
                            wrapDelta(carriedX - result.basicX);
                    }
                    this._navigator.stateService.setCenter(fallbackCenter);
                    this._clearAdoptedView();
                    return;
                }
                if (hasReconstruction && this._automaticHorizonLeveling) {
                    this._navigator.stateService.gravityTraverse();
                } else {
                    this._navigator.stateService.traverse();
                }
                this._computedBasicX = result.basicX;
                if ((!hasReconstruction || !this._automaticHorizonLeveling) &&
                    !this._ySeeded) {
                    this._userOffsetY = 0;
                    this._ySeeded = true;
                }

                if (draggingAtNavigation && this._dragging && neighbor) {
                    return;
                }

                // Within a sequence an arrow step is where reorientation earns
                // its keep: the carried view drifts off-axis as the road bends.
                // Opt out to compare against plain carried-view navigation.
                if (spatialNav && !freshSequence &&
                    !this._reorientOnSpatialNav) {
                    this._clearAdoptedView();

                    return;
                }

                // Pitch is tracked deterministically via the offset (the live
                // view y drifts ~18° through the spherical projection, so it
                // can't be measured per image). On a reset the held pitch resets
                // to horizon; the reset amount is how far the carried pitch must
                // move, used to force a reorientation even when the horizontal
                // change is small. Carry/turn keep the pitch as part of the
                // preserved look-around.
                let pitchResetDeg = 0;
                if (resetView) {
                    // Don't carry x/pitch/rotation offsets across sequences:
                    // start fresh at travel direction + horizon. A cross-sequence
                    // jump carries the prior image's view, which would otherwise
                    // persist the previous sequence's pitch (e.g. "looking down").
                    pitchResetDeg = this._automaticHorizonLeveling ?
                        Math.abs(this._userOffsetY) * 180 : 0;
                    this._userOffsetX = 0;
                    if (this._automaticHorizonLeveling) {
                        this._userOffsetY = 0;
                    }
                    this._ySeeded = true;
                }
                if (!result.moving && !freshSequence && !jump) {
                    // Low motion between adjacent images — preserve the view
                    // rather than spin on stationary GPS jitter.
                    return;
                }

                // Read this image's current view and reorient only if doing so
                // would move it past the threshold on either axis — otherwise
                // the move is just jitter. Measured per image (current view →
                // target), not accumulated from a prior image.
                this._navigator.stateService.getCenter().pipe(first()).subscribe(
                    (center: number[]): void => {
                        if (this._activeId !== id || this._engine !== engine) {
                            return;
                        }
                        // Adopt the host-supplied view as the offset before any
                        // of the reset/carry decisions above take effect, so a
                        // shared link's framing becomes the look-around offset
                        // this sequence preserves. Read the view as those coords
                        // too, not as whatever the viewer shows right now: the
                        // host may not have applied them yet, and steering there
                        // ourselves would animate a rotation the user did not
                        // ask for. Equal to targetX, so this image never moves.
                        let viewX = center[0];
                        if (this._adoptedView != null) {
                            const adopted = this._adoptedView;
                            this._clearAdoptedView();
                            viewX = adopted[0];
                            this._userOffsetX =
                                wrapDelta(adopted[0] - result.basicX);
                            this._userOffsetY =
                                adopted[1] - horizonY(adopted[0]);
                            this._ySeeded = true;
                        }
                        else if (carryView &&
                            typeof this._incomingBearing === "number" &&
                            typeof result.cca === "number") {
                            // Not center[0]: on a sideways hop or a sequence
                            // crossing the two frames can be ~180 deg apart, and
                            // the state layer is still settling that when this
                            // resolves, so the sampled centre lags the carried
                            // view by however far it has got.
                            viewX = bearingToBasicX(
                                this._incomingBearing, result.cca);
                        }
                        // Seed the held pitch offset once from the loaded view.
                        if (!this._ySeeded) {
                            this._userOffsetY = center[1] - horizonY(center[0]);
                            this._ySeeded = true;
                        }
                        // Arrow into a new sequence or a sideways hop: keep the
                        // view the user carried in. Seed the look-around offset
                        // from that view so following steps preserve it;
                        // targetX then equals viewX, so nothing rotates. Reads
                        // viewX rather than center so it agrees with an adopted
                        // view instead of overwriting the offset just set.
                        if (carryView) {
                            this._userOffsetX =
                                wrapDelta(viewX - result.basicX);
                        }
                        const targetX = this._reorientToFront ?
                            this._applyOffsetX(result.basicX) : viewX;
                        const targetY = this._automaticHorizonLeveling ?
                            Math.max(0, Math.min(
                                1, horizonY(targetX) + this._userOffsetY)) :
                            center[1];

                        const dxDeg =
                            Math.abs(wrapDelta(targetX - viewX)) * 360;
                        const dyDeg = Math.abs(targetY - center[1]) * 180;
                        const move = dxDeg >= MIN_REORIENT_DEG ||
                            dyDeg >= MIN_REORIENT_DEG ||
                            pitchResetDeg >= MIN_REORIENT_DEG;
                        if (move) {
                            if (hardCut) {
                                this._navigator.stateService
                                    .rotateToBasic([targetX, targetY]);
                            } else {
                                this._navigator.stateService
                                    .rotateToBasicSmooth([targetX, targetY]);
                            }
                        }

                        // Pre-orient BOTH neighbors (hints) so a hard cut
                        // doesn't flash the carried view and stepping either way
                        // lands on the travel direction deterministically. Prev
                        // needs this as much as next: without a hint, backward
                        // navigation only reorients on arrival past the 15°
                        // threshold, so on gentle stretches it holds the carried
                        // bearing and the prev cone (which predicts travel +
                        // offset) no longer matches. Cross-image, so reason in
                        // absolute bearings: the view a neighbor carries in is
                        // where this image ends up.
                        if (typeof result.viewCompassAngle === "number") {
                            const endX = move ? targetX : viewX;
                            const endBearing = this._bearingForView(result, endX);
                            // Carrying the view moves no camera, so a host
                            // watching bearing events would never learn where
                            // this image ended up. Tell it outright.
                            this._settled$.next({
                                id,
                                bearing: endBearing,
                            });
                            if (result.nextId) {
                                this._hintNeighbor(
                                    engine, result.nextId, endBearing, targetY);
                            }
                            if (result.prevId) {
                                this._hintNeighbor(
                                    engine, result.prevId, endBearing, targetY);
                            }
                        }
                    });
            })
            .catch((): void => { /* skip images we can't resolve */ });
    }

    private _prepareMove(
        id: string,
        direction: NavigationDirection): Promise<void> {
        if (direction !== NavigationDirection.Next &&
            direction !== NavigationDirection.Prev) {
            return Promise.resolve();
        }
        const engine = this._engine;
        const activeId = this._activeId;
        if (engine == null || activeId == null || !this._reorientToFront) {
            return Promise.resolve();
        }

        // A sequence button can become clickable before the first image's
        // async orientation metadata is ready. Wait for both sides so the
        // target hint exists before StateService makes that image visible.
        return Promise.all([
            engine.precompute(activeId, undefined, 0),
            engine.precompute(id, undefined, 0),
        ]).then((): Promise<void> => {
            if (this._engine !== engine || this._activeId !== activeId) {
                return Promise.resolve();
            }
            const active = engine.get(activeId);
            if (active == null || !active.valid ||
                typeof active.basicX !== "number" ||
                typeof active.viewCompassAngle !== "number") {
                return Promise.resolve();
            }
            const endBearing = this._adoptedView != null ?
                this._bearingForView(active, this._adoptedView[0]) :
                (typeof this._liveBearing === "number" ?
                    this._mapBearing(active, this._liveBearing) :
                    this._bearingForView(
                        active, this._applyOffsetX(active.basicX)));

            return new Promise<void>((resolve: () => void): void => {
                this._navigator.stateService.getCenter().pipe(first()).subscribe(
                    (center: number[]): void => {
                        const targetY = this._adoptedView != null ?
                            this._adoptedView[1] : center[1];
                        this._hintNeighbor(
                            engine, id, endBearing, targetY).then(resolve);
                    },
                    (): void => resolve());
            });
        }).catch((): void => { /* navigation proceeds without a hint */ });
    }

    private _applyOffsetX(basicX: number): number {
        return ((basicX + this._userOffsetX) % 1 + 1) % 1;
    }

    private _bearingForView(
        result: ReorientationResult,
        basicX: number): number {
        const bearing = result.viewCompassAngle + (basicX - 0.5) * 360;
        return ((bearing % 360) + 360) % 360;
    }

    private _mapBearing(
        result: ReorientationResult,
        bearing: number): number {
        return ((bearing + result.viewCompassAngle - result.cca) % 360 + 360) % 360;
    }

    private _clearAdoptedView(): void {
        this._adoptedView = null;
        this._adoptedSequence = null;
    }

    // Spherical is the pano-to-pano step, so it counts as one here.
    private _isStep(direction: NavigationDirection): boolean {
        return direction === NavigationDirection.StepLeft ||
            direction === NavigationDirection.StepRight ||
            direction === NavigationDirection.StepForward ||
            direction === NavigationDirection.StepBackward ||
            direction === NavigationDirection.Spherical;
    }

    private _isTurn(direction: NavigationDirection): boolean {
        return direction === NavigationDirection.TurnLeft ||
            direction === NavigationDirection.TurnRight ||
            direction === NavigationDirection.TurnU;
    }

    // Pre-set a neighbor's reorientation to travel + offset, but only if it
    // would clear the threshold against the view it carries in from this image
    // (endBearing) — otherwise the step is small enough to leave alone.
    private _hintNeighbor(
        engine: ReorientationEngine,
        id: string,
        endBearing: number,
        targetY: number): Promise<void> {
        if (!this._reorientToFront) {
            return Promise.resolve();
        }
        // Depth 0: we only need this neighbor's own result cached, not another
        // forward prefetch cascade (the current image's _reorient already warms
        // ahead). Avoids re-walking the already-scheduled chain per navigation.
        return engine.precompute(id, undefined, 0)
            .then((): void => {
                if (this._engine !== engine) {
                    return;
                }
                const nr = engine.get(id);
                if (!nr || !nr.valid ||
                    typeof nr.viewCompassAngle !== "number") {
                    return;
                }
                const nTargetX = this._applyOffsetX(nr.basicX);
                const nCarriedX = bearingToBasicX(
                    endBearing, nr.viewCompassAngle);
                const nDx = Math.abs(wrapDelta(nTargetX - nCarriedX)) * 360;
                const unsafeTransition =
                    nr.computedCompassOutlier === true ||
                    nr.reconstructionDiscontinuity === true;
                // Even when the final world bearings nearly match, a rejected
                // or discontinuous pose can map that bearing to a very different
                // basic x for its first frame. Cut before it can render.
                if (unsafeTransition || nDx >= MIN_REORIENT_DEG) {
                    this._navigator.stateService.setReorientation(
                        id,
                        [nTargetX, targetY],
                        unsafeTransition);
                }
            })
            .catch((): void => { /* skip */ });
    }

    private _levelPerspective(id: string): void {
        if (!this._automaticHorizonLeveling) {
            this._clearAdoptedView();
            return;
        }
        if (this._adoptedView != null) {
            this._navigator.stateService.gravityTraverse();
            this._clearAdoptedView();
            return;
        }

        this._navigator.stateService.getCenter().pipe(first()).subscribe(
            (): void => {
                if (this._activeId !== id || this._adoptedView != null) {
                    this._clearAdoptedView();
                    return;
                }
                const target = [0.5, this._horizonY(0.5)];
                this._container.renderService.renderCameraFrame$.pipe(
                    filter((render: RenderCamera): boolean =>
                        render.currentImageId === id),
                    first(),
                ).subscribe((render: RenderCamera): void => {
                    if (this._activeId !== id || this._adoptedView != null) {
                        this._clearAdoptedView();
                        return;
                    }
                    const zoom = this._perspectiveAutoZoom(
                        target, render.unzoomedCurrentFov);
                    const stateService = this._navigator.stateService;
                    if (!this._sequenceChanged &&
                        Math.abs(render.zoom - this._appliedPerspectiveZoom) >
                            USER_ZOOM_EPSILON) {
                        this._userZoomOverride = true;
                    }
                    if (zoom == null) {
                        stateService.traverse();
                        stateService.zoomTo(
                            this._userZoomOverride ? render.zoom : 0);
                        this._appliedPerspectiveZoom = 0;
                        return;
                    }
                    stateService.gravityTraverse();
                    stateService.rotateToBasicSmooth(target);
                    stateService.zoomTo(
                        this._userZoomOverride ? render.zoom : zoom);
                    this._appliedPerspectiveZoom = zoom;
                });
            });
    }

    private _rollDeg(center: number[]): number | null {
        const transform = this._currentTransform;
        if (transform == null) {
            return null;
        }
        const origin = new THREE.Vector3().fromArray(
            transform.unprojectSfM([0, 0], 0));
        const direction = new THREE.Vector3().fromArray(
            transform.unprojectBasic(center, 10))
            .sub(origin)
            .normalize();
        const imageUp = transform.upVector()
            .addScaledVector(direction, -transform.upVector().dot(direction))
            .normalize();
        const gravityUp = new THREE.Vector3(0, 0, 1)
            .addScaledVector(direction, -direction.z)
            .normalize();
        const rollDeg = imageUp.angleTo(gravityUp) * 180 / Math.PI;
        return Number.isFinite(rollDeg) ? rollDeg : null;
    }

    private _perspectiveAutoZoom(
        center: number[], baseFov: number): number | null {
        const transform = this._currentTransform;
        const element = this._container.container;
        if (transform == null || element.offsetHeight === 0) {
            return null;
        }

        const origin = new THREE.Vector3().fromArray(
            transform.unprojectSfM([0, 0], 0));
        const rollDeg = this._rollDeg(center);
        if (rollDeg == null ||
            rollDeg > MAX_REORIENTATION_ROLL_DEG) {
            return null;
        }

        const camera = new THREE.PerspectiveCamera(
            60,
            element.offsetWidth / element.offsetHeight,
            1e-1,
            1e4);
        camera.position.copy(origin);

        const maxFov = (basic: number[], up: THREE.Vector3): number => {
            camera.up.copy(up);
            camera.lookAt(new THREE.Vector3().fromArray(
                transform.unprojectBasic(basic, 10)));
            camera.updateMatrixWorld(true);

            const fits = (fov: number): boolean => {
                camera.fov = fov;
                camera.updateProjectionMatrix();
                const corners = [
                    this._viewportCoords.viewportToBasic(
                        -1, 1, transform, camera),
                    this._viewportCoords.viewportToBasic(
                        1, 1, transform, camera),
                    this._viewportCoords.viewportToBasic(
                        1, -1, transform, camera),
                    this._viewportCoords.viewportToBasic(
                        -1, -1, transform, camera),
                ];
                return corners.every((point: number[]): boolean =>
                    point != null &&
                    point[0] >= PERSPECTIVE_EDGE_MARGIN &&
                    point[0] <= 1 - PERSPECTIVE_EDGE_MARGIN &&
                    point[1] >= PERSPECTIVE_EDGE_MARGIN &&
                    point[1] <= 1 - PERSPECTIVE_EDGE_MARGIN);
            };

            let low = 0;
            let high = MAX_PERSPECTIVE_FOV;
            for (let i = 0; i < 16; i++) {
                const middle = (low + high) / 2;
                if (fits(middle)) {
                    low = middle;
                } else {
                    high = middle;
                }
            }
            return low;
        };

        const levelFov = maxFov(center, new THREE.Vector3(0, 0, 1));
        const zoom = Math.max(0, Math.log(baseFov / levelFov) / Math.log(2));
        return Number.isFinite(zoom) && zoom <= MAX_PERSPECTIVE_AUTO_ZOOM ?
            zoom : null;
    }

    private _captureOffset(): void {
        const id = this._activeId;
        const engine = this._engine;
        if (id == null || engine == null) {
            return;
        }
        this._navigator.stateService.getCenter().pipe(first()).subscribe(
            (center: number[]): void => {
                if (this._activeId !== id || this._engine !== engine) {
                    return;
                }
                const result = engine.get(id);
                const basis = result && result.valid ?
                    result.basicX : this._computedBasicX;
                this._userOffsetX = wrapDelta(center[0] - basis);
                this._userOffsetY =
                    center[1] - this._horizonY(center[0]);
                this._ySeeded = true;
            });
    }

    private _horizonY(x: number): number {
        const transform = this._currentTransform;
        if (transform == null) {
            return 0.5;
        }

        const cameraZ = transform.unprojectSfM([0, 0], 0)[2];
        let low = 0;
        let high = 1;
        let lowZ = transform.unprojectBasic([x, low], 10)[2] - cameraZ;
        const highZ = transform.unprojectBasic([x, high], 10)[2] - cameraZ;
        if (lowZ * highZ > 0) {
            return 0.5;
        }

        for (let i = 0; i < 32; i++) {
            const middle = (low + high) / 2;
            const middleZ =
                transform.unprojectBasic([x, middle], 10)[2] - cameraZ;
            if (lowZ * middleZ > 0) {
                low = middle;
                lowZ = middleZ;
            } else {
                high = middle;
            }
        }

        const horizon = (low + high) / 2;
        return Math.abs(horizon - 0.5) * 180 <=
            MAX_HORIZON_CORRECTION_DEG ? horizon : 0.5;
    }

    private _resetOffset(): void {
        this._userOffsetX = 0;
        this._userOffsetY = 0;
        this._ySeeded = false;
    }

    private _seed(image: Image): ReorientationImage {
        const lngLat = image.lngLat;
        const originalLngLat = image.originalLngLat;
        const hasComputedCompass =
            Number.isFinite(image.computedCompassAngle);
        const hasReconstruction = hasReconstructionMesh(image.mesh);
        // Placeholder geometry can carry a computed pose that is wildly
        // inconsistent between neighboring frames. Its raw capture heading is
        // the stable center axis of the underlying panorama.
        const useOriginalCompass = !hasReconstruction &&
            hasComputedCompass &&
            Number.isFinite(image.originalCompassAngle);
        return {
            id: image.id,
            lat: lngLat ? lngLat.lat : null,
            lng: lngLat ? lngLat.lng : null,
            originalLat: originalLngLat ? originalLngLat.lat : null,
            originalLng: originalLngLat ? originalLngLat.lng : null,
            cca: useOriginalCompass ?
                image.originalCompassAngle : image.compassAngle,
            computedCca: hasComputedCompass ?
                image.computedCompassAngle : undefined,
            originalCca: Number.isFinite(image.originalCompassAngle) ?
                image.originalCompassAngle : undefined,
            // Unmerged equirectangular pixels use an east-facing axis; their
            // raw compass describes travel rather than the panorama center.
            viewCompassAngle: isSpherical(image.cameraType) &&
              !hasComputedCompass ? 90 : undefined,
            cam: image.cameraType,
            seq: image.sequenceId,
            ts: image.capturedAt,
        };
    }

    private _createProvider(): ReorientationProvider {
        const graphService = this._navigator.graphService;
        const imageCache = new Map<string, ReorientationImage>();
        return {
            fetchImage: (id: string): Promise<ReorientationImage> => {
                id = String(id);
                const cached = imageCache.get(id);
                if (cached) {
                    return Promise.resolve(cached);
                }
                return new Promise<ReorientationImage>((resolve, reject) => {
                    graphService.cacheImage$(id).pipe(first()).subscribe(
                        (image: Image): void => {
                            const o = this._seed(image);
                            imageCache.set(id, o);
                            resolve(o);
                        },
                        (e: Error): void => reject(e));
                });
            },
            cacheImage: (image: ReorientationImage): void => {
                if (image && image.id != null) {
                    imageCache.set(String(image.id), image);
                }
            },
            fetchSeqIds: (seqId: string): Promise<string[]> => {
                return new Promise<string[]>((resolve, reject) => {
                    graphService.cacheSequence$(seqId).pipe(first()).subscribe(
                        (sequence: Sequence): void => {
                            resolve((sequence.imageIds || []).map(String));
                        },
                        (e: Error): void => reject(e));
                });
            },
        };
    }
}
