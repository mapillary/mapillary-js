import * as THREE from "three";

import {Camera} from "../../src/Geo";

describe("Camera.ctor", () => {
    it("should be initialized to default values", () => {
        let camera: Camera = new Camera();

        expect(camera.position.x).toBe(0);
        expect(camera.position.y).toBe(0);
        expect(camera.position.z).toBe(0);

        expect(camera.lookat.x).toBe(0);
        expect(camera.lookat.y).toBe(0);
        expect(camera.lookat.z).toBe(1);

        expect(camera.up.x).toBe(0);
        expect(camera.up.y).toBe(-1);
        expect(camera.up.z).toBe(0);

        expect(camera.focal).toBe(1);
    });
});

describe("Camera.lerpCameras", () => {
    it("should interpolate position", () => {
        let a: Camera = new Camera();
        a.position.copy(new THREE.Vector3(0, 0, 0));

        let b: Camera = new Camera();
        b.position.copy(new THREE.Vector3(10, 20, 30));

        let camera: Camera = new Camera();

        camera.lerpCameras(a, b, 0);

        expect(camera.position.x).toBe(a.position.x);
        expect(camera.position.y).toBe(a.position.y);
        expect(camera.position.z).toBe(a.position.z);

        camera.lerpCameras(a, b, 1);

        expect(camera.position.x).toBe(b.position.x);
        expect(camera.position.y).toBe(b.position.y);
        expect(camera.position.z).toBe(b.position.z);

        camera.lerpCameras(a, b, 0.5);

        expect(camera.position.x).toBe(b.position.x / 2);
        expect(camera.position.y).toBe(b.position.y / 2);
        expect(camera.position.z).toBe(b.position.z / 2);
    });

    it("should interpolate lookat", () => {
        let a: Camera = new Camera();
        a.lookat.copy(new THREE.Vector3(0, 0, 0));

        let b: Camera = new Camera();
        b.lookat.copy(new THREE.Vector3(-5, -8, -11));

        let camera: Camera = new Camera();

        camera.lerpCameras(a, b, 0);

        expect(camera.lookat.x).toBe(a.lookat.x);
        expect(camera.lookat.y).toBe(a.lookat.y);
        expect(camera.lookat.z).toBe(a.lookat.z);

        camera.lerpCameras(a, b, 1);

        expect(camera.lookat.x).toBe(b.lookat.x);
        expect(camera.lookat.y).toBe(b.lookat.y);
        expect(camera.lookat.z).toBe(b.lookat.z);

        camera.lerpCameras(a, b, 0.5);

        expect(camera.lookat.x).toBe(b.lookat.x / 2);
        expect(camera.lookat.y).toBe(b.lookat.y / 2);
        expect(camera.lookat.z).toBe(b.lookat.z / 2);
    });

    it("should interpolate up vector", () => {
        let a: Camera = new Camera();
        a.up.copy(new THREE.Vector3(10, 20, 30));

        let b: Camera = new Camera();
        b.up.copy(new THREE.Vector3(0, 0, 0));

        let camera: Camera = new Camera();

        camera.lerpCameras(a, b, 0);

        expect(camera.up.x).toBe(a.up.x);
        expect(camera.up.y).toBe(a.up.y);
        expect(camera.up.z).toBe(a.up.z);

        camera.lerpCameras(a, b, 1);

        expect(camera.up.x).toBe(b.up.x);
        expect(camera.up.y).toBe(b.up.y);
        expect(camera.up.z).toBe(b.up.z);

        camera.lerpCameras(a, b, 0.5);

        expect(camera.up.x).toBe(a.up.x / 2);
        expect(camera.up.y).toBe(a.up.y / 2);
        expect(camera.up.z).toBe(a.up.z / 2);
    });

    it("should interpolate focal", () => {
        let a: Camera = new Camera();
        a.focal = 0.5;

        let b: Camera = new Camera();
        b.focal = 3.3;

        let camera: Camera = new Camera();

        camera.lerpCameras(a, b, 0);

        expect(camera.focal).toBe(a.focal);

        camera.lerpCameras(a, b, 1);

        expect(camera.focal).toBe(b.focal);

        camera.lerpCameras(a, b, 0.5);

        expect(camera.focal).toBe((a.focal + b.focal) / 2);
    });
});

describe("Camera.copy", () => {
    it("should copy properties of other camera", () => {
        let camera: Camera = new Camera();

        let position: number[] = [10, 20, -30];
        let lookat: number[] = [-5, 2, 19];
        let up: number[] = [0.3, 0.7, -0.5];
        let focal: number = 0.85;

        let other: Camera = new Camera();
        other.position.fromArray(position);
        other.lookat.fromArray(lookat);
        other.up.fromArray(up);
        other.focal = focal;

        camera.copy(other);

        expect(camera.position.x).toBe(position[0]);
        expect(camera.position.y).toBe(position[1]);
        expect(camera.position.z).toBe(position[2]);

        expect(camera.lookat.x).toBe(lookat[0]);
        expect(camera.lookat.y).toBe(lookat[1]);
        expect(camera.lookat.z).toBe(lookat[2]);

        expect(camera.up.x).toBe(up[0]);
        expect(camera.up.y).toBe(up[1]);
        expect(camera.up.z).toBe(up[2]);

        expect(camera.focal).toBe(focal);
    });
});

describe("Camera.clone", () => {
    it("should clone properties of other camera", () => {
        let camera: Camera = new Camera();

        let position: number[] = [5, 10, -15];
        let lookat: number[] = [-5, 5, 6];
        let up: number[] = [0.6, 0.2, -0.4];
        let focal: number = 0.75;

        camera.position.fromArray(position);
        camera.lookat.fromArray(lookat);
        camera.up.fromArray(up);
        camera.focal = focal;

        let result: Camera = camera.clone();

        expect(result.position.x).toBe(position[0]);
        expect(result.position.y).toBe(position[1]);
        expect(result.position.z).toBe(position[2]);

        expect(result.lookat.x).toBe(lookat[0]);
        expect(result.lookat.y).toBe(lookat[1]);
        expect(result.lookat.z).toBe(lookat[2]);

        expect(result.up.x).toBe(up[0]);
        expect(result.up.y).toBe(up[1]);
        expect(result.up.z).toBe(up[2]);

        expect(result.focal).toBe(focal);
    });
});

describe("Camera.diff", () => {
    let precision: number = 8;

    it("should have difference based on position", () => {
        let camera: Camera = new Camera();
        camera.position.fromArray([0, 0, 0]);

        let other: Camera = new Camera();
        other.position.fromArray([0, 0, 2]);

        let diff: number = camera.diff(other);

        expect(diff).toBe(4);
    });

    it("should have difference based on lookat", () => {
        let camera: Camera = new Camera();
        camera.lookat.fromArray([0, 1, 0]);

        let other: Camera = new Camera();
        other.lookat.fromArray([0, 3, 0]);

        let diff: number = camera.diff(other);

        expect(diff).toBe(4);
    });

    it("should have difference based on up", () => {
        let camera: Camera = new Camera();
        camera.up.fromArray([-1, 0, 0]);

        let other: Camera = new Camera();
        other.up.fromArray([1, 0, 0]);

        let diff: number = camera.diff(other);

        expect(diff).toBe(4);
    });

    it("should have difference based on focal", () => {
        let camera: Camera = new Camera();
        camera.focal = 0.85;

        let other: Camera = new Camera();
        other.focal = 0.89;

        let diff: number = camera.diff(other);

        expect(diff).toBeCloseTo(4, precision);
    });
});
