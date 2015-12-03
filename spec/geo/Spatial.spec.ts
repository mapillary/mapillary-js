/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

import {Spatial} from "../../src/Geo";

describe("Spatial.rotationMatrix", () => {
    let spatial: Spatial;
    let epsilon: number = 10e-8;

    beforeEach(() => {
        spatial = new Spatial();
    });

    it("should return a rotation matrix rotating 90 degrees around the x-axis", () => {
        let angleAxis: number[] = [Math.PI / 2, 0, 0];

        let matrix: THREE.Matrix4 = spatial.rotationMatrix(angleAxis);

        let elements: Float32Array = matrix.elements;

        // elements is a column-major list
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
});

describe("Spatial.rotate", () => {
    let spatial: Spatial;
    let epsilon: number = 10e-8;

    beforeEach(() => {
        spatial = new Spatial();
    });

    it("should return a vector rotated 90 degrees around the x-axis", () => {
        let vector: number[] = [0, 0, 1];
        let angleAxis: number[] = [Math.PI / 2, 0, 0];

        let rotated: THREE.Vector3 = spatial.rotate(vector, angleAxis);

        // counter-clockwise rotation about the x-axis pointing towards the observer
        expect(rotated.x).toBe(0);
        expect(rotated.y).toBe(-1);
        expect(rotated.z).toBeLessThan(epsilon);
    });
});

describe("Spatial.opticalCenter", () => {
    let spatial: Spatial;
    let epsilon: number = 10e-8;

    beforeEach(() => {
        spatial = new Spatial();
    });

    it("should return the correct optical center", () => {
        let C: number[] = [1, 0, 0];

        // Random rotation by 120 degrees
        let r: THREE.Vector3 = new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(2 * Math.PI / 3);
        let R: THREE.Matrix4 = spatial.rotationMatrix(r.toArray());

        // t = -RC
        let t: THREE.Vector3 = new THREE.Vector3().fromArray(C).applyMatrix4(R).multiplyScalar(-1);

        let opticalCenter: THREE.Vector3 = spatial.opticalCenter(r.toArray(), t.toArray());

        expect(opticalCenter.x).toBeCloseTo(C[0], epsilon);
        expect(opticalCenter.y).toBeCloseTo(C[1], epsilon);
        expect(opticalCenter.z).toBeCloseTo(C[2], epsilon);
    });

    it("should return the correct optical center", () => {
        let C: number[] = [54, 22, -34];

        // Random rotation by 60 degrees
        let r: THREE.Vector3 = new THREE.Vector3(-1, 1, -2).normalize().multiplyScalar(Math.PI / 3);
        let R: THREE.Matrix4 = spatial.rotationMatrix(r.toArray());

        // t = -RC
        let t: THREE.Vector3 = new THREE.Vector3().fromArray(C).applyMatrix4(R).multiplyScalar(-1);

        let opticalCenter: THREE.Vector3 = spatial.opticalCenter(r.toArray(), t.toArray());

        expect(opticalCenter.x).toBeCloseTo(C[0], epsilon);
        expect(opticalCenter.y).toBeCloseTo(C[1], epsilon);
        expect(opticalCenter.z).toBeCloseTo(C[2], epsilon);
    });
});

describe("Spatial.viewingDirection", () => {
    let spatial: Spatial;
    let epsilon: number = 10e-8;

    beforeEach(() => {
        spatial = new Spatial();
    });

    it("should return a viewing direction in the x-axis direction", () => {
        let rotation: number[] = [0, -Math.PI / 2, 0];

        let viewingDirection: THREE.Vector3 = spatial.viewingDirection(rotation);

        // counter-clockwise rotation about the y-axis pointing towards the observer
        expect(viewingDirection.x).toBeCloseTo(1, epsilon);
        expect(viewingDirection.y).toBeCloseTo(0, epsilon);
        expect(viewingDirection.z).toBeCloseTo(0, epsilon);
    });
});
