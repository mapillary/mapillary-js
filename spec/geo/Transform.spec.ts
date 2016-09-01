/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {GeoHelper} from "../helper/GeoHelper.spec";
import {IAPINavImIm, IGPano} from "../../src/API";
import {Transform} from "../../src/Geo";

describe("Transform.rt", () => {
    let epsilon: number = 10e-9;

    it("should have a unit Rt matrix", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { key: "", rotation: r };

        let transform: Transform = new Transform(apiNavImIm, null, t);
        let rt: THREE.Matrix4 = transform.rt;

        let elements: Float32Array = rt.elements;

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
        let apiNavImIm: IAPINavImIm = { key: "", rotation: r };

        let transform: Transform = new Transform(apiNavImIm, null, t);
        let rt: THREE.Matrix4 = transform.rt;

        let elements: Float32Array = rt.elements;

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
        let apiNavImIm: IAPINavImIm = { key: "", rotation: r };

        let transform: Transform = new Transform(apiNavImIm, null, t);
        let rt: THREE.Matrix4 = transform.rt;

        let elements: Float32Array = rt.elements;

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
        let apiNavImIm: IAPINavImIm = { key: "", rotation: r };

        let transform: Transform = new Transform(apiNavImIm, null, t);
        let rt: THREE.Matrix4 = transform.rt;

        let elements: Float32Array = rt.elements;

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
        let apiNavImIm: IAPINavImIm = { atomic_scale: 1, key: "", rotation: r };

        let transform: Transform = new Transform(apiNavImIm, null, t);
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
        let apiNavImIm: IAPINavImIm = { atomic_scale: 3, key: "", rotation: r };

        let transform: Transform = new Transform(apiNavImIm, null, t);
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
        let apiNavImIm: IAPINavImIm = { atomic_scale: 0.5, key: "", rotation: r };

        let transform: Transform = new Transform(apiNavImIm, null, t);
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
        let apiNavImIm: IAPINavImIm = { key: "",  rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        expect(transform.width).toBe(4);
    });

    it("should have width of node", () => {
        let width: number = 11;

        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { key: "",  rotation: [0, 0, 0], width: width };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        expect(transform.width).toBe(width);
    });
});

describe("Transform.height", () => {
    it("should have fallback height", () => {
        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { height: -1, key: "", orientation: 1, rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        expect(transform.height).toBe(3);
    });

    it("should have height of node", () => {
        let height: number = 11;

        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { height: height, key: "", orientation: 1, rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        expect(transform.height).toBe(height);
    });
});

describe("Transform.focal", () => {
    it("should have fallback focal", () => {
        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { key: "",  rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        expect(transform.focal).toBe(1);
    });

    it("should have focal of node", () => {
        let focal: number = 0.84;

        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { cfocal: focal, key: "",  rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        expect(transform.focal).toBe(focal);
    });
});

describe("Transform.orientation", () => {
    it("should have fallback orientation", () => {
        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { key: "",  rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        expect(transform.orientation).toBe(1);
    });

    it("should have orientation of node", () => {
        let orientation: number = 3;

        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { key: "", orientation: orientation, rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        expect(transform.orientation).toBe(orientation);
    });
});

describe("Transform.scale", () => {
    it("should have fallback scale", () => {
        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { key: "",  rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        expect(transform.scale).toBe(0);
    });

    it("should have scale of node", () => {
        let scale: number = 0.4;

        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { atomic_scale: scale, key: "",  rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        expect(transform.scale).toBe(scale);
    });
});

describe("Transform.gpano", () => {
    it("should not have gpano set", () => {
        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { key: "",  rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        expect(transform.gpano).toBeNull();
    });

    it("should have gpano set", () => {
        let gpano: IGPano = {
            CroppedAreaImageHeightPixels: 1,
            CroppedAreaImageWidthPixels: 1,
            CroppedAreaLeftPixels: 0,
            CroppedAreaTopPixels: 0,
            FullPanoHeightPixels: 1,
            FullPanoWidthPixels: 1,
        };

        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { gpano: gpano, key: "",  rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        expect(transform.gpano).not.toBeNull();
    });
});

describe("Transform.unprojectSfM", () => {
    let precision: number = 8;

    let geoHelper: GeoHelper;

    beforeEach(() => {
        geoHelper = new GeoHelper();
    });

    it("should return vertex at origin", () => {
        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { key: "",  rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        let sfm: number[] = transform.unprojectSfM([0, 0], 0);

        expect(sfm[0]).toBeCloseTo(0, precision);
        expect(sfm[1]).toBeCloseTo(0, precision);
        expect(sfm[2]).toBeCloseTo(0, precision);
    });

    it("should return vertex at inverted translation", () => {
        let t: number[] = [10, -20, 30];
        let apiNavImIm: IAPINavImIm = { key: "",  rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        let sfm: number[] = transform.unprojectSfM([0, 0], 0);

        expect(sfm[0]).toBeCloseTo(-10, precision);
        expect(sfm[1]).toBeCloseTo(20, precision);
        expect(sfm[2]).toBeCloseTo(-30, precision);
    });

    it("should return vertex at camera center", () => {
        let r: number[] = [0, Math.PI / 2, 0];
        let C: number[] = [5, 8, 12];
        let t: number[] = geoHelper.getTranslation(r, C);
        let apiNavImIm: IAPINavImIm = { key: "",  rotation: r };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        let sfm: number[] = transform.unprojectSfM([0, 0], 0);

        expect(sfm[0]).toBeCloseTo(C[0], precision);
        expect(sfm[1]).toBeCloseTo(C[1], precision);
        expect(sfm[2]).toBeCloseTo(C[2], precision);
    });

    it("should return vertex 10 units front of origin in camera direction", () => {
        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { key: "",  rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        let depth: number = 10;
        let sfm: number[] = transform.unprojectSfM([0, 0], depth);

        expect(sfm[0]).toBeCloseTo(0, precision);
        expect(sfm[1]).toBeCloseTo(0, precision);
        expect(sfm[2]).toBeCloseTo(depth, precision);
    });

    it("should return vertex shifted 5 units in all directions from camera center", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { key: "",  rotation: r };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        let depth: number = 5;
        let sfm: number[] = transform.unprojectSfM([0.5, 0], depth);

        expect(sfm[0]).toBeCloseTo(depth * Math.sin(Math.atan(0.5)), precision);
        expect(sfm[1]).toBeCloseTo(0, precision);
        expect(sfm[2]).toBeCloseTo(depth * Math.cos(Math.atan(0.5)), precision);
    });
});

describe("Transform.projectBasic", () => {
    let precision: number = 8;

    it("should project to the image center", () => {
        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { key: "",  rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        let pixel: number[] = transform.projectBasic([0, 0, 10]);

        expect(pixel[0]).toBeCloseTo(0.5, precision);
        expect(pixel[1]).toBeCloseTo(0.5, precision);
    });

    it("should project to the first quadrant", () => {
        let t: number[] = [0, 0, 0];
        let apiNavImIm: IAPINavImIm = { key: "",  rotation: [0, 0, 0] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        let pixel: number[] = transform.projectBasic([1, 1, 10]);

        expect(pixel[0]).toBeGreaterThan(0);
        expect(pixel[1]).toBeGreaterThan(0);
    });
});

describe("Transform.unprojectBasic", () => {
    let precision: number = 6;

    it("should back-project to the same pixel", () => {
        let t: number[] = [10, 20, 30];
        let apiNavImIm: IAPINavImIm = { key: "",  rotation: [0.1, 0.2, 0.3] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for orientation 3", () => {
        let t: number[] = [10, 20, 30];
        let apiNavImIm: IAPINavImIm = { key: "", orientation: 3, rotation: [0.1, 0.2, 0.3] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for orientation 6", () => {
        let t: number[] = [10, 20, 30];
        let apiNavImIm: IAPINavImIm = { key: "", orientation: 6, rotation: [0.1, 0.2, 0.3] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for orientation 8", () => {
        let t: number[] = [10, 20, 30];
        let apiNavImIm: IAPINavImIm = { key: "",  orientation: 8, rotation: [0.1, 0.2, 0.3] };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        let pixel: number[] = [-0.1, 0.2];

        let point: number[] = transform.unprojectBasic(pixel, 10);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(pixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(pixel[1], precision);
    });

    it("should back-project to the same pixel for full pano", () => {
        let t: number[] = [5, 15, 2];
        let apiNavImIm: IAPINavImIm = {
            gpano: {
                CroppedAreaImageHeightPixels: 1,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0,
                FullPanoHeightPixels: 1,
                FullPanoWidthPixels: 1,
            },
            key: "",
            rotation: [0.5, -0.2, 0.3],
        };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        let basicPixel: number[] = [0.4534546, 0.72344564];

        let point: number[] = transform.unprojectBasic(basicPixel, 100);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(basicPixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(basicPixel[1], precision);
    });

    it("should back-project to the same pixel for cropped pano", () => {
        let t: number[] = [5, 15, 2];
        let apiNavImIm: IAPINavImIm = {
            gpano: {
                CroppedAreaImageHeightPixels: 600,
                CroppedAreaImageWidthPixels: 400,
                CroppedAreaLeftPixels: 200,
                CroppedAreaTopPixels: 100,
                FullPanoHeightPixels: 1000,
                FullPanoWidthPixels: 2000,
            },
            key: "",
            rotation: [0.5, -0.2, 0.3],
        };

        let transform: Transform = new Transform(apiNavImIm, null, t);

        let basicPixel: number[] = [0.4534546, 0.72344564];

        let point: number[] = transform.unprojectBasic(basicPixel, 100);

        let backprojectedPixel: number[] = transform.projectBasic(point);

        expect(backprojectedPixel[0]).toBeCloseTo(basicPixel[0], precision);
        expect(backprojectedPixel[1]).toBeCloseTo(basicPixel[1], precision);
    });
});
