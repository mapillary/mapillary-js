import { Box3, Object3D, Ray, Vector3 } from "three";
import { isLeafLevel } from "./SpatialOctreeMath";

export class SpatialOctreeNode {
    public readonly children: SpatialOctreeNode[];
    public readonly items: Object3D[];

    constructor(
        public readonly level: number,
        public readonly leafLevel: number,
        public readonly boundingBox: Box3,
        public parent?: SpatialOctreeNode) {
        this.children = [];
        this.items = [];
        if (parent) {
            parent.children.push(this);
        }
    }

    public get isEmpty(): boolean {
        return !(this.children.length || this.items.length);
    }

    public add(object: Object3D): SpatialOctreeNode {
        const self = this;
        if (!self.boundingBox.containsPoint(object.position)) {
            throw new Error(`Item not contained in node`);
        }
        if (isLeafLevel(self.level, self.leafLevel)) {
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
                    self.level - 1,
                    self.leafLevel,
                    boundingBox,
                    self);
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
        if (isLeafLevel(this.level, this.leafLevel)) {
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
            throw new Error(`Item does not exist ${object.uuid}`);
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
