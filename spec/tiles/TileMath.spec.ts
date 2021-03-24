import {
    TileCoords2D,
    TileCoords3D,
    TileImageSize,
    TileLevel,
} from "../../src/tiles/interfaces/TileTypes";
import {
    baseImageLevel,
    basicToTileCoords2D,
    clampedImageLevel,
    cornersToTilesCoords2D,
    hasOverlap2D,
    levelScale,
    levelTilePixelSize,
    rawImageLevel,
    sizeToLevelColumnsRows,
    tileSize,
    tileToPixelCoords2D,
    verifySize,
} from "../../src/tiles/TileMath";

const NUM_DIGITS = 5;

describe("tileSize", () => {
    it("should return 1024", () => {
        expect(tileSize()).toBe(1024);
    });
});

describe("levelScale", () => {
    it("should handle relative levels", () => {
        expect(levelScale({ max: 1, z: 1 })).toBe(1);
        expect(levelScale({ max: 0, z: 0 })).toBe(1);
        expect(levelScale({ max: 11, z: 11 })).toBe(1);
        expect(levelScale({ max: 2, z: 0 })).toBe(1 / 2 ** 2);
        expect(levelScale({ max: 0, z: 2 })).toBe(2 ** 2);
        expect(levelScale({ max: 11, z: 3 }))
            .toBeCloseTo(1 / 2 ** 8, NUM_DIGITS);
        expect(levelScale({ max: 14, z: 11 })).toBe(1 / 2 ** 3);
        expect(levelScale({ max: 11, z: 14 })).toBe(2 ** 3);
    });
});

describe("levelTilePixelSize", () => {
    it("should handle relative levels", () => {
        const ts = tileSize();
        expect(levelTilePixelSize({ max: 0, z: 0 })).toBe(ts);
        expect(levelTilePixelSize({ max: 1, z: 1 })).toBe(ts);
        expect(levelTilePixelSize({ max: 11, z: 11 })).toBe(ts);
        expect(levelTilePixelSize({ max: 2, z: 0 })).toBe(ts * 2 ** 2);
        expect(levelTilePixelSize({ max: 0, z: 2 })).toBe(ts / 2 ** 2);
        expect(levelTilePixelSize({ max: 14, z: 11 })).toBe(ts * 2 ** 3);
        expect(levelTilePixelSize({ max: 11, z: 14 })).toBe(ts / 2 ** 3);

    });
});

describe("rawImageLevel", () => {
    it("should be 0", () => {
        let raw = rawImageLevel({ w: 0, h: 1 });
        expect(raw).toBeCloseTo(0);

        raw = rawImageLevel({ w: 1, h: 0 });
        expect(raw).toBeCloseTo(0, NUM_DIGITS);

        raw = rawImageLevel({ w: 1, h: 1 });
        expect(raw).toBeCloseTo(0, NUM_DIGITS);
    });

    it("should be 1", () => {
        let raw = rawImageLevel({ w: 2, h: 1 });
        expect(raw).toBeCloseTo(1, NUM_DIGITS);

        raw = rawImageLevel({ w: 1, h: 2 });
        expect(raw).toBeCloseTo(1, NUM_DIGITS);

        raw = rawImageLevel({ w: 2, h: 2 });
        expect(raw).toBeCloseTo(1, NUM_DIGITS);
    });

    it("should be 2", () => {
        let raw = rawImageLevel({ w: 4, h: 1 });
        expect(raw).toBeCloseTo(2, NUM_DIGITS);

        raw = rawImageLevel({ w: 1, h: 4 });
        expect(raw).toBeCloseTo(2, NUM_DIGITS);

        raw = rawImageLevel({ w: 4, h: 4 });
        expect(raw).toBeCloseTo(2, NUM_DIGITS);
    });

    it("should be close to integer", () => {
        let raw = rawImageLevel({ w: 16, h: 1 });
        expect(raw).toBeCloseTo(4, NUM_DIGITS);

        raw = rawImageLevel({ w: 64, h: 1 });
        expect(raw).toBeCloseTo(6, NUM_DIGITS);

        raw = rawImageLevel({ w: 512, h: 1 });
        expect(raw).toBeCloseTo(9, NUM_DIGITS);

        raw = rawImageLevel({ w: 1024, h: 1 });
        expect(raw).toBeCloseTo(10, NUM_DIGITS);

        raw = rawImageLevel({ w: 2048, h: 1 });
        expect(raw).toBeCloseTo(11, NUM_DIGITS);

        raw = rawImageLevel({ w: 4096, h: 1 });
        expect(raw).toBeCloseTo(12, NUM_DIGITS);
    });
});

describe("baseImageLevel", () => {
    it("should be 0", () => {
        let base = baseImageLevel({ w: 0, h: 1 });
        expect(base).toBeCloseTo(0);

        base = baseImageLevel({ w: 1, h: 0 });
        expect(base).toBeCloseTo(0, NUM_DIGITS);

        base = baseImageLevel({ w: 1, h: 1 });
        expect(base).toBeCloseTo(0, NUM_DIGITS);
    });

    it("should be 1", () => {
        let base = baseImageLevel({ w: 2, h: 1 });
        expect(base).toBeCloseTo(1, NUM_DIGITS);

        base = baseImageLevel({ w: 1, h: 2 });
        expect(base).toBeCloseTo(1, NUM_DIGITS);

        base = baseImageLevel({ w: 2, h: 2 });
        expect(base).toBeCloseTo(1, NUM_DIGITS);
    });

    it("should be 2", () => {
        let base = baseImageLevel({ w: 3, h: 1 });
        expect(base).toBeCloseTo(2, NUM_DIGITS);

        base = baseImageLevel({ w: 4, h: 1 });
        expect(base).toBeCloseTo(2, NUM_DIGITS);

        base = baseImageLevel({ w: 1, h: 3 });
        expect(base).toBeCloseTo(2, NUM_DIGITS);

        base = baseImageLevel({ w: 1, h: 4 });
        expect(base).toBeCloseTo(2, NUM_DIGITS);

        base = baseImageLevel({ w: 3, h: 3 });
        expect(base).toBeCloseTo(2, NUM_DIGITS);

        base = baseImageLevel({ w: 4, h: 4 });
        expect(base).toBeCloseTo(2, NUM_DIGITS);
    });

    it("should be 10", () => {
        let base = baseImageLevel({ w: 1024, h: 1 });
        expect(base).toBeCloseTo(10, NUM_DIGITS);

        base = baseImageLevel({ w: 1, h: 1024 });
        expect(base).toBeCloseTo(10, NUM_DIGITS);

        base = baseImageLevel({ w: 1024, h: 1024 });
        expect(base).toBeCloseTo(10, NUM_DIGITS);
    });

    it("should be 11", () => {
        let base = baseImageLevel({ w: 1025, h: 1 });
        expect(base).toBeCloseTo(11, NUM_DIGITS);

        base = baseImageLevel({ w: 2048, h: 1 });
        expect(base).toBeCloseTo(11, NUM_DIGITS);

        base = baseImageLevel({ w: 1, h: 1025 });
        expect(base).toBeCloseTo(11, NUM_DIGITS);

        base = baseImageLevel({ w: 1, h: 2048 });
        expect(base).toBeCloseTo(11, NUM_DIGITS);

        base = baseImageLevel({ w: 1025, h: 1025 });
        expect(base).toBeCloseTo(11, NUM_DIGITS);

        base = baseImageLevel({ w: 2048, h: 2048 });
        expect(base).toBeCloseTo(11, NUM_DIGITS);
    });
});

describe("clampedImageLevel", () => {
    it("should be 0", () => {
        let clamped = clampedImageLevel({ w: 1, h: 1 }, 0);
        expect(clamped).toBeCloseTo(0, NUM_DIGITS);

        clamped = clampedImageLevel({ w: 1, h: 1 }, 1);
        expect(clamped).toBeCloseTo(0, NUM_DIGITS);

        clamped = clampedImageLevel({ w: 1, h: 1 }, Number.POSITIVE_INFINITY);
        expect(clamped).toBeCloseTo(0, NUM_DIGITS);
    });

    it("should be 2", () => {
        let clamped = clampedImageLevel({ w: 4, h: 1 }, 2);
        expect(clamped).toBeCloseTo(2, NUM_DIGITS);

        clamped = clampedImageLevel({ w: 4, h: 1 }, 3);
        expect(clamped).toBeCloseTo(2, NUM_DIGITS);

        clamped = clampedImageLevel({ w: 4, h: 1 }, Number.POSITIVE_INFINITY);
        expect(clamped).toBeCloseTo(2, NUM_DIGITS);

        clamped = clampedImageLevel({ w: 1024, h: 1 }, 2);
        expect(clamped).toBeCloseTo(2, NUM_DIGITS);

        clamped = clampedImageLevel({ w: 1, h: 1024 }, 2);
        expect(clamped).toBeCloseTo(2, NUM_DIGITS);

        clamped = clampedImageLevel({ w: 4000, h: 2000 }, 2);
        expect(clamped).toBeCloseTo(2, NUM_DIGITS);
    });
});

describe("verifySize", () => {
    it("should be verified", () => {
        expect(verifySize({ w: 1, h: 1 })).toBe(true);
        expect(verifySize({ w: 1024, h: 1 })).toBe(true);
        expect(verifySize({ w: 1, h: 1024 })).toBe(true);
        expect(verifySize({ w: 2048, h: 2048 })).toBe(true);
        expect(verifySize({ w: 100, h: 50 })).toBe(true);
    });

    it("should not be verified", () => {
        expect(verifySize({ w: 0, h: 1 })).toBe(false);
        expect(verifySize({ w: 1, h: 0 })).toBe(false);
        expect(verifySize({ w: 0, h: 0 })).toBe(false);
        expect(verifySize({ w: -1, h: 1 })).toBe(false);
        expect(verifySize({ w: 1, h: -1 })).toBe(false);
        expect(verifySize({ w: -1, h: -1 })).toBe(false);
        expect(verifySize({ w: -1, h: 0 })).toBe(false);
        expect(verifySize({ w: 0, h: -1 })).toBe(false);
    });
});

describe("hasOverLap2D", () => {
    it("should have overlap on same level", () => {
        const tileZ1: TileCoords3D = { x: 0, y: 0, z: 0 };
        const tileZ2: TileCoords3D = { x: 0, y: 0, z: 0 };
        expect(hasOverlap2D(tileZ1, tileZ2)).toBe(true);

        const tileA1: TileCoords3D = { x: 0, y: 0, z: 3 };
        const tileA2: TileCoords3D = { x: 0, y: 0, z: 3 };
        expect(hasOverlap2D(tileA1, tileA2)).toBe(true);

        const tileB1: TileCoords3D = { x: 1, y: 0, z: 5 };
        const tileB2: TileCoords3D = { x: 1, y: 0, z: 5 };
        expect(hasOverlap2D(tileB1, tileB2)).toBe(true);

        const tileC1: TileCoords3D = { x: 0, y: 1, z: 7 };
        const tileC2: TileCoords3D = { x: 0, y: 1, z: 7 };
        expect(hasOverlap2D(tileB1, tileB2)).toBe(true);

        const tileD1: TileCoords3D = { x: 5, y: 3, z: 12 };
        const tileD2: TileCoords3D = { x: 5, y: 3, z: 12 };
        expect(hasOverlap2D(tileB1, tileB2)).toBe(true);
    });

    it("should not have overlap on same level", () => {
        const tileZ1: TileCoords3D = { x: 0, y: 0, z: 0 };
        const tileZ2: TileCoords3D = { x: 1, y: 0, z: 0 };
        expect(hasOverlap2D(tileZ1, tileZ2)).toBe(false);

        const tileA1: TileCoords3D = { x: 0, y: 0, z: 3 };
        const tileA2: TileCoords3D = { x: 1, y: 0, z: 3 };
        expect(hasOverlap2D(tileA1, tileA2)).toBe(false);

        const tileB1: TileCoords3D = { x: 0, y: 1, z: 5 };
        const tileB2: TileCoords3D = { x: 0, y: 0, z: 5 };
        expect(hasOverlap2D(tileB1, tileB2)).toBe(false);

        const tileC1: TileCoords3D = { x: 3, y: 3, z: 7 };
        const tileC2: TileCoords3D = { x: 4, y: 4, z: 7 };
        expect(hasOverlap2D(tileC1, tileC2)).toBe(false);

        const tileD1: TileCoords3D = { x: 5, y: 1, z: 12 };
        const tileD2: TileCoords3D = { x: 1, y: 5, z: 12 };
        expect(hasOverlap2D(tileD1, tileD2)).toBe(false);
    });

    it("should be equal with different param order", () => {
        const tileA1: TileCoords3D = { x: 0, y: 0, z: 0 };
        const tileA2: TileCoords3D = { x: 0, y: 0, z: 1 };
        expect(hasOverlap2D(tileA1, tileA2)).toBe(true);

        const tileB1: TileCoords3D = { x: 0, y: 0, z: 1 };
        const tileB2: TileCoords3D = { x: 0, y: 0, z: 0 };
        expect(hasOverlap2D(tileB1, tileB2)).toBe(true);

        const tileC1: TileCoords3D = { x: 0, y: 0, z: 11 };
        const tileC2: TileCoords3D = { x: 0, y: 0, z: 12 };
        expect(hasOverlap2D(tileC1, tileC2)).toBe(true);

        const tileD1: TileCoords3D = { x: 0, y: 0, z: 12 };
        const tileD2: TileCoords3D = { x: 0, y: 0, z: 11 };
        expect(hasOverlap2D(tileD1, tileD2)).toBe(true);

        const tileE1: TileCoords3D = { x: 2, y: 3, z: 11 };
        const tileE2: TileCoords3D = { x: 4, y: 7, z: 12 };
        expect(hasOverlap2D(tileE1, tileE2)).toBe(true);

        const tileF1: TileCoords3D = { x: 4, y: 7, z: 12 };
        const tileF2: TileCoords3D = { x: 2, y: 3, z: 11 };
        expect(hasOverlap2D(tileF1, tileF2)).toBe(true);
    });

    it("should have overlap on different levels", () => {
        const tileA1: TileCoords3D = { x: 0, y: 0, z: 0 };
        const tileA2: TileCoords3D = { x: 0, y: 0, z: 15 };
        expect(hasOverlap2D(tileA1, tileA2)).toBe(true);

        const tileB1: TileCoords3D = { x: 4, y: 8, z: 11 };
        const tileB2: TileCoords3D = { x: 16, y: 32, z: 13 };
        expect(hasOverlap2D(tileB1, tileB2)).toBe(true);

        const tileC1: TileCoords3D = { x: 2, y: 3, z: 8 };
        const tileC2: TileCoords3D = { x: 23, y: 31, z: 11 };
        expect(hasOverlap2D(tileC1, tileC2)).toBe(true);
    });

    it("should not have overlap on different levels", () => {
        const tileA1: TileCoords3D = { x: 1, y: 0, z: 12 };
        const tileA2: TileCoords3D = { x: 0, y: 0, z: 15 };
        expect(hasOverlap2D(tileA1, tileA2)).toBe(false);

        const tileB1: TileCoords3D = { x: 4, y: 8, z: 11 };
        const tileB2: TileCoords3D = { x: 15, y: 32, z: 13 };
        expect(hasOverlap2D(tileB1, tileB2)).toBe(false);

        const tileC1: TileCoords3D = { x: 2, y: 3, z: 8 };
        const tileC2: TileCoords3D = { x: 24, y: 31, z: 11 };
        expect(hasOverlap2D(tileC1, tileC2)).toBe(false);
    });
});

describe("sizeToLevelColumnsRows", () => {
    it("should be (1, 1)", () => {
        const sizeA = { w: 1, h: 1 };
        const levelA = { max: 0, z: 0 };
        const colRowsA = sizeToLevelColumnsRows(sizeA, levelA);
        expect(colRowsA.columns).toBe(1);
        expect(colRowsA.rows).toBe(1);

        const ts = tileSize();
        const sizeB = { w: ts, h: ts };
        const levelB = { max: 10, z: 10 };
        const colRowsB = sizeToLevelColumnsRows(sizeB, levelB);
        expect(colRowsB.columns).toBe(1);
        expect(colRowsB.rows).toBe(1);

        const sizeC = { w: 2 ** 1 * ts, h: 2 ** 1 * ts };
        const levelC = { max: 11, z: 10 };
        const colRowsC = sizeToLevelColumnsRows(sizeC, levelC);
        expect(colRowsC.columns).toBe(1);
        expect(colRowsC.rows).toBe(1);

        const sizeD = { w: 2 ** 4 * ts, h: 2 ** 1 * ts };
        const levelD = { max: 14, z: 10 };
        const colRowsD = sizeToLevelColumnsRows(sizeD, levelD);
        expect(colRowsD.columns).toBe(1);
        expect(colRowsD.rows).toBe(1);
    });

    it("should be 2 or 1", () => {
        const ts = tileSize();
        const sizeA = { w: ts + 1, h: ts };
        const levelA = { max: 11, z: 11 };
        const colRowsA = sizeToLevelColumnsRows(sizeA, levelA);
        expect(colRowsA.columns).toBe(2);
        expect(colRowsA.rows).toBe(1);

        const sizeB = { w: ts, h: ts + 1 };
        const levelB = { max: 11, z: 11 };
        const colRowsB = sizeToLevelColumnsRows(sizeB, levelB);
        expect(colRowsB.columns).toBe(1);
        expect(colRowsB.rows).toBe(2);

        const sizeC = { w: ts + 1, h: ts + 1 };
        const levelC = { max: 11, z: 11 };
        const colRowsC = sizeToLevelColumnsRows(sizeC, levelC);
        expect(colRowsC.columns).toBe(2);
        expect(colRowsC.rows).toBe(2);

        const sizeD = { w: 2 * ts - 1, h: 2 * ts - 1 };
        const levelD = { max: 11, z: 11 };
        const colRowsD = sizeToLevelColumnsRows(sizeD, levelD);
        expect(colRowsD.columns).toBe(2);
        expect(colRowsD.rows).toBe(2);
    });

    it("should be based on level", () => {
        const ts = tileSize();
        const size = { w: 2 ** 4 * ts, h: 2 ** 3 * ts };
        const maxLevel = baseImageLevel(size);
        expect(maxLevel).toBe(14);
        const levelA = { max: maxLevel, z: 10 };
        const colRowsA = sizeToLevelColumnsRows(size, levelA);
        expect(colRowsA.columns).toBe(1);
        expect(colRowsA.rows).toBe(1);

        const levelB = { max: maxLevel, z: 11 };
        const colRowsB = sizeToLevelColumnsRows(size, levelB);
        expect(colRowsB.columns).toBe(2);
        expect(colRowsB.rows).toBe(1);

        const levelC = { max: maxLevel, z: 12 };
        const colRowsC = sizeToLevelColumnsRows(size, levelC);
        expect(colRowsC.columns).toBe(4);
        expect(colRowsC.rows).toBe(2);

        const levelD = { max: maxLevel, z: 13 };
        const colRowsD = sizeToLevelColumnsRows(size, levelD);
        expect(colRowsD.columns).toBe(8);
        expect(colRowsD.rows).toBe(4);

        const levelE = { max: maxLevel, z: 14 };
        const colRowsE = sizeToLevelColumnsRows(size, levelE);
        expect(colRowsE.columns).toBe(16);
        expect(colRowsE.rows).toBe(8);

        const levelF = { max: maxLevel, z: 15 };
        const colRowsF = sizeToLevelColumnsRows(size, levelF);
        expect(colRowsF.columns).toBe(32);
        expect(colRowsF.rows).toBe(16);
    });
});

describe("tileToPixelCoords2D", () => {
    it("should be full image", () => {
        const ts = tileSize();
        const level: TileLevel = { max: 10, z: 10 };

        const sizeA: TileImageSize = { h: ts, w: ts };
        const tileA: TileCoords2D = { x: 0, y: 0 };
        const pixelsA = tileToPixelCoords2D(tileA, sizeA, level);
        expect(pixelsA.x).toBe(0);
        expect(pixelsA.y).toBe(0);
        expect(pixelsA.w).toBe(sizeA.w);
        expect(pixelsA.h).toBe(sizeA.h);

        const sizeB: TileImageSize = { h: ts / 2, w: ts };
        const tileB: TileCoords2D = { x: 0, y: 0 };
        const pixelsB = tileToPixelCoords2D(tileB, sizeB, level);
        expect(pixelsB.x).toBe(0);
        expect(pixelsB.y).toBe(0);
        expect(pixelsB.w).toBe(sizeB.w);
        expect(pixelsB.h).toBe(sizeB.h);

        const sizeC: TileImageSize = { h: ts, w: ts / 2 };
        const tileC: TileCoords2D = { x: 0, y: 0 };
        const pixelsC = tileToPixelCoords2D(tileC, sizeC, level);
        expect(pixelsC.x).toBe(0);
        expect(pixelsC.y).toBe(0);
        expect(pixelsC.w).toBe(sizeC.w);
        expect(pixelsC.h).toBe(sizeC.h);
    });

    it("should return correct crop for lower level", () => {
        const ts = tileSize();
        const size: TileImageSize = { h: 2 ** 1 * ts, w: 2 ** 2 * ts };

        const tileA: TileCoords2D = { x: 0, y: 0 };
        const levelA: TileLevel = { max: 12, z: 11 };
        const pixelsA = tileToPixelCoords2D(tileA, size, levelA);
        expect(pixelsA.x).toBe(0);
        expect(pixelsA.y).toBe(0);
        expect(pixelsA.w).toBe(2048);
        expect(pixelsA.h).toBe(2048);

        const tileB: TileCoords2D = { x: 1, y: 0 };
        const levelB: TileLevel = { max: 12, z: 11 };
        const pixelsB = tileToPixelCoords2D(tileB, size, levelB);
        expect(pixelsB.x).toBe(2048);
        expect(pixelsB.y).toBe(0);
        expect(pixelsB.w).toBe(2048);
        expect(pixelsB.h).toBe(2048);

        const tileC: TileCoords2D = { x: 0, y: 1 };
        const levelC: TileLevel = { max: 12, z: 11 };
        const pixelsC = tileToPixelCoords2D(tileC, size, levelC);
        expect(pixelsC.x).toBe(0);
        expect(pixelsC.y).toBe(2048);
        expect(pixelsC.w).toBe(2048);
        expect(pixelsC.h).toBe(0);


        const tileD: TileCoords2D = { x: 1, y: 1 };
        const levelD: TileLevel = { max: 12, z: 11 };
        const pixelsD = tileToPixelCoords2D(tileD, size, levelD);
        expect(pixelsD.x).toBe(2048);
        expect(pixelsD.y).toBe(2048);
        expect(pixelsD.w).toBe(2048);
        expect(pixelsD.h).toBe(0);
    });

    it("should return correct crop for same level", () => {
        const ts = tileSize();
        expect(ts).toBe(1024);

        const size: TileImageSize = { h: 2 ** 2 * ts, w: 2 ** 3 * ts };

        const tileA: TileCoords2D = { x: 0, y: 0 };
        const levelA: TileLevel = { max: 13, z: 13 };
        const pixelsA = tileToPixelCoords2D(tileA, size, levelA);
        expect(pixelsA.x).toBe(0);
        expect(pixelsA.y).toBe(0);
        expect(pixelsA.w).toBe(ts);
        expect(pixelsA.h).toBe(ts);

        const tileB: TileCoords2D = { x: 4, y: 2 };
        const levelB: TileLevel = { max: 13, z: 13 };
        const pixelsB = tileToPixelCoords2D(tileB, size, levelB);
        expect(pixelsB.x).toBe(4 * ts);
        expect(pixelsB.y).toBe(2 * ts);
        expect(pixelsB.w).toBe(ts);
        expect(pixelsB.h).toBe(ts);

        const tileC: TileCoords2D = { x: 8, y: 4 };
        const levelC: TileLevel = { max: 13, z: 13 };
        const pixelsC = tileToPixelCoords2D(tileC, size, levelC);
        expect(pixelsC.x).toBe(8 * ts);
        expect(pixelsC.y).toBe(4 * ts);
        expect(pixelsC.w).toBe(0);
        expect(pixelsC.h).toBe(0);

        const tileD: TileCoords2D = { x: 7, y: 3 };
        const levelD: TileLevel = { max: 13, z: 13 };
        const pixelsD = tileToPixelCoords2D(tileD, size, levelD);
        expect(pixelsD.x).toBe(7 * ts);
        expect(pixelsD.y).toBe(3 * ts);
        expect(pixelsD.w).toBe(ts);
        expect(pixelsD.h).toBe(ts);
    });

    it("should adjust according to image size", () => {
        const ts = tileSize();
        expect(ts).toBe(1024);

        const size: TileImageSize = { h: 2 ** 1 * ts - 5, w: 2 ** 2 * ts - 9 };
        const tile: TileCoords2D = { x: 3, y: 1 };
        const level: TileLevel = { max: 12, z: 12 };
        const pixels = tileToPixelCoords2D(tile, size, level);
        expect(pixels.x).toBe(3 * ts);
        expect(pixels.y).toBe(1 * ts);
        expect(pixels.w).toBe(ts - 9);
        expect(pixels.h).toBe(ts - 5);
    });
});

describe("basicToTileCoords", () => {
    it("should convert basic corners", () => {
        const ts = tileSize();
        const size: TileImageSize = { h: 2 * ts, w: 4 * ts };
        const level: TileLevel = { max: 12, z: 12 };

        const basicA = [0, 0];
        const coords2DA = basicToTileCoords2D(basicA, size, level);
        expect(coords2DA.x).toBe(0);
        expect(coords2DA.y).toBe(0);

        const basicB = [1, 0];
        const coords2DB = basicToTileCoords2D(basicB, size, level);
        expect(coords2DB.x).toBe(3);
        expect(coords2DB.y).toBe(0);

        const basicC = [1, 1];
        const coords2DC = basicToTileCoords2D(basicC, size, level);
        expect(coords2DC.x).toBe(3);
        expect(coords2DC.y).toBe(1);

        const basicD = [0, 1];
        const coords2DD = basicToTileCoords2D(basicD, size, level);
        expect(coords2DD.x).toBe(0);
        expect(coords2DD.y).toBe(1);
    });

    it("should clamp", () => {
        const ts = tileSize();
        const size: TileImageSize = { h: 2 * ts, w: 2 * ts };
        const level: TileLevel = { max: 11, z: 11 };

        const basicA = [2, 2];
        const coords2DA = basicToTileCoords2D(basicA, size, level);
        expect(coords2DA.x).toBe(1);
        expect(coords2DA.y).toBe(1);

        const basicB = [2, 0];
        const coords2DB = basicToTileCoords2D(basicB, size, level);
        expect(coords2DB.x).toBe(1);
        expect(coords2DB.y).toBe(0);

        const basicC = [0, 2];
        const coords2DC = basicToTileCoords2D(basicC, size, level);
        expect(coords2DC.x).toBe(0);
        expect(coords2DC.y).toBe(1);

        const basicD = [-1, -1];
        const coords2DD = basicToTileCoords2D(basicD, size, level);
        expect(coords2DD.x).toBe(0);
        expect(coords2DD.y).toBe(0);

        const basicE = [-1, 0];
        const coords2DE = basicToTileCoords2D(basicE, size, level);
        expect(coords2DE.x).toBe(0);
        expect(coords2DE.y).toBe(0);

        const basicF = [0, -1];
        const coords2DF = basicToTileCoords2D(basicF, size, level);
        expect(coords2DF.x).toBe(0);
        expect(coords2DF.y).toBe(0);
    });

    it("should convert basic", () => {
        const ts = tileSize();
        const size: TileImageSize = { h: 2 * ts, w: 2 * ts };
        const level: TileLevel = { max: 11, z: 11 };

        const basicA = [0.25, 0.25];
        const coords2DA = basicToTileCoords2D(basicA, size, level);
        expect(coords2DA.x).toBe(0);
        expect(coords2DA.y).toBe(0);

        const basicB = [0.75, 0.25];
        const coords2DB = basicToTileCoords2D(basicB, size, level);
        expect(coords2DB.x).toBe(1);
        expect(coords2DB.y).toBe(0);

        const basicC = [0.75, 0.75];
        const coords2DC = basicToTileCoords2D(basicC, size, level);
        expect(coords2DC.x).toBe(1);
        expect(coords2DC.y).toBe(1);

        const basicD = [0.25, 0.75];
        const coords2DD = basicToTileCoords2D(basicD, size, level);
        expect(coords2DD.x).toBe(0);
        expect(coords2DD.y).toBe(1);
    });
});

describe("cornersToTilesCoords2D", () => {
    it("should handle non inverted", () => {
        const ts = tileSize();
        const level: TileLevel = { max: 12, z: 12 };
        const size: TileImageSize = { h: 2 ** 2 * ts, w: 2 ** 2 * ts };

        const tlA: TileCoords2D = { x: 0, y: 0 };
        const brA: TileCoords2D = { x: 1, y: 1 };
        const coords2DA = cornersToTilesCoords2D(tlA, brA, size, level);
        expect(coords2DA.length).toBe(4);
        expect(coords2DA.find(c2D => c2D.x === 0 && c2D.y === 0)).toBeDefined();
        expect(coords2DA.find(c2D => c2D.x === 0 && c2D.y === 1)).toBeDefined();
        expect(coords2DA.find(c2D => c2D.x === 1 && c2D.y === 1)).toBeDefined();
        expect(coords2DA.find(c2D => c2D.x === 1 && c2D.y === 0)).toBeDefined();

        const tlB: TileCoords2D = { x: 1, y: 2 };
        const brB: TileCoords2D = { x: 3, y: 2 };
        const coords2DB = cornersToTilesCoords2D(tlB, brB, size, level);
        expect(coords2DB.length).toBe(3);
        expect(coords2DB.find(c2D => c2D.x === 1 && c2D.y === 2)).toBeDefined();
        expect(coords2DB.find(c2D => c2D.x === 2 && c2D.y === 2)).toBeDefined();
        expect(coords2DB.find(c2D => c2D.x === 3 && c2D.y === 2)).toBeDefined();

        const tlC: TileCoords2D = { x: 0, y: 1 };
        const brC: TileCoords2D = { x: 1, y: 3 };
        const coords2DC = cornersToTilesCoords2D(tlC, brC, size, level);
        expect(coords2DC.length).toBe(6);
        expect(coords2DC.find(c2D => c2D.x === 0 && c2D.y === 1)).toBeDefined();
        expect(coords2DC.find(c2D => c2D.x === 0 && c2D.y === 2)).toBeDefined();
        expect(coords2DC.find(c2D => c2D.x === 0 && c2D.y === 3)).toBeDefined();
        expect(coords2DC.find(c2D => c2D.x === 1 && c2D.y === 1)).toBeDefined();
        expect(coords2DC.find(c2D => c2D.x === 1 && c2D.y === 2)).toBeDefined();
        expect(coords2DC.find(c2D => c2D.x === 1 && c2D.y === 3)).toBeDefined();
    });

    it("should handle inverted", () => {
        const ts = tileSize();
        const level: TileLevel = { max: 12, z: 12 };
        const size: TileImageSize = { h: 2 ** 2 * ts, w: 2 ** 2 * ts };

        const tlA: TileCoords2D = { x: 3, y: 0 };
        const brA: TileCoords2D = { x: 0, y: 0 };
        const coords2DA = cornersToTilesCoords2D(tlA, brA, size, level);
        expect(coords2DA.length).toBe(2);
        expect(coords2DA.find(c2D => c2D.x === 3 && c2D.y === 0)).toBeDefined();
        expect(coords2DA.find(c2D => c2D.x === 0 && c2D.y === 0)).toBeDefined();

        const tlB: TileCoords2D = { x: 2, y: 1 };
        const brB: TileCoords2D = { x: 0, y: 2 };
        const coords2DB = cornersToTilesCoords2D(tlB, brB, size, level);
        expect(coords2DB.length).toBe(6);
        expect(coords2DB.find(c2D => c2D.x === 2 && c2D.y === 1)).toBeDefined();
        expect(coords2DB.find(c2D => c2D.x === 2 && c2D.y === 2)).toBeDefined();
        expect(coords2DB.find(c2D => c2D.x === 3 && c2D.y === 1)).toBeDefined();
        expect(coords2DB.find(c2D => c2D.x === 3 && c2D.y === 2)).toBeDefined();
        expect(coords2DB.find(c2D => c2D.x === 0 && c2D.y === 1)).toBeDefined();
        expect(coords2DB.find(c2D => c2D.x === 0 && c2D.y === 2)).toBeDefined();

        const tlC: TileCoords2D = { x: 2, y: 3 };
        const brC: TileCoords2D = { x: 1, y: 3 };
        const coords2DC = cornersToTilesCoords2D(tlC, brC, size, level);
        expect(coords2DC.length).toBe(4);
        expect(coords2DC.find(c2D => c2D.x === 2 && c2D.y === 3)).toBeDefined();
        expect(coords2DC.find(c2D => c2D.x === 3 && c2D.y === 3)).toBeDefined();
        expect(coords2DC.find(c2D => c2D.x === 0 && c2D.y === 3)).toBeDefined();
        expect(coords2DC.find(c2D => c2D.x === 1 && c2D.y === 3)).toBeDefined();
    });
});
