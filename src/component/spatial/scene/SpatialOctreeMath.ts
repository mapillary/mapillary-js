// Level 0: 1 x 1 x 1 meter cubes
export const OCTREE_ROOT_LEVEL = 14; // 16384 meters
export const OCTREE_LEAF_LEVEL = 6; // 64 meters

export function isLeafLevel(level: number, leafLevel: number): boolean {
    return level === leafLevel;
}

export function levelToSize(level: number): number {
    return 2 ** level;
}

export interface OctreeBoundingBox {
    min: number[];
    max: number[];
}

export function levelToRootBoundingBox(level: number): OctreeBoundingBox {
    const size = levelToSize(level);
    const half = size / 2;
    const min = [-half, -half, -half];
    const max = [half, half, half];
    return { min, max };
}
