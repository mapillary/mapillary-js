import {
    horizonPitchDeg,
    isLevelPlausible,
} from "../../../src/component/reorientation/ReorientationComponent";

/**
 * Sequence 1lt7kgfezr0ysp9vmlirl4, measured in the viewer. Images without a
 * reconstruction mesh never reach the plausibility check and are omitted.
 */
const MEASURED: { id: string, rollDeg: number, horizonY: number }[] = [
    { id: "915416489297910", rollDeg: 1.08, horizonY: 0.3795 },
    { id: "520184629350307", rollDeg: 11, horizonY: 0.3817 },
    { id: "535844770743193", rollDeg: 5.73, horizonY: 0.2645 },
    { id: "818284102398965", rollDeg: 4.85, horizonY: 0.374 },
    { id: "764978360865844", rollDeg: 0.29, horizonY: 0.3128 },
    { id: "4134207483305086", rollDeg: 34, horizonY: 0.4995 },
    { id: "784577412247663", rollDeg: 7.68, horizonY: 0.7393 },
];

const BAD = [
    "535844770743193",
    "4134207483305086",
    "784577412247663",
];

function replay(
    images: { id: string, rollDeg: number, horizonY: number }[]): string[] {
    let baselineRoll: number = null;
    let baselinePitch: number = null;
    const rejected: string[] = [];
    for (const image of images) {
        const pitchDeg = horizonPitchDeg(image.horizonY);
        if (isLevelPlausible(
            image.rollDeg,
            pitchDeg,
            baselineRoll,
            baselinePitch)) {
            baselineRoll = image.rollDeg;
            baselinePitch = pitchDeg;
        } else {
            rejected.push(image.id);
        }
    }
    return rejected;
}

describe("isLevelPlausible", () => {
    it("accepts a level pose when the sequence has no baseline", () => {
        expect(isLevelPlausible(0, 0, null, null)).toBe(true);
    });

    it("accepts a pose that stays close to the baseline", () => {
        expect(isLevelPlausible(2, 21.3, 1, 21.7)).toBe(true);
    });

    it("rejects a pose whose roll jumps away from the baseline", () => {
        expect(isLevelPlausible(34, 0, 1, 0)).toBe(false);
    });

    it("accepts a consistently tilted camera", () => {
        expect(isLevelPlausible(34, 2, 30, 0)).toBe(true);
    });

    it("rejects a pose whose pitch jumps away from the baseline", () => {
        expect(isLevelPlausible(5.73, 42.4, 11, 21.3)).toBe(false);
    });

    it("rejects a pose in either pitch direction", () => {
        expect(isLevelPlausible(7.68, -43.1, 0.29, 33.7)).toBe(false);
    });

    it("rejects non-finite measurements", () => {
        expect(isLevelPlausible(NaN, 0, null, null)).toBe(false);
        expect(isLevelPlausible(0, NaN, null, null)).toBe(false);
    });

    it("accepts the first pose without a consistency baseline", () => {
        expect(isLevelPlausible(34, 60, null, null)).toBe(true);
    });
});

describe("horizonPitchDeg", () => {
    it("reports no correction for a centred horizon", () => {
        expect(horizonPitchDeg(0.5)).toBeCloseTo(0, 6);
    });

    it("reports a positive correction for a horizon above centre", () => {
        expect(horizonPitchDeg(0.25)).toBeCloseTo(45, 6);
    });
});

describe("isLevelPlausible.sequence", () => {
    it("rejects exactly the badly reoriented images of the repro", () => {
        expect(replay(MEASURED)).toEqual(BAD);
    });

    it("keeps levelling the images after a rejected one", () => {
        const rejected = replay(MEASURED);
        expect(rejected).not.toContain("818284102398965");
        expect(rejected).not.toContain("764978360865844");
    });

    it("recovers a baseline after a sequence reset", () => {
        const afterReset = replay([MEASURED[6]]);
        expect(afterReset).toEqual([]);
    });
});
