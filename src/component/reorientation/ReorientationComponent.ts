import { first } from "rxjs/operators";

import { Component } from "../Component";
import { ComponentName } from "../ComponentName";
import { ReorientationConfiguration }
    from "../interfaces/ReorientationConfiguration";
import {
    bearingToBasicX,
    ReorientationEngine,
    ReorientationImage,
    ReorientationProvider,
    wrapDelta,
} from "./ReorientationEngine";

import { Image } from "../../graph/Image";
import { Sequence } from "../../graph/Sequence";
import { Container } from "../../viewer/Container";
import { Navigator } from "../../viewer/Navigator";

// Skip a reorientation when it would move the current view less than this many
// degrees (on either axis) — small moves are just jitter.
const MIN_REORIENT_DEG = 15;

/**
 * @class ReorientationComponent
 *
 * @classdesc Reorients each spherical image to face the direction of travel
 * (the great-circle bearing toward the next image in the sequence) as the
 * user navigates, instead of preserving the previous look direction. If the
 * user drags to look around, that manual offset is preserved across the rest
 * of the sequence rather than re-facing forward on every step. Active by
 * default; disable with `component: { reorientation: false }`.
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
                this._engine = new ReorientationEngine(
                    this._createProvider(), configuration);
                this._activeId = null;
                this._computedBasicX = 0.5;
                this._lastSeq = null;
                this._resetOffset();
            }));

        // currentImage$ fires reliably on every navigation, including in-app
        // jumps to another sequence (currentState$ did not deliver those).
        subs.push(this._navigator.stateService.currentImage$.subscribe(
            (image: Image): void => {
                if (!image) {
                    return;
                }
                this._activeId = image.id;
                this._reorient(image);
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

    private _reorient(image: Image): void {
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
                    return;
                }
                this._computedBasicX = result.basicX;

                // A fresh load or a jump to another capture lands on a new
                // sequence; reorient it to travel direction even if the landing
                // image's GPS speed reads as stationary. Within a sequence,
                // preserve the view when not moving rather than spinning on
                // jitter.
                const freshSequence =
                    result.seq != null && result.seq !== this._lastSeq;
                this._lastSeq = result.seq;
                // Pitch is tracked deterministically via the offset (the live
                // view y drifts ~18° through the spherical projection, so it
                // can't be measured per image). On a sequence change the held
                // pitch resets to horizon; the reset amount is how far the
                // carried pitch must move, used to force a reorientation even
                // when the horizontal change is small.
                let pitchResetDeg = 0;
                if (freshSequence) {
                    // Don't carry x/pitch/rotation offsets across sequences:
                    // start fresh at travel direction + horizon. A cross-sequence
                    // jump carries the prior image's view, which would otherwise
                    // persist the previous sequence's pitch (e.g. "looking down").
                    pitchResetDeg = Math.abs(this._userOffsetY) * 180;
                    this._userOffsetX = 0;
                    this._userOffsetY = 0;
                    this._ySeeded = true;
                    // Drop look-ahead hints from the prior sequence so nothing
                    // carries over; this sequence registers its own as it goes.
                    this._navigator.stateService.clearReorientations();
                }
                if (!result.moving && !freshSequence) {
                    // Low motion within the current sequence — preserve the view.
                    return;
                }

                // Horizontal target: travel direction plus any manual offset.
                const targetX = this._applyOffsetX(result.basicX);

                // Read this image's current view and reorient only if doing so
                // would move it past the threshold on either axis — otherwise
                // the move is just jitter. Measured per image (current view →
                // target), not accumulated from a prior image.
                this._navigator.stateService.getCenter().pipe(first()).subscribe(
                    (center: number[]): void => {
                        if (this._activeId !== id || this._engine !== engine) {
                            return;
                        }
                        // Seed the held pitch offset once from the loaded view.
                        if (!this._ySeeded) {
                            this._userOffsetY = center[1] - 0.5;
                            this._ySeeded = true;
                        }
                        const targetY =
                            Math.max(0, Math.min(1, 0.5 + this._userOffsetY));

                        // Horizontal only: the pitch is held deterministically,
                        // so the live y wobbles with spherical-projection round-
                        // trip noise (~0.1 ≈ 18°). Gating on it would just snap
                        // back projection drift — the very jitter we're avoiding.
                        const dxDeg =
                            Math.abs(wrapDelta(targetX - center[0])) * 360;
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

                        // Pre-orient the next image (hint) so a hard cut to it
                        // doesn't flash the carried view — but only if its
                        // reorientation would also clear the threshold. This is
                        // cross-image, so reason in absolute bearings: the view
                        // the next image carries in is where this one ends up.
                        if (result.nextId && typeof result.cca === "number") {
                            const endX = move ? targetX : center[0];
                            const endBearing =
                                result.cca + (endX - 0.5) * 360;
                            const nid = String(result.nextId);
                            engine.precompute(nid)
                                .then((): void => {
                                    if (this._engine !== engine) {
                                        return;
                                    }
                                    const nr = engine.get(nid);
                                    if (!nr || !nr.valid ||
                                        typeof nr.cca !== "number") {
                                        return;
                                    }
                                    const nTargetX = this._applyOffsetX(nr.basicX);
                                    const nCarriedX =
                                        bearingToBasicX(endBearing, nr.cca);
                                    const nDx = Math.abs(
                                        wrapDelta(nTargetX - nCarriedX)) * 360;
                                    if (nDx >= MIN_REORIENT_DEG) {
                                        this._navigator.stateService
                                            .setReorientation(
                                                nid, [nTargetX, targetY]);
                                    }
                                })
                                .catch((): void => { /* skip */ });
                        }
                    });
            })
            .catch((): void => { /* skip images we can't resolve */ });
    }

    private _applyOffsetX(basicX: number): number {
        return ((basicX + this._userOffsetX) % 1 + 1) % 1;
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
        return {
            id: image.id,
            lat: lngLat ? lngLat.lat : null,
            lng: lngLat ? lngLat.lng : null,
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
