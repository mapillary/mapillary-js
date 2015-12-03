/// <reference path="../../typings/jasmine/jasmine.d.ts" />

import {Spatial} from "../../src/Geo";

describe("Spatial.rotationMatrix", () => {
    let spatial: Spatial;
    let epsilon: number = 10e-9;

    beforeEach(() => {
        spatial = new Spatial()
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
