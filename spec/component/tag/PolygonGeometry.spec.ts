/// <reference path="../../../typings/index.d.ts" />

import {IGPano} from "../../../src/API";
import {PolygonGeometry, GeometryTagError} from "../../../src/Component";
import {Transform} from "../../../src/Geo";
import {Node} from "../../../src/Graph";

describe("PolygonGeometry.ctor", () => {
    it("should be defined", () => {
        let polygonGeometry: PolygonGeometry =
            new PolygonGeometry([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]);

        expect(polygonGeometry).toBeDefined();
    });

    it("polygon should be set", () => {
        let original: number[][] = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);

        for (let i: number = 0; i < original.length; i++) {
            expect(polygonGeometry.polygon[i][0]).toBe(original[i][0]);
            expect(polygonGeometry.polygon[i][1]).toBe(original[i][1]);
        }
    });

    it("should throw if polygon has less then four positions", () => {
        expect(() => { new PolygonGeometry([[0, 0], [1, 0], [0, 0]]); })
            .toThrowError(GeometryTagError);
    });

    it("should throw if first and last positions are not equivalent", () => {
        expect(() => { new PolygonGeometry([[0, 0], [1, 0], [1, 1], [0, 1]]); })
            .toThrowError(GeometryTagError);
    });


    it("should throw if basic coord is below supported range", () => {
        expect(() => { new PolygonGeometry([[-0.5, 0], [1, 0], [1, 1], [-0.5, 0]]); })
            .toThrowError(GeometryTagError);

        expect(() => { new PolygonGeometry([[0, -0.5], [1, 0], [1, 1], [0, -0.5]]); })
            .toThrowError(GeometryTagError);
    });

    it("should throw if basic coord is above supported range", () => {
        expect(() => { new PolygonGeometry([[1.5, 0], [1, 0], [1, 1], [1.5, 0]]); })
            .toThrowError(GeometryTagError);

        expect(() => { new PolygonGeometry([[0, 1.5], [1, 0], [1, 1], [0, 1.5]]); })
            .toThrowError(GeometryTagError);
   });
});