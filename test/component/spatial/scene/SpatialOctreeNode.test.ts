import { Box3, Object3D, Ray, Vector3 } from "three";
import { levelToRootBoundingBox } from "../../../../src/component/spatial/scene/SpatialOctreeMath";
import { SpatialOctreeNode } from "../../../../src/component/spatial/scene/SpatialOctreeNode";

describe("SpatialOctreeNode.ctor", () => {
    test("should be defined", () => {
        const boundingBox = new Box3();
        const node = new SpatialOctreeNode(3, 1, boundingBox);

        expect(node).toBeDefined();
        expect(node.level).toBe(3);
        expect(node.leafLevel).toBe(1);
        expect(node.boundingBox).toBe(boundingBox);
        expect(node.parent).toBeUndefined();
    });

    test("should set parent", () => {
        const parent = new SpatialOctreeNode(4, 1, new Box3());
        const node = new SpatialOctreeNode(3, 1, new Box3(), parent);

        expect(node).toBeDefined();
        expect(node.parent).toBeDefined();
        expect(node.parent).toBe(parent);
    });
});

describe("SpatialOctreeNode.isEmtpy", () => {
    test("should be empty", () => {
        const boundingBox = new Box3();
        const node = new SpatialOctreeNode(3, 1, boundingBox);

        expect(node.isEmpty).toBe(true);
    });
});

describe("SpatialOctreeNode.children", () => {
    test("should be added as a child to parent", () => {
        const boundingBox = new Box3();
        const parent = new SpatialOctreeNode(4, 1, new Box3());
        const node = new SpatialOctreeNode(3, 1, boundingBox, parent);

        expect(parent.children.length).toBe(1);
        expect(parent.children[0]).toBe(node);
    });
});

describe("SpatialOctreeNode.traverse", () => {
    test("should be removed from parent when empty", () => {
        const boundingBox = new Box3();
        const parent = new SpatialOctreeNode(4, 1, new Box3());
        const node = new SpatialOctreeNode(3, 1, boundingBox, parent);

        expect(node.parent).toBe(parent);
        expect(parent.children.length).toBe(1);
        node.traverse();
        expect(node.parent).toBeNull();
        expect(parent.children.length).toBe(0);
    });

    test("should not be removed from parent when not empty", () => {
        const boundingBox = new Box3();
        const parent = new SpatialOctreeNode(4, 1, new Box3());
        const node = new SpatialOctreeNode(3, 1, boundingBox, parent);
        const child = new SpatialOctreeNode(2, 1, boundingBox, node);

        node.traverse();

        expect(parent.children.length).toBe(1);
        expect(parent.children[0]).toBe(node);
        expect(node.parent).toBe(parent);
        expect(node.children.length).toBe(1);
        expect(node.children[0]).toBe(child);
        expect(child.parent).toBe(node);

    });

    test("should remove empty nodes recursively", () => {
        const boundingBox = new Box3();
        const parent = new SpatialOctreeNode(4, 1, new Box3());
        const node = new SpatialOctreeNode(3, 1, boundingBox, parent);
        const child = new SpatialOctreeNode(2, 1, boundingBox, node);

        child.traverse();

        expect(parent.children.length).toBe(0);

        expect(node.parent).toBeNull();
        expect(node.children.length).toBe(0);

        expect(child.parent).toBeNull();
    });
});

describe("SpatialOctreeNode.add", () => {
    test("should add object to root node", () => {
        const levels = 1;
        const rootLevel = levels - 1;
        const leafLevel = rootLevel;
        const bbox = levelToRootBoundingBox(rootLevel);
        const box = new Box3(
            new Vector3().fromArray(bbox.min),
            new Vector3().fromArray(bbox.max));

        const root = new SpatialOctreeNode(rootLevel, leafLevel, box);

        const object = new Object3D();
        object.position.set(0, 0, 0);
        root.add(object);

        expect(root.children.length).toBe(0);
        expect(root.items.length).toBe(1);
        expect(root.isEmpty).toBe(false);
        expect(root.items[0]).toBe(object);
    });

    test("should add object to root node on higher level", () => {
        const levels = 5;
        const rootLevel = levels - 1;
        const leafLevel = rootLevel;
        const bbox = levelToRootBoundingBox(rootLevel);
        const box = new Box3(
            new Vector3().fromArray(bbox.min),
            new Vector3().fromArray(bbox.max));

        const root = new SpatialOctreeNode(rootLevel, leafLevel, box);

        const object = new Object3D();
        object.position.set(0, 0, 0);
        root.add(object);

        expect(root.children.length).toBe(0);
        expect(root.items.length).toBe(1);
        expect(root.isEmpty).toBe(false);
        expect(root.items[0]).toBe(object);
    });

    test("should add object to leaf node", () => {
        const levels = 2;
        const rootLevel = levels - 1;
        const leafLevel = 0;
        const bbox = levelToRootBoundingBox(rootLevel);
        const box = new Box3(
            new Vector3().fromArray(bbox.min),
            new Vector3().fromArray(bbox.max));

        const root = new SpatialOctreeNode(rootLevel, leafLevel, box);

        const object = new Object3D();
        object.position.set(0.5, 0.5, 0.5);
        root.add(object);

        expect(root.children.length).toBe(1);
        expect(root.items.length).toBe(0);

        const leaf = root.children[0];
        expect(leaf.level).toBe(0);
        expect(leaf.parent).toBe(root);
        expect(leaf.children.length).toBe(0);
        expect(leaf.isEmpty).toBe(false);
        expect(leaf.items.length).toBe(1);
        expect(leaf.items[0]).toBe(object);
    });

    test("should add nodes recursively until leaf level", () => {
        const levels = 3;
        const rootLevel = levels - 1;
        const leafLevel = 0;
        const bbox = levelToRootBoundingBox(rootLevel);
        const box = new Box3(
            new Vector3().fromArray(bbox.min),
            new Vector3().fromArray(bbox.max));

        const root = new SpatialOctreeNode(rootLevel, leafLevel, box);

        const object = new Object3D();
        object.position.set(0.5, 0.5, 0.5);
        root.add(object);

        expect(root.children.length).toBe(1);
        expect(root.items.length).toBe(0);

        const next = root.children[0];
        expect(next.parent).toBe(root);
        expect(next.level).toBe(1);
        expect(next.children.length).toBe(1);
        expect(next.items.length).toBe(0);

        const leaf = next.children[0];
        expect(leaf.parent).toBe(next);
        expect(leaf.level).toBe(0);
        expect(leaf.children.length).toBe(0);
        expect(leaf.isEmpty).toBe(false);
        expect(leaf.items.length).toBe(1);
        expect(leaf.items[0]).toBe(object);
    });

    test("should stop recursion at leaf level", () => {
        const levels = 5;
        const rootLevel = levels - 1;
        const leafLevel = rootLevel - 1;
        const bbox = levelToRootBoundingBox(rootLevel);
        const box = new Box3(
            new Vector3().fromArray(bbox.min),
            new Vector3().fromArray(bbox.max));

        const root = new SpatialOctreeNode(rootLevel, leafLevel, box);

        const object = new Object3D();
        object.position.set(0.5, 0.5, 0.5);
        root.add(object);

        expect(root.children.length).toBe(1);

        const leaf = root.children[0];
        expect(leaf.level).toBe(3);
        expect(leaf.parent).toBe(root);
        expect(leaf.children.length).toBe(0);
        expect(leaf.isEmpty).toBe(false);
        expect(leaf.items.length).toBe(1);
        expect(leaf.items[0]).toBe(object);
    });
});

describe("SpatialOctreeNode.remove", () => {
    test("should remove object", () => {
        const levels = 1;
        const rootLevel = levels - 1;
        const leafLevel = rootLevel;
        const bbox = levelToRootBoundingBox(rootLevel);
        const box = new Box3(
            new Vector3().fromArray(bbox.min),
            new Vector3().fromArray(bbox.max));

        const root = new SpatialOctreeNode(rootLevel, leafLevel, box);

        const object = new Object3D();
        object.position.set(0, 0, 0);

        root.add(object);
        expect(root.items.length).toBe(1);
        root.remove(object);
        expect(root.isEmpty).toBe(true);
        expect(root.items.length).toBe(0);
    });
});

describe("SpatialOctree.intersect", () => {
    test("should intersect octree root", () => {
        const levels = 1;
        const rootLevel = levels - 1;
        const leafLevel = rootLevel;
        const bbox = levelToRootBoundingBox(rootLevel);
        const box = new Box3(
            new Vector3().fromArray(bbox.min),
            new Vector3().fromArray(bbox.max));
        const root = new SpatialOctreeNode(rootLevel, leafLevel, box);

        const object = new Object3D();
        object.position.set(0, 0, 0);
        root.add(object);

        const ray = new Ray(
            new Vector3(-100, 0, 0),
            new Vector3(1, 0, 0));

        const target = new Vector3();
        const intersected: SpatialOctreeNode[] = [];
        root.intersect(ray, target, intersected);

        expect(intersected.length).toBe(1);
        expect(intersected[0]).toBe(root);
    });

    test("should not intersect octree root", () => {
        const levels = 1;
        const rootLevel = levels - 1;
        const leafLevel = rootLevel;
        const bbox = levelToRootBoundingBox(rootLevel);
        const box = new Box3(
            new Vector3().fromArray(bbox.min),
            new Vector3().fromArray(bbox.max));
        const root = new SpatialOctreeNode(rootLevel, leafLevel, box);

        const object = new Object3D();
        object.position.set(0, 0, 0);
        root.add(object);

        const ray = new Ray(
            new Vector3(-100, 0, 0),
            new Vector3(-1, 0, 0));

        const target = new Vector3();
        const intersected: SpatialOctreeNode[] = [];
        root.intersect(ray, target, intersected);

        expect(intersected.length).toBe(0);
    });

    test("should intersect octree leaf", () => {
        const levels = 10;
        const rootLevel = levels - 1;
        const leafLevel = 4;
        const bbox = levelToRootBoundingBox(rootLevel);
        const box = new Box3(
            new Vector3().fromArray(bbox.min),
            new Vector3().fromArray(bbox.max));
        const root = new SpatialOctreeNode(rootLevel, leafLevel, box);

        const object = new Object3D();
        object.position.set(1, 1, 1);
        root.add(object);

        const ray = new Ray(
            new Vector3(-100, 1, 1),
            new Vector3(1, 0, 0));

        const target = new Vector3();
        const intersected: SpatialOctreeNode[] = [];
        root.intersect(ray, target, intersected);

        expect(intersected.length).toBe(1);
        const leaf = intersected[0];
        expect(leaf.level).toBe(4);
        expect(leaf.items.length).toBe(1);
        expect(leaf.items[0]).toBe(object);
        expect(leaf.children.length).toBe(0);

        expect(leaf
            .parent
            .parent
            .parent
            .parent
            .parent)
            .toBe(root);
    });
});
