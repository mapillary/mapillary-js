import * as THREE from "three";

import {TransformHelper} from "../helper/TransformHelper.spec";

import {
    Transform,
    ViewportCoords,
} from "../../src/Geo";

let precision: number = 8;

describe("ViewportCoords.canvasToViewport", () => {
    let viewportCoords: ViewportCoords;

    beforeEach(() => {
        viewportCoords = new ViewportCoords();
    });

    it("should convert canvas origin to (-1, 1)", () => {
        let canvasX: number = 0;
        let canvasY: number = 0;

        let viewport1: number[] = viewportCoords.canvasToViewport(
            canvasX,
            canvasY,
            <HTMLElement>{ offsetHeight: 240, offsetWidth: 320 });

        let viewport2: number[] = viewportCoords.canvasToViewport(
            canvasX,
            canvasY,
            <HTMLElement>{ offsetHeight: 320, offsetWidth: 240 });

        let viewport3: number[] = viewportCoords.canvasToViewport(
            canvasX,
            canvasY,
            <HTMLElement>{ offsetHeight: 1080, offsetWidth: 1920 });

        expect(viewport1[0]).toBeCloseTo(-1, precision);
        expect(viewport1[1]).toBeCloseTo(1, precision);
        expect(viewport2[0]).toBeCloseTo(-1, precision);
        expect(viewport2[1]).toBeCloseTo(1, precision);
        expect(viewport3[0]).toBeCloseTo(-1, precision);
        expect(viewport3[1]).toBeCloseTo(1, precision);
    });

    it("should convert canvas max to (1, -1)", () => {
        let viewport1: number[] = viewportCoords
            .canvasToViewport(320, 240, <HTMLElement>{ offsetHeight: 240, offsetWidth: 320 });

        let viewport2: number[] = viewportCoords
            .canvasToViewport(240, 320, <HTMLElement>{ offsetHeight: 320, offsetWidth: 240 });

        let viewport3: number[] = viewportCoords
            .canvasToViewport(1920, 1080, <HTMLElement>{ offsetHeight: 1080, offsetWidth: 1920 });

        expect(viewport1[0]).toBeCloseTo(1, precision);
        expect(viewport1[1]).toBeCloseTo(-1, precision);
        expect(viewport2[0]).toBeCloseTo(1, precision);
        expect(viewport2[1]).toBeCloseTo(-1, precision);
        expect(viewport3[0]).toBeCloseTo(1, precision);
        expect(viewport3[1]).toBeCloseTo(-1, precision);
    });

    it("should convert canvas center to (0, 0)", () => {
        let viewport1: number[] = viewportCoords
            .canvasToViewport(160, 120, <HTMLElement>{ offsetHeight: 240, offsetWidth: 320 });

        let viewport2: number[] = viewportCoords
            .canvasToViewport(120, 160, <HTMLElement>{ offsetHeight: 320, offsetWidth: 240 });

        let viewport3: number[] = viewportCoords
            .canvasToViewport(960, 540, <HTMLElement>{ offsetHeight: 1080, offsetWidth: 1920 });

        expect(viewport1[0]).toBeCloseTo(0, precision);
        expect(viewport1[1]).toBeCloseTo(0, precision);
        expect(viewport2[0]).toBeCloseTo(0, precision);
        expect(viewport2[1]).toBeCloseTo(0, precision);
        expect(viewport3[0]).toBeCloseTo(0, precision);
        expect(viewport3[1]).toBeCloseTo(0, precision);
    });
});

describe("ViewportCoords.viewportToCanvas", () => {
    let viewportCoords: ViewportCoords;

    beforeEach(() => {
        viewportCoords = new ViewportCoords();
    });

    it("should convert viewport (-1, 1) to canvas origin", () => {
        let canvas1: number[] = viewportCoords
            .viewportToCanvas(-1, 1, <HTMLElement>{ offsetHeight: 240, offsetWidth: 320 });

        let canvas2: number[] = viewportCoords
            .viewportToCanvas(-1, 1, <HTMLElement>{ offsetHeight: 320, offsetWidth: 240 });

        let canvas3: number[] = viewportCoords
            .viewportToCanvas(-1, 1, <HTMLElement>{ offsetHeight: 1080, offsetWidth: 1920 });

        expect(canvas1[0]).toBeCloseTo(0, precision);
        expect(canvas1[1]).toBeCloseTo(0, precision);
        expect(canvas2[0]).toBeCloseTo(0, precision);
        expect(canvas2[1]).toBeCloseTo(0, precision);
        expect(canvas3[0]).toBeCloseTo(0, precision);
        expect(canvas3[1]).toBeCloseTo(0, precision);
    });

    it("should convert viewport (1, -1) to canvas max", () => {
        let canvas1: number[] = viewportCoords
            .viewportToCanvas(1, -1, <HTMLElement>{ offsetHeight: 240, offsetWidth: 320 });

        let canvas2: number[] = viewportCoords
            .viewportToCanvas(1, -1, <HTMLElement>{ offsetHeight: 320, offsetWidth: 240 });

        let canvas3: number[] = viewportCoords
            .viewportToCanvas(1, -1, <HTMLElement>{ offsetHeight: 1080, offsetWidth: 1920 });

        expect(canvas1[0]).toBeCloseTo(320, precision);
        expect(canvas1[1]).toBeCloseTo(240, precision);
        expect(canvas2[0]).toBeCloseTo(240, precision);
        expect(canvas2[1]).toBeCloseTo(320, precision);
        expect(canvas3[0]).toBeCloseTo(1920, precision);
        expect(canvas3[1]).toBeCloseTo(1080, precision);
    });

    it("should convert viewport (0, 0) to canvas center", () => {
        let canvas1: number[] = viewportCoords
            .viewportToCanvas(0, 0, <HTMLElement>{ offsetHeight: 240, offsetWidth: 320 });

        let canvas2: number[] = viewportCoords
            .viewportToCanvas(0, 0, <HTMLElement>{ offsetHeight: 320, offsetWidth: 240 });

        let canvas3: number[] = viewportCoords
            .viewportToCanvas(0, 0, <HTMLElement>{ offsetHeight: 1080, offsetWidth: 1920 });

        expect(canvas1[0]).toBeCloseTo(160, precision);
        expect(canvas1[1]).toBeCloseTo(120, precision);
        expect(canvas2[0]).toBeCloseTo(120, precision);
        expect(canvas2[1]).toBeCloseTo(160, precision);
        expect(canvas3[0]).toBeCloseTo(960, precision);
        expect(canvas3[1]).toBeCloseTo(540, precision);
    });
});

describe("ViewportCoords.getBasicDistances", () => {
    let transformHelper: TransformHelper;

    beforeEach(() => {
        transformHelper = new TransformHelper();
    });

    it("should be zero when basic image corners correspond to viewport corners", () => {
        let transform: Transform = transformHelper.createTransform();
        let perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();

        let viewportCoords: ViewportCoords = new ViewportCoords();

        let vector3: THREE.Vector3 = new THREE.Vector3();
        spyOn(THREE, "Vector3").and.callFake(
            (x: number, y: number, z: number): THREE.Vector3 => {
                vector3.setX(x);
                vector3.setY(y);
                vector3.setZ(z);

                return vector3;
            });

        spyOn(vector3, "unproject").and.callFake(
            (pc: THREE.PerspectiveCamera): THREE.Vector3 => {
                return vector3;
            });

        spyOn(transform, "projectBasic").and.callFake(
            (point3d: number[]): number[] => {
                let basic: number[] = viewportCoords
                    .viewportToCanvas(point3d[0], point3d[1], <HTMLElement>{ offsetHeight: 1, offsetWidth: 1 });

                return basic;
            });

        let basicDistances: number[] = viewportCoords.getBasicDistances(transform, perspectiveCamera);

        expect(basicDistances[0]).toBeCloseTo(0, precision);
        expect(basicDistances[1]).toBeCloseTo(0, precision);
        expect(basicDistances[2]).toBeCloseTo(0, precision);
        expect(basicDistances[3]).toBeCloseTo(0, precision);
    });

    it("should be zero when three basic image corners correspond to viewport corners and forth has distance", () => {
        let transform: Transform = transformHelper.createTransform();
        let perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();

        let viewportCoords: ViewportCoords = new ViewportCoords();

        let vector3: THREE.Vector3 = new THREE.Vector3();
        spyOn(THREE, "Vector3").and.callFake(
            (x: number, y: number, z: number): THREE.Vector3 => {
                vector3.setX(x);
                vector3.setY(y);
                vector3.setZ(z);

                return vector3;
            });

        spyOn(vector3, "unproject").and.callFake(
            (pc: THREE.PerspectiveCamera): THREE.Vector3 => {
                return vector3;
            });

        spyOn(transform, "projectBasic").and.callFake(
            (point3d: number[]): number[] => {
                let basic: number[] = viewportCoords
                    .viewportToCanvas(point3d[0], point3d[1], <HTMLElement>{ offsetHeight: 1, offsetWidth: 1 });

                if (basic[0] === 0 && basic[1] === 0) {
                    basic[0] = -0.1;
                    basic[1] = -0.1;
                }

                return basic;
            });

        let basicDistances: number[] = viewportCoords.getBasicDistances(transform, perspectiveCamera);

        expect(basicDistances[0]).toBeCloseTo(0, precision);
        expect(basicDistances[1]).toBeCloseTo(0, precision);
        expect(basicDistances[2]).toBeCloseTo(0, precision);
        expect(basicDistances[3]).toBeCloseTo(0, precision);
    });

    it("should be non zero for one side when both corners of that side are outside of image", () => {
        let transform: Transform = transformHelper.createTransform();
        let perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();

        let viewportCoords: ViewportCoords = new ViewportCoords();

        let vector3: THREE.Vector3 = new THREE.Vector3();
        spyOn(THREE, "Vector3").and.callFake(
            (x: number, y: number, z: number): THREE.Vector3 => {
                vector3.setX(x);
                vector3.setY(y);
                vector3.setZ(z);

                return vector3;
            });

        spyOn(vector3, "unproject").and.callFake(
            (pc: THREE.PerspectiveCamera): THREE.Vector3 => {
                return vector3;
            });

        spyOn(transform, "projectBasic").and.callFake(
            (point3d: number[]): number[] => {
                let basic: number[] = viewportCoords
                    .viewportToCanvas(point3d[0], point3d[1], <HTMLElement>{ offsetHeight: 1, offsetWidth: 1 });

                if (basic[0] === 0 && basic[1] === 0) {
                    basic[1] = -0.1;
                } else if (basic[0] === 1 && basic[1] === 0) {
                    basic[1] = -0.1;
                }

                return basic;
            });

        let basicDistances: number[] = viewportCoords.getBasicDistances(transform, perspectiveCamera);

        expect(basicDistances[0]).toBeCloseTo(0.1, precision);
        expect(basicDistances[1]).toBeCloseTo(0, precision);
        expect(basicDistances[2]).toBeCloseTo(0, precision);
        expect(basicDistances[3]).toBeCloseTo(0, precision);
    });
});

describe("ViewportCoords.getPixelDistances", () => {
    let transformHelper: TransformHelper;

    beforeEach(() => {
        transformHelper = new TransformHelper();
    });

    it("should be zero when basic image corners correspond to viewport corners", () => {
        let transform: Transform = transformHelper.createTransform();
        let perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();

        let viewportCoords: ViewportCoords = new ViewportCoords();

        let vector3: THREE.Vector3 = new THREE.Vector3();
        spyOn(THREE, "Vector3").and.callFake(
            (x: number, y: number, z: number): THREE.Vector3 => {
                vector3.setX(x);
                vector3.setY(y);
                vector3.setZ(z);

                return vector3;
            });

        spyOn(vector3, "unproject").and.callFake(
            (pc: THREE.PerspectiveCamera): THREE.Vector3 => {
                return vector3;
            });

        spyOn(transform, "projectBasic").and.callFake(
            (point3d: number[]): number[] => {
                let basic: number[] = viewportCoords
                    .viewportToCanvas(point3d[0], point3d[1], <HTMLElement>{ offsetHeight: 1, offsetWidth: 1 });

                return basic;
            });

        spyOn(transform, "unprojectBasic").and.callFake(
            (basic: number[]): number[] => {
                return basic.concat([1]);
            });

        spyOn(vector3, "project").and.callFake(
            (pc: THREE.PerspectiveCamera): THREE.Vector3 => {
                return vector3;
            });

        let pixelDistances: number[] = viewportCoords
            .getPixelDistances(<HTMLElement>{ offsetHeight: 1, offsetWidth: 1 }, transform, perspectiveCamera);

        expect(pixelDistances[0]).toBeCloseTo(0, precision);
        expect(pixelDistances[1]).toBeCloseTo(0, precision);
        expect(pixelDistances[2]).toBeCloseTo(0, precision);
        expect(pixelDistances[3]).toBeCloseTo(0, precision);
    });

    it("should be zero when three basic image corners correspond to viewport corners and forth has distance", () => {
        let transform: Transform = transformHelper.createTransform();
        let perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();

        let viewportCoords: ViewportCoords = new ViewportCoords();

        let vector3: THREE.Vector3 = new THREE.Vector3();
        spyOn(THREE, "Vector3").and.callFake(
            (x: number, y: number, z: number): THREE.Vector3 => {
                vector3.setX(x);
                vector3.setY(y);
                vector3.setZ(z);

                return vector3;
            });

        spyOn(vector3, "unproject").and.callFake(
            (pc: THREE.PerspectiveCamera): THREE.Vector3 => {
                return vector3;
            });

        spyOn(transform, "projectBasic").and.callFake(
            (point3d: number[]): number[] => {
                let basic: number[] = viewportCoords
                    .viewportToCanvas(point3d[0], point3d[1], <HTMLElement>{ offsetHeight: 1, offsetWidth: 1 });

                if (basic[0] === 0 && basic[1] === 0) {
                    basic[0] = -0.1;
                    basic[1] = -0.1;
                }

                return basic;
            });

        spyOn(transform, "unprojectBasic").and.callFake(
            (basic: number[]): number[] => {
                return basic.concat([1]);
            });

        spyOn(vector3, "project").and.callFake(
            (pc: THREE.PerspectiveCamera): THREE.Vector3 => {
                return vector3;
            });

        let pixelDistances: number[] = viewportCoords
            .getPixelDistances(<HTMLElement>{ offsetHeight: 1, offsetWidth: 1 }, transform, perspectiveCamera);

        expect(pixelDistances[0]).toBeCloseTo(0, precision);
        expect(pixelDistances[1]).toBeCloseTo(0, precision);
        expect(pixelDistances[2]).toBeCloseTo(0, precision);
        expect(pixelDistances[3]).toBeCloseTo(0, precision);
    });

    it("should be non zero for one side when both corners of that side are outside of image", () => {
        let transform: Transform = transformHelper.createTransform();
        let perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();

        let viewportCoords: ViewportCoords = new ViewportCoords();

        let vector3: THREE.Vector3 = new THREE.Vector3();
        spyOn(THREE, "Vector3").and.callFake(
            (x: number, y: number, z: number): THREE.Vector3 => {
                vector3.setX(x);
                vector3.setY(y);
                vector3.setZ(z);

                return vector3;
            });

        spyOn(vector3, "unproject").and.callFake(
            (pc: THREE.PerspectiveCamera): THREE.Vector3 => {
                return vector3;
            });

        spyOn(transform, "projectBasic").and.callFake(
            (point3d: number[]): number[] => {
                let basic: number[] = viewportCoords
                    .viewportToCanvas(point3d[0], point3d[1], <HTMLElement>{ offsetHeight: 1, offsetWidth: 1 });

                if (basic[0] === 0 && basic[1] === 0) {
                    basic[1] = -0.1;
                } else if (basic[0] === 1 && basic[1] === 0) {
                    basic[1] = -0.1;
                }

                return basic;
            });

        spyOn(transform, "unprojectBasic").and.callFake(
            (basic: number[]): number[] => {
                let viewport: number[] = viewportCoords
                    .canvasToViewport(basic[0], basic[1], <HTMLElement>{ offsetHeight: 1, offsetWidth: 1 });

                let point3d: number[] = viewport.concat([1]);

                if (point3d[0] === -1 && point3d[1] === 1) {
                    point3d[1] = 0.8;
                } else if (point3d[0] === 1 && point3d[1] === 1) {
                    point3d[1] = 0.8;
                }

                return point3d;
            });

        spyOn(vector3, "project").and.callFake(
            (pc: THREE.PerspectiveCamera): THREE.Vector3 => {
                return vector3;
            });

        let pixelDistances: number[] = viewportCoords
            .getPixelDistances(<HTMLElement>{ offsetHeight: 1, offsetWidth: 1 }, transform, perspectiveCamera);

        expect(pixelDistances[0]).toBeCloseTo(0.1, precision);
        expect(pixelDistances[1]).toBeCloseTo(0, precision);
        expect(pixelDistances[2]).toBeCloseTo(0, precision);
        expect(pixelDistances[3]).toBeCloseTo(0, precision);
    });
});

describe("ViewportCoords.worldToCamera", () => {
    let viewportCoords: ViewportCoords;

    beforeEach(() => {
        viewportCoords = new ViewportCoords();
    });

    it("should convert to same coordinates", () => {
        const point3d: number[] = [10, 20, 30];

        let perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
        perspectiveCamera.matrixWorldInverse = new THREE.Matrix4().identity();

        const pointCamera: number[] = viewportCoords.worldToCamera(point3d, perspectiveCamera);

        expect(pointCamera[0]).toBeCloseTo(point3d[0], precision);
        expect(pointCamera[1]).toBeCloseTo(point3d[1], precision);
        expect(pointCamera[2]).toBeCloseTo(point3d[2], precision);
    });

    it("should negate coordinates", () => {
        const point3d: number[] = [10, 20, 30];

        let perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
        perspectiveCamera.matrixWorldInverse = new THREE.Matrix4().makeScale(-1, -1, -1);

        const pointCamera: number[] = viewportCoords.worldToCamera(point3d, perspectiveCamera);

        expect(pointCamera[0]).toBeCloseTo(-point3d[0], precision);
        expect(pointCamera[1]).toBeCloseTo(-point3d[1], precision);
        expect(pointCamera[2]).toBeCloseTo(-point3d[2], precision);
    });
});

describe("ViewportCoords.basicToCanvasSafe", () => {
    let transformHelper: TransformHelper;

    beforeEach(() => {
        transformHelper = new TransformHelper();
    });

    it("should be null when behind camera", () => {
        const perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
        perspectiveCamera.matrixWorldInverse = new THREE.Matrix4().identity();

        const transform: Transform = transformHelper.createTransform();
        spyOn(transform, "unprojectBasic").and.returnValue([1, 1, 1]);

        const viewportCoords: ViewportCoords = new ViewportCoords();

        const [basicX, basicY]: number[] = [0, 0];
        const canvas: number[] =
            viewportCoords.basicToCanvasSafe(
                basicX,
                basicY,
                { offsetHeight: 100, offsetWidth: 100 },
                transform,
                perspectiveCamera);

        expect(canvas).toBe(null);
    });

    it("should not be null when in front of camera", () => {
        const perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
        perspectiveCamera.matrixWorldInverse = new THREE.Matrix4().makeScale(-1, -1, -1);

        const transform: Transform = transformHelper.createTransform();
        spyOn(transform, "unprojectBasic").and.returnValue([1, 1, 1]);

        const viewportCoords: ViewportCoords = new ViewportCoords();

        const [basicX, basicY]: number[] = [0, 0];
        const canvas: number[] =
            viewportCoords.basicToCanvasSafe(
                basicX,
                basicY,
                { offsetHeight: 100, offsetWidth: 100 },
                transform,
                perspectiveCamera);

        expect(canvas).not.toBe(null);
    });
});

describe("ViewportCoords.basicToViewportSafe", () => {
    let transformHelper: TransformHelper;

    beforeEach(() => {
        transformHelper = new TransformHelper();
    });

    it("should be null when behind camera", () => {
        const perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
        perspectiveCamera.matrixWorldInverse = new THREE.Matrix4().identity();

        const transform: Transform = transformHelper.createTransform();
        spyOn(transform, "unprojectBasic").and.returnValue([1, 1, 1]);

        const viewportCoords: ViewportCoords = new ViewportCoords();

        const [basicX, basicY]: number[] = [0, 0];
        const canvas: number[] =
            viewportCoords.basicToViewportSafe(
                basicX,
                basicY,
                transform,
                perspectiveCamera);

        expect(canvas).toBe(null);
    });

    it("should not be null when in front of camera", () => {
        const perspectiveCamera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
        perspectiveCamera.matrixWorldInverse = new THREE.Matrix4().makeScale(-1, -1, -1);

        const transform: Transform = transformHelper.createTransform();
        spyOn(transform, "unprojectBasic").and.returnValue([1, 1, 1]);

        const viewportCoords: ViewportCoords = new ViewportCoords();

        const [basicX, basicY]: number[] = [0, 0];
        const canvas: number[] =
            viewportCoords.basicToViewportSafe(
                basicX,
                basicY,
                transform,
                perspectiveCamera);

        expect(canvas).not.toBe(null);
    });
});
