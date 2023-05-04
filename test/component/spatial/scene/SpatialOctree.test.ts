import { Material, Mesh, SphereGeometry, Vector3 } from "three";
import { Object3D, Ray } from "three";
import { SpatialOctree } from "../../../../src/component/spatial/scene/SpatialOctree";

describe("SpatialOctree.ctor", () => {
    test("should be defined", () => {
        const octree = new SpatialOctree(1, 0);

        expect(octree).toBeDefined();
        expect(octree.rootLevel).toBe(1);
        expect(octree.leafLevel).toBe(0);
        expect(octree.root).toBeDefined();
        expect(octree.root.level).toBe(1);
        expect(octree.root.leafLevel).toBe(0);
    });
});

describe("SpatialOctree.add", () => {
    test("should have object", () => {
        const octree = new SpatialOctree(1, 0);
        const object = new Object3D();
        object.position.set(1, 1, 1);
        expect(octree.has(object)).toBe(false);
        octree.add(object);
        expect(octree.has(object)).toBe(true);
    });

    test("should not add object outside bouding box", () => {
        spyOn(console, "warn").and.stub();

        const octree = new SpatialOctree(0, 0);
        const object = new Object3D();
        object.position.set(10, 10, 10);
        octree.add(object);
        expect(octree.has(object)).toBe(false);
    });
});

describe("SpatialOctree.remove", () => {
    test("should not have object", () => {
        const octree = new SpatialOctree(1, 0);
        const object = new Object3D();
        object.position.set(1, 1, 1);
        octree.add(object);
        octree.remove(object);
        expect(octree.has(object)).toBe(false);
    });
});

describe("SpatialOctree.reset", () => {
    test("should not have object", () => {
        const octree = new SpatialOctree(1, 0);
        const object = new Object3D();
        object.position.set(1, 1, 1);
        octree.add(object);
        octree.reset();
        expect(octree.has(object)).toBe(false);
    });
});

describe("SpatialOctree.intersect", () => {
    test("should intersect object", () => {
        const octree = new SpatialOctree(1, 0);
        const object = new Mesh(
            new SphereGeometry(1, 10, 10),
            new Material());
        object.position.set(0, 0, 1);
        octree.add(object);

        const ray = new Ray(
            new Vector3(-200, 0, 1),
            new Vector3(1, 0, 0));

        const intersected = octree.intersect(ray);
        expect(intersected.length).toBe(1);
        expect(intersected[0]).toBe(object);
        expect(intersected[0].uuid).toEqual(object.uuid);
    });

    test("should not intersect object", () => {
        const octree = new SpatialOctree(1, 0);
        const object = new Mesh(
            new SphereGeometry(1, 10, 10),
            new Material());
        object.position.set(0, 0, -1);
        octree.add(object);

        const ray = new Ray(
            new Vector3(-200, 0, 1),
            new Vector3(1, 0, 0));

        const intersected = octree.intersect(ray);
        expect(intersected.length).toBe(0);
    });
});
