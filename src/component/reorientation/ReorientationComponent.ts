import { Observable, Subject } from "rxjs";
import { first } from "rxjs/operators";

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
    wrapDelta,
} from "./ReorientationEngine";

import { Image } from "../../graph/Image";
import { NavigationDirection } from "../../graph/edge/NavigationDirection";
import { Sequence } from "../../graph/Sequence";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";

// Skip a reorientation when it would move the current view less than this many
// degrees (on either axis) — small moves are just jitter.
const MIN_REORIENT_DEG = 15;

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
 * @classdesc Reorients each spherical image to face the direction of travel
 * (the great-circle bearing toward the next image in the sequence) as the
 * user navigates, instead of preserving the previous look direction. If the
 * user drags to look around, that manual offset is preserved across the rest
 * of the sequence rather than re-facing forward on every step.
 *
 * Crossing into a new sequence with a direction arrow keeps the carried view
 * rather than snapping to travel — the arrow's own transition already matched
 * the angle — and adopts it as the new sequence's look-around offset. Every
 * other way into a new sequence — Next/Prev, map click, shared link, fresh
 * load — resets to travel + horizon.
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
    private _reorientOnSpatialNav: boolean;
    private _adoptedView: number[];
    private _settled$ = new Subject<ReorientationSettledEvent>();

    // Manual horizontal look-around offset, preserved within a sequence so the
    // engine doesn't yank the view back to the travel direction on every step.
    private _userOffsetX: number;

    // Vertical look offset from the horizon. Seeded once per activation from the
    // current view (so a shared link's y / carried pitch is kept) and updated on
    // drag, then applied deterministically as 0.5 + offset. Re-reading the live
    // y every image round-trips through the spherical projection and drifts, so
    // it is held, not re-read.
    private _userOffsetY: number;
    private _ySeeded: boolean;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void {
        const subs = this._subscriptions;

        subs.push(this._configuration$.subscribe(
            (configuration: ReorientationConfiguration): void => {
                this._reorientOnSpatialNav =
                    configuration.reorientOnSpatialNav ??
                    DEFAULT_REORIENTATION_CONFIGURATION.reorientOnSpatialNav;
                this._engine = new ReorientationEngine(
                    this._createProvider(), configuration);
                this._activeId = null;
                this._computedBasicX = 0.5;
                this._lastSeq = null;
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
                const fromId = this._activeId;
                this._activeId = image.id;
                // Consume the direction here, synchronously with the landing, so
                // it attributes to this image and not a later re-emit.
                const direction = this._navigator.consumeMoveDirection();
                this._reorient(image, direction, fromId);
            }));

        // A finished drag is a genuine user look-around (our own steering goes
        // through the state, not pointer events), so capture the offset.
        subs.push(this._container.mouseService.mouseDragEnd$.subscribe(
            (): void => { this._captureOffset(); }));
    }

    protected _deactivate(): void {
        this._subscriptions.unsubscribe();
        this._engine = null;
        this._activeId = null;
        this._lastSeq = null;
        this._resetOffset();
    }

    protected _getDefaultConfiguration(): ReorientationConfiguration {
        return {};
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

    public getReorientedBearing(id: string): number | null {
        const engine = this._engine;
        if (!engine) {
            return null;
        }
        const result = engine.get(id);
        if (!result || !result.valid || typeof result.travel !== "number") {
            return null;
        }
        // The look-around offset belongs to the active sequence and is reset on
        // a cross-sequence jump, so apply it only to same-sequence ids —
        // otherwise the hover cone predicts travel+offset while the actual
        // landing (fresh sequence → offset 0) shows plain travel.
        const offset = result.seq != null && result.seq === this._lastSeq ?
            this._userOffsetX * 360 : 0;
        return ((result.travel + offset) % 360 + 360) % 360;
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
    }

    /**
     * Whether navigating to the given image with a direction arrow would
     * reorient it, rather than keeping the view the arrow carries across.
     *
     * Lets a host predict the heading the user is about to land on: the
     * {@link getReorientedBearing} value when this is true, the viewer's
     * current bearing when it is false. Only an arrow onto the immediate
     * neighbour within the current sequence reorients — a sideways hop or a
     * sequence crossing keeps the carried view.
     */
    public reorientsOnSpatialNavTo(id: string): boolean {
        const engine = this._engine;
        if (!this._reorientOnSpatialNav ||
            engine == null ||
            this._activeId == null) {
            return false;
        }
        const from = engine.get(this._activeId);
        const to = engine.get(id);
        if (from == null || !from.valid || to == null || !to.valid) {
            return false;
        }
        if (to.seq == null || to.seq !== this._lastSeq) {
            return false;
        }

        return from.nextId === id || from.prevId === id;
    }

    private _reorient(
        image: Image,
        direction: NavigationDirection,
        fromId: string): void {
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
                // Read mesh now (after the precompute delay) so it's loaded:
                // an image with SfM mesh eases to the travel direction, one
                // without (disconnected) hard-cuts. The transition type is NOT
                // used — an SfM image eases however you arrive (fresh URL,
                // in-sequence step, or feed-click jump).
                const meshV = image.mesh && image.mesh.vertices ?
                    image.mesh.vertices.length : -1;
                const hardCut = meshV <= 0;
                if (!result || !result.valid) {
                    // An adopted view belongs to the navigation that supplied
                    // it. A landing image that cannot be reoriented never
                    // consumes it, and leaving it set would frame whichever
                    // pano resolves next with a stale look-around offset.
                    this._adoptedView = null;

                    return;
                }
                this._computedBasicX = result.basicX;

                // A fresh load or a jump to another capture lands on a new
                // sequence; reorient it even if the landing image's GPS speed
                // reads as stationary. Within a sequence, preserve the view when
                // not moving rather than spinning on jitter.
                const freshSequence =
                    result.seq != null && result.seq !== this._lastSeq;
                this._lastSeq = result.seq;

                // An arrow move already lands at the heading the user was
                // looking at, because the state layer carries the view across
                // the image change. Crossing into a new sequence that way keeps
                // that view and adopts it as this sequence's look-around offset,
                // so nothing rotates here and the following in-sequence steps
                // preserve the framing the user arrived with. Everything else
                // (Next/Prev, map click, shared link, fresh load) resets to
                // travel.
                const spatialNav =
                    this._isStep(direction) || this._isTurn(direction);
                const leftAnother = fromId != null && fromId !== id;
                const fromResult = leftAnother ? engine.get(fromId) : null;
                const neighbor = fromResult != null &&
                    (fromResult.nextId === id || fromResult.prevId === id);
                // An arrow that lands somewhere other than the image next to
                // the one we left is a sideways hop, not a step along the road:
                // a parallel pass, or the return leg of a capture that doubles
                // back, whose travel direction can be the reverse of ours.
                // Facing its travel would swing the user around, so treat it
                // like a sequence crossing and keep the carried view.
                const lateralHop =
                    spatialNav && leftAnother && fromResult != null && !neighbor;
                const carryView = spatialNav && (freshSequence || lateralHop);
                const resetView = freshSequence && !carryView;

                if (freshSequence) {
                    // Drop look-ahead hints from the prior sequence so nothing
                    // carries over; this sequence registers its own as it goes.
                    this._navigator.stateService.clearReorientations();
                }

                // Within a sequence an arrow step is where reorientation earns
                // its keep: the carried view drifts off-axis as the road bends.
                // Opt out to compare against plain carried-view navigation.
                if (spatialNav && !freshSequence &&
                    !this._reorientOnSpatialNav) {
                    this._adoptedView = null;

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
                    pitchResetDeg = Math.abs(this._userOffsetY) * 180;
                    this._userOffsetX = 0;
                    this._userOffsetY = 0;
                    this._ySeeded = true;
                }
                // A directionless landing on an image that isn't a neighbour of
                // the one we left is a jump (map click, URL/pKey change), not a
                // step: the incoming view says nothing about the new position,
                // so there is nothing worth preserving.
                const jump = direction == null && leftAnother && !neighbor;

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
                            this._adoptedView = null;
                            viewX = adopted[0];
                            this._userOffsetX =
                                wrapDelta(adopted[0] - result.basicX);
                            this._userOffsetY = adopted[1] - 0.5;
                            this._ySeeded = true;
                        }
                        // Seed the held pitch offset once from the loaded view.
                        if (!this._ySeeded) {
                            this._userOffsetY = center[1] - 0.5;
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
                        const targetY =
                            Math.max(0, Math.min(1, 0.5 + this._userOffsetY));

                        const targetX = this._applyOffsetX(result.basicX);

                        // Horizontal only: the pitch is held deterministically,
                        // so the live y wobbles with spherical-projection round-
                        // trip noise (~0.1 ≈ 18°). Gating on it would just snap
                        // back projection drift — the very jitter we're avoiding.
                        const dxDeg =
                            Math.abs(wrapDelta(targetX - viewX)) * 360;
                        // Reorient if the horizontal move clears the threshold,
                        // or (on a sequence change) the pitch must reset by more
                        // than the threshold to clear a carried look up/down.
                        const move = dxDeg >= MIN_REORIENT_DEG ||
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
                        if (typeof result.cca === "number") {
                            const endX = move ? targetX : viewX;
                            const endBearing = result.cca + (endX - 0.5) * 360;
                            // Carrying the view moves no camera, so a host
                            // watching bearing events would never learn where
                            // this image ended up. Tell it outright.
                            this._settled$.next({
                                id,
                                bearing: ((endBearing % 360) + 360) % 360,
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

    private _applyOffsetX(basicX: number): number {
        return ((basicX + this._userOffsetX) % 1 + 1) % 1;
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
        targetY: number): void {
        // Depth 0: we only need this neighbor's own result cached, not another
        // forward prefetch cascade (the current image's _reorient already warms
        // ahead). Avoids re-walking the already-scheduled chain per navigation.
        engine.precompute(id, undefined, 0)
            .then((): void => {
                if (this._engine !== engine) {
                    return;
                }
                const nr = engine.get(id);
                if (!nr || !nr.valid || typeof nr.cca !== "number") {
                    return;
                }
                const nTargetX = this._applyOffsetX(nr.basicX);
                const nCarriedX = bearingToBasicX(endBearing, nr.cca);
                const nDx = Math.abs(wrapDelta(nTargetX - nCarriedX)) * 360;
                if (nDx >= MIN_REORIENT_DEG) {
                    this._navigator.stateService
                        .setReorientation(id, [nTargetX, targetY]);
                }
            })
            .catch((): void => { /* skip */ });
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
                this._userOffsetY = center[1] - 0.5;
                this._ySeeded = true;
            });
    }

    private _resetOffset(): void {
        this._userOffsetX = 0;
        this._userOffsetY = 0;
        this._ySeeded = false;
    }

    private _seed(image: Image): ReorientationImage {
        const lngLat = image.lngLat;
        const originalLngLat = image.originalLngLat;
        return {
            id: image.id,
            lat: lngLat ? lngLat.lat : null,
            lng: lngLat ? lngLat.lng : null,
            originalLat: originalLngLat ? originalLngLat.lat : null,
            originalLng: originalLngLat ? originalLngLat.lng : null,
            cca: image.computedCompassAngle,
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
