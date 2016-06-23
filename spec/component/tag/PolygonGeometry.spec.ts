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

    it("should throw if polygon has less then three positions", () => {
        expect(() => { new PolygonGeometry([[0, 0], [0, 0]]); })
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

describe("PolygonGeometry.addVertex2d", () => {
    it("should add a vertex before closing vertex", () => {
        let original: number[][] = [[0, 0], [0, 0], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);
        polygonGeometry.addVertex2d([1, 1]);

        let polygon: number[][] = polygonGeometry.polygon;

        expect(polygon.length).toBe(4);

        expect(polygon[0][0]).toBe(0);
        expect(polygon[0][1]).toBe(0);

        expect(polygon[1][0]).toBe(0);
        expect(polygon[1][1]).toBe(0);

        expect(polygon[2][0]).toBe(1);
        expect(polygon[2][1]).toBe(1);

        expect(polygon[3][0]).toBe(0);
        expect(polygon[3][1]).toBe(0);
    });

    it("should clamp added vertex to valid basic coordinates", () => {
        let original: number[][] = [[0, 0], [0, 0], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);
        polygonGeometry.addVertex2d([2, 2]);

        let polygon: number[][] = polygonGeometry.polygon;

        expect(polygon[2][0]).toBe(1);
        expect(polygon[2][1]).toBe(1);
    });

    it("should clamp negative added vertex to valid basic coordinates", () => {
        let original: number[][] = [[0, 0], [0, 0], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);
        polygonGeometry.addVertex2d([-1, -1]);

        let polygon: number[][] = polygonGeometry.polygon;

        expect(polygon[2][0]).toBe(0);
        expect(polygon[2][1]).toBe(0);
    });
});

describe("PolygonGeometry.removeVertex2d", () => {
    it("should throw if index is negative", () => {
        let original: number[][] = [[0, 0], [0, 0], [0, 0], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);

        expect(() => { polygonGeometry.removeVertex2d(-1); })
            .toThrowError(GeometryTagError);
    });

    it("should throw if index is larger than last index of array", () => {
        let original: number[][] = [[0, 0], [0, 0], [0, 0], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);

        expect(() => { polygonGeometry.removeVertex2d(4); })
            .toThrowError(GeometryTagError);
    });

    it("should throw if polygon has too few vertices", () => {
        let original: number[][] = [[0, 0], [1, 1], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);

        expect(() => { polygonGeometry.removeVertex2d(1); })
            .toThrowError(GeometryTagError);
    });

    it("should remove second vertex", () => {
        let original: number[][] = [[0, 0], [1, 1], [1, 0], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);
        polygonGeometry.removeVertex2d(2);

        let polygon: number[][] = polygonGeometry.polygon;

        expect(polygon.length).toBe(3);

        expect(polygon[0][0]).toBe(0);
        expect(polygon[0][1]).toBe(0);

        expect(polygon[1][0]).toBe(1);
        expect(polygon[1][1]).toBe(1);

        expect(polygon[2][0]).toBe(0);
        expect(polygon[2][1]).toBe(0);
    });

    it("should remove first vertex and set second as closing vertex", () => {
        let original: number[][] = [[0, 0], [1, 1], [0.5, 0.5], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);
        polygonGeometry.removeVertex2d(0);

        let polygon: number[][] = polygonGeometry.polygon;

        expect(polygon.length).toBe(3);

        expect(polygon[0][0]).toBe(1);
        expect(polygon[0][1]).toBe(1);

        expect(polygon[1][0]).toBe(0.5);
        expect(polygon[1][1]).toBe(0.5);

        expect(polygon[2][0]).toBe(1);
        expect(polygon[2][1]).toBe(1);
    });

    it("should remove last vertex and set second as closing vertex", () => {
        let original: number[][] = [[0, 0], [1, 1], [0.5, 0.5], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);
        polygonGeometry.removeVertex2d(3);

        let polygon: number[][] = polygonGeometry.polygon;

        expect(polygon.length).toBe(3);

        expect(polygon[0][0]).toBe(1);
        expect(polygon[0][1]).toBe(1);

        expect(polygon[1][0]).toBe(0.5);
        expect(polygon[1][1]).toBe(0.5);

        expect(polygon[2][0]).toBe(1);
        expect(polygon[2][1]).toBe(1);
    });
});