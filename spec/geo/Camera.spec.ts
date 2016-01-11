/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

import {Camera} from "../../src/Geo";

import {GeoHelper} from "../helper/GeoHelper.spec";

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
