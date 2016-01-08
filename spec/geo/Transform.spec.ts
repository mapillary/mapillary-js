/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />

import * as THREE from "three";

import {Transform} from "../../src/Geo";
import {Node} from "../../src/Graph";

describe("Transform.rt", () => {
    let epsilon: number = 10e-9;

    it("should have a unit Rt matrix", () => {
        let r: number[] = [0, 0, 0];
        let t: number[] = [0, 0, 0];

        let node: Node = new Node("", 0, null, true, null, { key: "", rotation: r }, t);

        let transform: Transform = new Transform(node);
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

        let node: Node = new Node("key", 0, null, true, null, { key: "key", rotation: r }, t);

        let transform: Transform = new Transform(node);
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

        let node: Node = new Node("key", 0, null, true, null, { key: "key", rotation: r }, t);

        let transform: Transform = new Transform(node);
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

        let node: Node = new Node("key", 0, null, true, null, { key: "key", rotation: r }, t);

        let transform: Transform = new Transform(node);
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

        let node: Node = new Node("", 0, null, true, null, { key: "", rotation: r, atomic_scale: 1 }, t);

        let transform: Transform = new Transform(node);
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

        let node: Node = new Node("", 0, null, true, null, { key: "", rotation: r, atomic_scale: 3 }, t);

        let transform: Transform = new Transform(node);
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

        let node: Node = new Node("", 0, null, true, null, { key: "", rotation: r, atomic_scale: 0.5 }, t);

        let transform: Transform = new Transform(node);
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