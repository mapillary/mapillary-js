import { Box3, Object3D, Ray, Vector3 } from "three";
import { levelToRootBoundingBox } from "./SpatialOctreeMath";
import { SpatialOctreeNode } from "./SpatialOctreeNode";

export class SpatialOctree {
    private _index: Map<string, SpatialOctreeNode>;
    private _root: SpatialOctreeNode;

    constructor(
        public readonly rootLevel: number,
        public readonly leafLevel: number) {
        if (leafLevel > rootLevel) {
            throw new Error()
        }
        this._index = new Map();
        this._root = this._makeRoot();
    }

    public get root(): SpatialOctreeNode {
        return this._root;
    }

    public add(object: Object3D): void {
        if (!this.root.boundingBox.containsPoint(object.position)) {
            console.warn(`Object outside bounding box ${object.uuid}`);
            return;
        }
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
        this._root = this._makeRoot();
        this._index.clear();
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

    private _makeRoot(): SpatialOctreeNode {
        const level = this.rootLevel;
        const bbox = levelToRootBoundingBox(level);
        const box = new Box3(
            new Vector3().fromArray(bbox.min),
            new Vector3().fromArray(bbox.max));
        return new SpatialOctreeNode(level, this.leafLevel, box);
    }
}
