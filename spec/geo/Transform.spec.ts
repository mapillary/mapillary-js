/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {Transform} from "../../src/Geo";
import {Node} from "../../src/Graph";
import {IGPano} from "../../src/API";

import {GeoHelper} from "../helper/GeoHelper.spec";

describe("Transform.rt", () => {
    let epsilon: number = 10e-9;

    it("should have a unit Rt matrix", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(0, null, true, null, { key: "", rotation: r }, []);

        let transform: Transform = new Transform(node, t);
        let Rt: THREE.Matrix4 = transform.rt;

        let elements: Float32Array = Rt.elements;

        // elements is a column-major array
        expect(elements[0]).toBe(1);
        expect(elements[1]).toBe(0);
        expect(elements[2]).toBe(0);
        expect(elements[3]).toBe(0);
        expect(elements[4]).toBe(0);
        expect(elements[5]).toBe(1);
        expect(elements[6]).toBe(0);
        expect(elements[7]).toBe(0);
        expect(elements[8]).toBe(0);
        expect(elements[9]).toBe(0);
        expect(elements[10]).toBe(1);
        expect(elements[11]).toBe(0);
        expect(elements[12]).toBe(0);
        expect(elements[13]).toBe(0);
        expect(elements[14]).toBe(0);
        expect(elements[15]).toBe(1);
    });

    it("should have an Rt matrix with rotation around z-axis", () => {
        let r: number[] = [0, 0, Math.PI];
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(0, null, true, null, { key: "key", rotation: r }, []);

        let transform: Transform = new Transform(node, t);
        let Rt: THREE.Matrix4 = transform.rt;

        let elements: Float32Array = Rt.elements;

        // elements is a column-major array
        expect(elements[0]).toBe(-1);
        expect(elements[1]).toBeLessThan(epsilon);
        expect(elements[2]).toBe(0);
        expect(elements[3]).toBe(0);
        expect(elements[4]).toBeLessThan(epsilon);
        expect(elements[5]).toBe(-1);
        expect(elements[6]).toBe(0);
        expect(elements[7]).toBe(0);
        expect(elements[8]).toBe(0);
        expect(elements[9]).toBe(0);
        expect(elements[10]).toBe(1);
        expect(elements[11]).toBe(0);
        expect(elements[12]).toBe(0);
        expect(elements[13]).toBe(0);
        expect(elements[14]).toBe(0);
        expect(elements[15]).toBe(1);
    });

    it("should have an Rt matrix with rotation around x-axis", () => {
        let r: number[] = [Math.PI / 2, 0, 0];
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(0, null, true, null, { key: "key", rotation: r }, []);

        let transform: Transform = new Transform(node, t);
        let Rt: THREE.Matrix4 = transform.rt;

        let elements: Float32Array = Rt.elements;

        // elements is a column-major array
        expect(elements[0]).toBe(1);
        expect(elements[1]).toBe(0);
        expect(elements[2]).toBe(0);
        expect(elements[3]).toBe(0);
        expect(elements[4]).toBe(0);
        expect(elements[5]).toBeLessThan(epsilon);
        expect(elements[6]).toBe(1);
        expect(elements[7]).toBe(0);
        expect(elements[8]).toBe(0);
        expect(elements[9]).toBe(-1);
        expect(elements[10]).toBeLessThan(epsilon);
        expect(elements[11]).toBe(0);
        expect(elements[12]).toBe(0);
        expect(elements[13]).toBe(0);
        expect(elements[14]).toBe(0);
        expect(elements[15]).toBe(1);
    });

    it("should have an Rt matrix with translation", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [10, 20, 30];

        let node: Node = new Node(0, null, true, null, { key: "key", rotation: r }, []);

        let transform: Transform = new Transform(node, t);
        let Rt: THREE.Matrix4 = transform.rt;

        let elements: Float32Array = Rt.elements;

        // elements is a column-major array
        expect(elements[0]).toBe(1);
        expect(elements[1]).toBe(0);
        expect(elements[2]).toBe(0);
        expect(elements[3]).toBe(0);
        expect(elements[4]).toBe(0);
        expect(elements[5]).toBe(1);
        expect(elements[6]).toBe(0);
        expect(elements[7]).toBe(0);
        expect(elements[8]).toBe(0);
        expect(elements[9]).toBe(0);
        expect(elements[10]).toBe(1);
        expect(elements[11]).toBe(0);
        expect(elements[12]).toBe(10);
        expect(elements[13]).toBe(20);
        expect(elements[14]).toBe(30);
        expect(elements[15]).toBe(1);
    });
});

describe("Transform.srt", () => {
    let epsilon: number = 10e-8;

    it("should have a unit sRt matrix", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(0, null, true, null, { key: "", rotation: r, atomic_scale: 1 }, []);

        let transform: Transform = new Transform(node, t);
        let sRt: THREE.Matrix4 = transform.srt;

        let elements: Float32Array = sRt.elements;

        // elements is a column-major array
        expect(elements[0]).toBe(1);
        expect(elements[1]).toBe(0);
        expect(elements[2]).toBe(0);
        expect(elements[3]).toBe(0);
        expect(elements[4]).toBe(0);
        expect(elements[5]).toBe(1);
        expect(elements[6]).toBe(0);
        expect(elements[7]).toBe(0);
        expect(elements[8]).toBe(0);
        expect(elements[9]).toBe(0);
        expect(elements[10]).toBe(1);
        expect(elements[11]).toBe(0);
        expect(elements[12]).toBe(0);
        expect(elements[13]).toBe(0);
        expect(elements[14]).toBe(0);
        expect(elements[15]).toBe(1);
    });

    it("should have a scaled sRt matrix with rotation around y-axis", () => {
        let r: number[] = [0, Math.PI / 2, 0];
        let t: number[] = [0, 0, 0];

        let node: Node = new Node(0, null, true, null, { key: "", rotation: r, atomic_scale: 3 }, []);

        let transform: Transform = new Transform(node, t);
        let sRt: THREE.Matrix4 = transform.srt;

        let elements: Float32Array = sRt.elements;

        // elements is a column-major array
        expect(elements[0]).toBeLessThan(epsilon);
        expect(elements[1]).toBe(0);
        expect(elements[2]).toBe(-3);
        expect(elements[3]).toBe(0);
        expect(elements[4]).toBe(0);
        expect(elements[5]).toBe(3);
        expect(elements[6]).toBe(0);
        expect(elements[7]).toBe(0);
        expect(elements[8]).toBe(3);
        expect(elements[9]).toBe(0);
        expect(elements[10]).toBeLessThan(epsilon);
        expect(elements[11]).toBe(0);
        expect(elements[12]).toBe(0);
        expect(elements[13]).toBe(0);
        expect(elements[14]).toBe(0);
        expect(elements[15]).toBe(1);
    });

    it("should have a scaled sRt matrix with scaled translation values", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [-10, 20, -30];

        let node: Node = new Node(0, null, true, null, { key: "", rotation: r, atomic_scale: 0.5 }, []);

        let transform: Transform = new Transform(node, t);
        let sRt: THREE.Matrix4 = transform.srt;

        let elements: Float32Array = sRt.elements;

        // elements is a column-major array
        expect(elements[0]).toBe(0.5);
        expect(elements[1]).toBe(0);
        expect(elements[2]).toBe(0);
        expect(elements[3]).toBe(0);
        expect(elements[4]).toBe(0);
        expect(elements[5]).toBe(0.5);
        expect(elements[6]).toBe(0);
        expect(elements[7]).toBe(0);
        expect(elements[8]).toBe(0);
        expect(elements[9]).toBe(0);
        expect(elements[10]).toBe(0.5);
        expect(elements[11]).toBe(0);
        expect(elements[12]).toBe(-5);
        expect(elements[13]).toBe(10);
        expect(elements[14]).toBe(-15);
        expect(elements[15]).toBe(1);
    });
});

describe("Transform.width", () => {
    it("should have fallback width", () => {
        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        expect(transform.width).toBe(4);
    });

    it("should have width of node", () => {
        let width: number = 11;

        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { width: width, key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        expect(transform.width).toBe(width);
    });
});

describe("Transform.height", () => {
    it("should have fallback height", () => {
        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { height: -1, key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        expect(transform.height).toBe(3);
    });

    it("should have height of node", () => {
        let height: number = 11;

        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { height: height, key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        expect(transform.height).toBe(height);
    });
});

describe("Transform.focal", () => {
    it("should have fallback focal", () => {
        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        expect(transform.focal).toBe(1);
    });

    it("should have focal of node", () => {
        let focal: number = 0.84;

        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { cfocal: focal, key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        expect(transform.focal).toBe(focal);
    });
});

describe("Transform.orientation", () => {
    it("should have fallback orientation", () => {
        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        expect(transform.orientation).toBe(1);
    });

    it("should have orientation of node", () => {
        let orientation: number = 3;

        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { orientation: orientation, key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        expect(transform.orientation).toBe(orientation);
    });
});

describe("Transform.scale", () => {
    it("should have fallback scale", () => {
        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        expect(transform.scale).toBe(0);
    });

    it("should have scale of node", () => {
        let scale: number = 0.4;

        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { atomic_scale: scale, key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        expect(transform.scale).toBe(scale);
    });
});

describe("Transform.gpano", () => {
    it("should not have gpano set", () => {
        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        expect(transform.gpano).toBeNull();
    });

    it("should have gpano set", () => {
        let gpano: IGPano = {
            CroppedAreaLeftPixels: 0,
            CroppedAreaTopPixels: 0,
            CroppedAreaImageWidthPixels: 1,
            CroppedAreaImageHeightPixels: 1,
            FullPanoWidthPixels: 1,
            FullPanoHeightPixels: 1
        }

        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { gpano: gpano, key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        expect(transform.gpano).not.toBeNull();
    });
});

describe("Transform.pixelToVertex", () => {
    let precision: number = 8;

    let geoHelper: GeoHelper;

    beforeEach(() => {
        geoHelper = new GeoHelper();
    });

    it("should return vertex at origin", () => {
        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        let vertex: THREE.Vector3 = transform.pixelToVertex(0, 0, 0);

        expect(vertex.x).toBeCloseTo(0, precision);
        expect(vertex.y).toBeCloseTo(0, precision);
        expect(vertex.z).toBeCloseTo(0, precision);
    });

    it("should return vertex at inverted translation", () => {
        let t: number[] = [10, -20, 30];
        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        let vertex: THREE.Vector3 = transform.pixelToVertex(0, 0, 0);

        expect(vertex.x).toBeCloseTo(-10, precision);
        expect(vertex.y).toBeCloseTo(20, precision);
        expect(vertex.z).toBeCloseTo(-30, precision);
    });

    it("should return vertex at camera center", () => {
        let r: number[] = [0, Math.PI / 2, 0];
        let C: number[] = [5, 8, 12];
        let t: number[] = geoHelper.getTranslation(r, C);

        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: r },
            []);

        let transform: Transform = new Transform(node, t);

        let vertex: THREE.Vector3 = transform.pixelToVertex(0, 0, 0);

        expect(vertex.x).toBeCloseTo(C[0], precision);
        expect(vertex.y).toBeCloseTo(C[1], precision);
        expect(vertex.z).toBeCloseTo(C[2], precision);
    });

    it("should return vertex 10 units front of origin in camera direction", () => {
        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        let depth: number = 10;
        let vertex: THREE.Vector3 = transform.pixelToVertex(0, 0, depth);

        expect(vertex.x).toBeCloseTo(0, precision);
        expect(vertex.y).toBeCloseTo(0, precision);
        expect(vertex.z).toBeCloseTo(depth, precision);
    });

    it("should return vertex shifted 5 units in all directions from camera center", () => {
        let r: number[] = [Math.PI / 2, 0, 0];
        let C: number[] = [10, 10, 10];
        let t: number[] = geoHelper.getTranslation(r, C);

        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: r },
            []);

        let transform: Transform = new Transform(node, t);

        let depth: number = 5;
        let vertex: THREE.Vector3 = transform.pixelToVertex(1, 1, depth);

        expect(vertex.x).toBeCloseTo(C[0] + depth, precision);
        expect(vertex.y).toBeCloseTo(C[1] + depth, precision);
        expect(vertex.z).toBeCloseTo(C[2] - depth, precision);
    });
});

describe("Transform.projectBasic", () => {
    let precision: number = 8;

    it("should project to the image center", () => {
        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        let pixel: number[] = transform.projectBasic([0, 0, 10]);

        expect(pixel[0]).toBeCloseTo(0.5, precision);
        expect(pixel[1]).toBeCloseTo(0.5, precision);
    });

    it("should project to the first quadrant", () => {
        let t: number[] = [0, 0, 0];
        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: [0, 0, 0] },
            []);

        let transform: Transform = new Transform(node, t);

        let pixel: number[] = transform.projectBasic([1, 1, 10]);

        expect(pixel[0]).toBeGreaterThan(0);
        expect(pixel[1]).toBeGreaterThan(0);
    });
});

describe("Transform.unprojectBasic", () => {
    let precision: number = 6;

    it("should back-project to the same pixel", () => {
        let t: number[] = [10, 20, 30];
        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: [0.1, 0.2, 0.3] },
            []);

        let transform: Transform = new Transform(node, t);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for orientation 3", () => {
        let t: number[] = [10, 20, 30];
        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: [0.1, 0.2, 0.3], orientation: 3 },
            []);

        let transform: Transform = new Transform(node, t);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for orientation 6", () => {
        let t: number[] = [10, 20, 30];
        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: [0.1, 0.2, 0.3], orientation: 6 },
            []);

        let transform: Transform = new Transform(node, t);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for orientation 8", () => {
        let t: number[] = [10, 20, 30];
        let node: Node = new Node(
            0, null, true, null,
            { key: "",  rotation: [0.1, 0.2, 0.3], orientation: 8 },
            []);

        let transform: Transform = new Transform(node, t);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for full pano", () => {
        let t: number[] = [5, 15, 2];
        let node: Node = new Node(
            0, null, true, null,
            {
                gpano: {
                    CroppedAreaLeftPixels: 0,
                    CroppedAreaTopPixels: 0,
                    CroppedAreaImageWidthPixels: 1,
                    CroppedAreaImageHeightPixels: 1,
                    FullPanoWidthPixels: 1,
                    FullPanoHeightPixels: 1,
                },
                key: "",
                rotation: [0.5, -0.2, 0.3] },
            []);

        let transform: Transform = new Transform(node, t);

        let basicPixel: number[] = [0.4534546, 0.72344564];

        let point: number[] = transform.unprojectBasic(basicPixel, 100);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(basicPixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(basicPixel[1], precision);
    });
});
