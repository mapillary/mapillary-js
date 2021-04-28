import {
    isLeafLevel,
    levelToRootBoundingBox,
    levelToSize,
    OCTREE_LEAF_LEVEL,
    OCTREE_LEVELS,
} from "../../../../src/component/spatial/scene/SpatialOctreeMath";

describe("SpatialOctreeMath", () => {
    test("should specify default levels values", () => {
        expect(OCTREE_LEVELS).toBe(15);
        expect(OCTREE_LEAF_LEVEL).toBe(6);
    });

    test("should compute level size", () => {
        expect(levelToSize(0)).toBe(1);
        expect(levelToSize(1)).toBe(2);
        expect(levelToSize(2)).toBe(4);
        expect(levelToSize(14)).toBe(16384);
    });

    test("should determine if level is leaf level", () => {
        expect(isLeafLevel(0, 0)).toBe(true);
        expect(isLeafLevel(1, 1)).toBe(true);
        expect(isLeafLevel(2, 2)).toBe(true);
        expect(isLeafLevel(14, 14)).toBe(true);

        expect(isLeafLevel(0, 1)).toBe(false);
        expect(isLeafLevel(1, 0)).toBe(false);
        expect(isLeafLevel(1, 14)).toBe(false);
        expect(isLeafLevel(14, 1)).toBe(false);
    });

    test("should return the root bbox for a level", () => {
        const bbox0 = levelToRootBoundingBox(0);
        expect(bbox0.min).toEqual([-0.5, -0.5, -0.5]);
        expect(bbox0.max).toEqual([0.5, 0.5, 0.5]);

        const bbox1 = levelToRootBoundingBox(1);
        expect(bbox1.min).toEqual([-1, -1, -1]);
        expect(bbox1.max).toEqual([1, 1, 1]);

        const bbox2 = levelToRootBoundingBox(2);
        expect(bbox2.min).toEqual([-2, -2, -2]);
        expect(bbox2.max).toEqual([2, 2, 2]);

        const bbox3 = levelToRootBoundingBox(3);
        expect(bbox3.min).toEqual([-4, -4, -4]);
        expect(bbox3.max).toEqual([4, 4, 4]);

        const bbox14 = levelToRootBoundingBox(14);
        expect(bbox14.min).toEqual([-8192, -8192, -8192]);
        expect(bbox14.max).toEqual([8192, 8192, 8192]);
    });
});
