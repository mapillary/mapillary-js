import {
    angleDelta,
    bearing,
    bearingToBasicX,
    haversineDist,
    ReorientationEngine,
    ReorientationImage,
    ReorientationProvider,
    wrapDelta,
} from "../../../src/component/reorientation/ReorientationEngine";

describe("ReorientationEngine.math", () => {
    it("computes an eastward bearing as ~90 degrees", () => {
        expect(bearing(0, 0, 0, 0.001)).toBeCloseTo(90, 1);
    });

    it("computes a northward bearing as ~0 degrees", () => {
        expect(bearing(0, 0, 0.001, 0)).toBeCloseTo(0, 1);
    });

    it("wraps angle deltas to the shortest arc", () => {
        expect(angleDelta(10, 350)).toBeCloseTo(20, 6);
        expect(angleDelta(0, 180)).toBeCloseTo(180, 6);
    });

    it("frames compass-forward at basic-x 0.5", () => {
        expect(bearingToBasicX(90, 90)).toBeCloseTo(0.5, 6);
    });

    it("offsets basic-x by the travel/compass difference", () => {
        // Travelling east (90) while the image faces north (0): the travel
        // direction sits a quarter-turn clockwise -> basic-x 0.75.
        expect(bearingToBasicX(90, 0)).toBeCloseTo(0.75, 6);
    });

    it("wraps basic-x deltas into the signed half-open range", () => {
        expect(wrapDelta(0.1)).toBeCloseTo(0.1, 6);
        expect(wrapDelta(0.9)).toBeCloseTo(-0.1, 6);
        expect(wrapDelta(-0.9)).toBeCloseTo(0.1, 6);
    });

    it("measures distance between nearby points in meters", () => {
        expect(haversineDist(0, 0, 0, 0.0001)).toBeGreaterThan(10);
        expect(haversineDist(0, 0, 0, 0.0001)).toBeLessThan(13);
    });
});

type Fixture = { [id: string]: ReorientationImage };

function provider(images: Fixture, seqIds: string[]): ReorientationProvider {
    return {
        fetchImage: (id: string): Promise<ReorientationImage> => {
            const image = images[String(id)];
            return image ?
                Promise.resolve(image) :
                Promise.reject(new Error("missing " + id));
        },
        fetchSeqIds: (_seqId: string): Promise<string[]> =>
            Promise.resolve(seqIds.slice()),
    };
}

function spherical(
    id: string,
    lat: number,
    lng: number,
    cca: number,
    ts: number): ReorientationImage {
    return { id, lat, lng, cca, cam: "spherical", seq: "s", ts };
}

describe("ReorientationEngine.precompute", () => {
    it("frames the travel direction for a moving image", async () => {
        // Straight eastward run, ~11 m apart, 1 s apart -> ~11 m/s, facing
        // north (cca 0) so travel east maps to basic-x 0.75. (capturedAt is an
        // epoch in ms, so use nonzero timestamps.)
        const images: Fixture = {
            a: spherical("a", 0, 0.0000, 0, 1000),
            b: spherical("b", 0, 0.0001, 0, 2000),
            c: spherical("c", 0, 0.0002, 0, 3000),
        };
        const engine = new ReorientationEngine(provider(images, ["a", "b", "c"]));

        await engine.precompute("b");
        const result = engine.get("b");

        expect(result.valid).toBe(true);
        expect(result.moving).toBe(true);
        expect(result.nextId).toBe("c");
        expect(result.basicX).toBeCloseTo(0.75, 2);
    });

    it("accepts a low-speed step as a turn when compass agrees", async () => {
        // ~11 m apart but 100 s apart -> ~0.11 m/s (below movingSpeedMps),
        // yet compass (90) agrees with eastward travel, so it counts.
        const images: Fixture = {
            a: spherical("a", 0, 0.0000, 90, 1000),
            b: spherical("b", 0, 0.0001, 90, 101000),
        };
        const engine = new ReorientationEngine(provider(images, ["a", "b"]));

        await engine.precompute("a");
        const result = engine.get("a");

        expect(result.valid).toBe(true);
        expect(result.moving).toBe(true);
    });

    it("invalidates the last image in a sequence", async () => {
        const images: Fixture = {
            a: spherical("a", 0, 0.0000, 0, 0),
            b: spherical("b", 0, 0.0001, 0, 1000),
        };
        const engine = new ReorientationEngine(provider(images, ["a", "b"]));

        await engine.precompute("b");
        const result = engine.get("b");

        expect(result.valid).toBe(false);
        expect(result.reason).toBe("End of sequence");
    });

    it("skips non-spherical images", async () => {
        const images: Fixture = {
            a: { id: "a", lat: 0, lng: 0, cca: 0, cam: "perspective", seq: "s", ts: 0 },
            b: spherical("b", 0, 0.0001, 0, 1000),
        };
        const engine = new ReorientationEngine(provider(images, ["a", "b"]));

        await engine.precompute("a");
        const result = engine.get("a");

        expect(result.valid).toBe(false);
        expect(result.reason).toContain("Camera");
    });

    it("reuses the cache instead of recomputing", async () => {
        let fetches = 0;
        const base = provider(
            {
                a: spherical("a", 0, 0.0000, 0, 0),
                b: spherical("b", 0, 0.0001, 0, 1000),
                c: spherical("c", 0, 0.0002, 0, 2000),
            },
            ["a", "b", "c"]);
        const counting: ReorientationProvider = {
            fetchImage: (id: string) => { fetches++; return base.fetchImage(id); },
            fetchSeqIds: base.fetchSeqIds,
        };
        const engine = new ReorientationEngine(counting);

        await engine.precompute("b");
        const before = fetches;
        await engine.precompute("b");

        expect(fetches).toBe(before);
    });
});
