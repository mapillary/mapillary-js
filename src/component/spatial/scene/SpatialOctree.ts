import { Box3, Object3D, Ray, Vector3 } from "three";

const ROOT_SIZE = 2 ** 14; // 16384 meters
const LEAF_LEVEL = 8; // 64 meters

function isLeaf(node: SpatialOctreeNode): boolean {
    return node.level === LEAF_LEVEL;
}

class SpatialOctreeNode {
    public readonly children: SpatialOctreeNode[];
    public readonly items: Object3D[];

    constructor(
        public readonly level: number,
        public readonly boundingBox: Box3,
        public parent?: SpatialOctreeNode) {
        this.children = [];
        this.items = [];
    }

    public get isEmpty(): boolean {
        return !(this.children.length || this.items.length);
    }

    public add(object: Object3D): SpatialOctreeNode {
        const self = this;
        if (!self.boundingBox.containsPoint(object.position)) {
            throw new Error(`Item not contained in node`);
        }
        if (isLeaf(self)) {
            self.items.push(object);
            return this;
        }
        for (const child of self.children) {
            if (child.boundingBox.containsPoint(object.position)) {
                return child.add(object);
            }
        }
        for (const boundingBox of self._generateBoundingBoxes()) {
            if (boundingBox.containsPoint(object.position)) {
                const child = new SpatialOctreeNode(
                    self.level + 1,
                    boundingBox,
                    self);
                this.children.push(child);
                return child.add(object);
            }
        }
        throw new Error(`Item not contained in children`);
    }

    public intersect(
        ray: Ray,
        target: Vector3,
        nodes: SpatialOctreeNode[])
        : void {

        if (!ray.intersectBox(this.boundingBox, target)) {
            return;
        }
        if (isLeaf(this)) {
            nodes.push(this);
            return;
        }
        for (const child of this.children) {
            child.intersect(ray, target, nodes);
        }
    }

    public remove(object: Object3D): void {
        const index = this.items.indexOf(object);
        if (index < 0) {
            console.warn(`Item does not exist ${object.uuid}`);
        }
        this.items.splice(index, 1);
    }

    public traverse(): void {
        const self = this;
        if (!self.isEmpty) {
            return;
        }
        const parent = self.parent;
        if (!parent) {
            return;
        }

        const index = parent.children.indexOf(self);
        if (index < 0) {
            throw new Error(`Corrupt octree`);
        }
        parent.children.splice(index, 1);
        this.parent = null;
        parent.traverse();
    }

    private _generateBoundingBoxes(): Box3[] {
        const self = this;
        const min = self.boundingBox.min;
        const max = self.boundingBox.max;
        const size = (max.x - min.x) / 2;
        const mins = [
            [min.x, min.y + size, min.z + size],
            [min.x + size, min.y + size, min.z + size],
            [min.x, min.y, min.z + size],
            [min.x + size, min.y, min.z + size],
            [min.x, min.y + size, min.z],
            [min.x + size, min.y + size, min.z],
            [min.x, min.y, min.z],
            [min.x + size, min.y, min.z],
        ];
        const boundingBoxes: Box3[] = []
        for (const [minX, minY, minZ] of mins) {
            boundingBoxes.push(
                new Box3(
                    new Vector3(minX, minY, minZ),
                    new Vector3(minX + size, minY + size, minZ + size)));
        }
        return boundingBoxes;
    }
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
