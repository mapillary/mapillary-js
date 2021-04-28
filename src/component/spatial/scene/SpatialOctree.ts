import { Box3, Object3D, Ray, Vector3 } from "three";
import { SpatialOctreeNode } from "./SpatialOctreeNode";

const ROOT_SIZE = 2 ** 14; // 16384 meters
const LEAF_LEVEL = 8; // 64 meters

export function isLeaf(node: SpatialOctreeNode): boolean {
    return node.level === LEAF_LEVEL;
}

export class SpatialOctree {
    private _index: Map<string, SpatialOctreeNode>;
    private _root: SpatialOctreeNode;

    constructor() {
        this._index = new Map();
        this._root = this._makeRoot(ROOT_SIZE);
    }

    public add(object: Object3D): void {
        const leaf = this._root.add(object);
        this._index.set(object.uuid, leaf);
    }

    public has(object: Object3D): boolean {
        return this._index.has(object.uuid);
    }

    public intersect(ray: Ray): Object3D[] {
        const leaves: SpatialOctreeNode[] = [];
        const target = new Vector3();
        this._root.intersect(ray, target, leaves);

        return leaves
            .map(leaf => leaf.items)
            .reduce(
                (acc, items): Object3D[] => {
                    acc.push(...items);
                    return acc;
                },
                []);
    }

    public reset(): void {
        this._root = this._makeRoot(ROOT_SIZE);
    }

    public remove(object: Object3D): void {
        if (!this.has(object)) {
            throw new Error(`Frame does not exist ${object.uuid}`);
        }
        const leaf = this._index.get(object.uuid);
        leaf.remove(object);
        leaf.traverse();
        this._index.delete(object.uuid);
    }

    private _makeRoot(size: number): SpatialOctreeNode {
        const half = size / 2;
        const min = new Vector3(-half, -half, -half);
        const max = new Vector3(half, half, half);
        const bbox = new Box3(min, max);
        return new SpatialOctreeNode(0, bbox);
    }
}
