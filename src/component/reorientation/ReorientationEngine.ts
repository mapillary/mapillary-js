import { ReorientationConfiguration } from "../interfaces/ReorientationConfiguration";

/**
 * Minimal image metadata the engine reasons about, decoupled from the
 * graph implementation so the engine can be unit tested with a fake
 * {@link ReorientationProvider}.
 */
export interface ReorientationImage {
    id: string;
    lat: number;
    lng: number;
    cca: number;
    cam: string;
    seq: string;
    ts: number;
}

/**
 * Data source for the engine. The component implements this on top of the
 * viewer's graph service; tests implement it with canned data.
 */
export interface ReorientationProvider {
    fetchImage(id: string): Promise<ReorientationImage>;
    fetchSeqIds(seqId: string): Promise<string[]>;
    cacheImage?(image: ReorientationImage): void;
}

/**
 * Outcome of resolving the reorientation for a single image.
 */
export interface ReorientationResult {
    valid: boolean;
    reason?: string;
    nextId?: string;
    travel?: number;
    basicX?: number;
    dist?: number;
    cca?: number;
    speed?: number;
    moving?: boolean;
    seq?: string;
}

export const DEFAULT_REORIENTATION_CONFIGURATION:
    Required<ReorientationConfiguration> = {
    prefetchAhead: 3,
    movingSpeedMps: 1,
    lowSpeedTurnDistanceM: 2,
    lowSpeedTurnMaxDeltaDeg: 30,
    outlierMaxDeltaDeg: 90,
    previousContextWindow: 5,
    movingHistoryWindow: 10,
    fallbackHistoryWindow: 100,
};

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const EARTH_RADIUS_METERS = 6371000;

function isNum(v: number): boolean {
    return typeof v === "number" && Number.isFinite(v);
}

function hasPosition(o: ReorientationImage): boolean {
    return !!o && isNum(o.lat) && isNum(o.lng);
}

/** Smallest absolute angular difference between two bearings, in degrees. */
export function angleDelta(a: number, b: number): number {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}

/** Wrap a basic-x delta into the signed half-open range (-0.5, 0.5]. */
export function wrapDelta(d: number): number {
    return ((d % 1) + 1.5) % 1 - 0.5;
}

export function haversineDist(
    lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLat = (lat2 - lat1) * RAD;
    const dLon = (lon2 - lon1) * RAD;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
    return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Great-circle bearing, degrees clockwise from north (compass convention). */
export function bearing(
    lat1: number, lon1: number, lat2: number, lon2: number): number {
    const p1 = lat1 * RAD;
    const p2 = lat2 * RAD;
    const dl = (lon2 - lon1) * RAD;
    const y = Math.sin(dl) * Math.cos(p2);
    const x = Math.cos(p1) * Math.sin(p2) -
        Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return (Math.atan2(y, x) * DEG + 360) % 360;
}

/**
 * Basic horizontal coordinate (0..1) that frames the given travel bearing.
 * 0.5 is the image's compass-forward; offset by (travel - cca) / 360.
 */
export function bearingToBasicX(travelBrg: number, cca: number): number {
    return (((travelBrg - cca) / 360) + 0.5 + 1) % 1;
}

interface PrevContext {
    valid: boolean;
    moving: boolean;
    speed: number;
    travel: number;
}

/**
 * Resolves, for an image in a sequence, the basic-x that frames the
 * direction of travel toward the next image. Motion is detected from GPS
 * speed with a low-speed-turn allowance, GPS outliers are rejected against
 * recent bearings, and stationary images fall back to the last confirmed
 * moving bearing so the view is preserved rather than spun by noise.
 *
 * Pure with respect to the injected {@link ReorientationProvider}; holds an
 * internal cache so prefetched results are reused and prior-image context is
 * available without refetching.
 */
export class ReorientationEngine {
    private _provider: ReorientationProvider;
    private _config: Required<ReorientationConfiguration>;
    private _cache: Map<string, ReorientationResult>;
    private _pending: Map<string, Promise<void>>;

    constructor(
        provider: ReorientationProvider,
        config?: ReorientationConfiguration) {
        this._provider = provider;
        this._config = {
            ...DEFAULT_REORIENTATION_CONFIGURATION,
            ...(config || {}),
        };
        this._cache = new Map<string, ReorientationResult>();
        this._pending = new Map<string, Promise<void>>();
    }

    public get(id: string): ReorientationResult | null {
        return this._cache.get(String(id)) || null;
    }

    public precompute(
        imgId: string,
        seed?: ReorientationImage,
        depth?: number): Promise<void> {
        const cfg = this._config;
        imgId = String(imgId);
        if (depth == null) {
            depth = cfg.prefetchAhead;
        }
        if (this._cache.has(imgId)) {
            this._prefetchNext(this._cache.get(imgId), depth);
            return Promise.resolve();
        }
        if (this._pending.has(imgId)) {
            return this._pending.get(imgId).then(() => {
                this._prefetchNext(this._cache.get(imgId), depth);
            });
        }

        let p: Promise<ReorientationImage>;
        if (seed && isNum(seed.lat) && isNum(seed.lng)) {
            if (typeof this._provider.cacheImage === "function") {
                this._provider.cacheImage(seed);
            }
            p = Promise.resolve(seed);
        } else {
            p = this._provider.fetchImage(imgId);
        }

        // Share in-flight work so callers wait until the cache is populated.
        const work = p.then((cur) => this._resolve(imgId, cur, depth))
            .catch((e: Error) => { this._invalid(imgId, e && e.message); })
            .then(() => { this._pending.delete(imgId); });
        this._pending.set(imgId, work);
        return work;
    }

    private _resolve(
        imgId: string,
        cur: ReorientationImage,
        depth: number): Promise<void> {
        const reason = this._currentInvalidReason(cur);
        if (reason) {
            this._invalid(imgId, reason);
            return Promise.resolve();
        }
        return this._provider
            .fetchSeqIds(cur.seq)
            .then((ids) => {
                const idx = ids.indexOf(String(imgId));
                if (idx < 0) {
                    this._invalid(imgId, "Image not in sequence");
                    return;
                }
                if (idx >= ids.length - 1) {
                    this._invalid(imgId, "End of sequence");
                    return;
                }
                const nextId = ids[idx + 1];
                return this._provider.fetchImage(nextId).then((nxt) => {
                    if (!hasPosition(nxt)) {
                        this._invalid(imgId, "Next image missing geometry");
                        return;
                    }
                    return this._decide(imgId, cur, nxt, ids, idx, nextId, depth);
                });
            });
    }

    private _decide(
        imgId: string,
        cur: ReorientationImage,
        nxt: ReorientationImage,
        ids: string[],
        idx: number,
        nextId: string,
        depth: number): Promise<void> {
        const cfg = this._config;
        const dist = haversineDist(cur.lat, cur.lng, nxt.lat, nxt.lng);
        let tb = bearing(cur.lat, cur.lng, nxt.lat, nxt.lng);
        const dt = (nxt.ts && cur.ts) ? (nxt.ts - cur.ts) / 1000 : 0;
        const speed = dt > 0 ? dist / dt : 0;
        let moving = false;

        let prevCtx: PrevContext = null;
        for (let bi = idx - 1;
            bi >= 0 && bi >= idx - cfg.previousContextWindow; bi--) {
            const pd = this._cache.get(ids[bi]);
            if (pd && pd.valid) {
                prevCtx = {
                    valid: true,
                    moving: pd.moving,
                    speed: pd.speed,
                    travel: pd.travel,
                };
                break;
            }
        }

        let prevPromise: Promise<PrevContext> = Promise.resolve(prevCtx);
        if (!prevCtx && idx > 0) {
            prevPromise = this._provider.fetchImage(ids[idx - 1])
                .then((prev) => {
                    if (!hasPosition(prev)) {
                        return null;
                    }
                    const pDist =
                        haversineDist(prev.lat, prev.lng, cur.lat, cur.lng);
                    const pTravel =
                        bearing(prev.lat, prev.lng, cur.lat, cur.lng);
                    const pDt = (cur.ts && prev.ts) ?
                        (cur.ts - prev.ts) / 1000 : 0;
                    const pSpeed = pDt > 0 ? pDist / pDt : 0;
                    let pMoving = pSpeed >= cfg.movingSpeedMps;
                    if (!pMoving && isNum(prev.cca)) {
                        const pDelta = angleDelta(pTravel, prev.cca);
                        if (pDelta < cfg.lowSpeedTurnMaxDeltaDeg &&
                            pDist > cfg.lowSpeedTurnDistanceM) {
                            pMoving = true;
                        }
                    }
                    return {
                        valid: true,
                        moving: pMoving,
                        speed: pSpeed,
                        travel: pTravel,
                    };
                })
                .catch(() => null);
        }

        return prevPromise.then((prev) => {
            if (speed >= cfg.movingSpeedMps) {
                // On direct jumps there is no prior segment, so only the
                // first image in a sequence may assume sustained motion.
                moving = prev ?
                    (prev.moving || prev.speed >= cfg.movingSpeedMps) :
                    (idx === 0);
            } else {
                // Low speed — accept only as a genuine turn, not GPS noise,
                // when the compass angle aligns with the travel bearing.
                const ccaDelta = angleDelta(tb, cur.cca);
                if (ccaDelta < cfg.lowSpeedTurnMaxDeltaDeg &&
                    dist > cfg.lowSpeedTurnDistanceM) {
                    moving = true;
                }
            }

            if (moving) {
                if (prev && prev.moving) {
                    if (angleDelta(tb, prev.travel) > cfg.outlierMaxDeltaDeg) {
                        moving = false;
                    }
                } else {
                    for (let bi = idx - 1;
                        bi >= 0 && bi >= idx - cfg.movingHistoryWindow; bi--) {
                        const pd = this._cache.get(ids[bi]);
                        if (pd && pd.valid && pd.moving) {
                            if (angleDelta(tb, pd.travel) >
                                cfg.outlierMaxDeltaDeg) {
                                moving = false;
                            }
                            break;
                        }
                    }
                }
            }

            // If not moving, hold the last confirmed moving bearing so the
            // view is preserved instead of spun by stationary GPS jitter.
            if (!moving) {
                let hasFallback = false;
                for (let bi = idx - 1;
                    bi >= 0 && bi >= idx - cfg.fallbackHistoryWindow; bi--) {
                    const pd = this._cache.get(ids[bi]);
                    if (pd && pd.valid && pd.moving) {
                        tb = pd.travel;
                        hasFallback = true;
                        break;
                    }
                }
                if (!hasFallback && prev && prev.moving) {
                    tb = prev.travel;
                    hasFallback = true;
                }
                if (!hasFallback && idx === 0) {
                    moving = true;
                }
            }

            const result: ReorientationResult = {
                valid: true,
                nextId,
                travel: tb,
                basicX: bearingToBasicX(tb, cur.cca),
                dist,
                cca: cur.cca,
                speed,
                moving,
                seq: cur.seq,
            };
            this._cache.set(imgId, result);
            this._prefetchNext(result, depth);
        });
    }

    private _prefetchNext(d: ReorientationResult, depth: number): void {
        if (depth > 0 && d && d.valid && d.nextId) {
            this.precompute(d.nextId, null, depth - 1)
                .catch(() => { /* ignore prefetch errors */ });
        }
    }

    private _invalid(imgId: string, reason: string): void {
        this._cache.set(String(imgId), { valid: false, reason });
    }

    private _currentInvalidReason(cur: ReorientationImage): string | null {
        if (!cur) {
            return "Missing image metadata";
        }
        if (cur.cam !== "spherical" && cur.cam !== "equirectangular") {
            return "Camera: " + (cur.cam || "unknown");
        }
        if (!hasPosition(cur)) {
            return "Missing geometry";
        }
        if (!isNum(cur.cca)) {
            return "Missing compass angle";
        }
        if (!cur.seq) {
            return "No sequence";
        }
        return null;
    }
}
