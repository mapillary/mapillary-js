import { Transform } from "../../../src/geo/Transform";

import { MockCreator } from "../../helper/MockCreator";
import { PolygonGeometry } from "../../../src/component/tag/geometry/PolygonGeometry";
import { TransformHelper } from "../../helper/TransformHelper";

const transformHelper = new TransformHelper();

describe("PolygonGeometry.ctor", () => {
    it("should be defined", () => {
        let polygonGeometry =
            new PolygonGeometry([[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]);

        expect(polygonGeometry).toBeDefined();
    });

    it("polygon should be set", () => {
        let original = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];

        let polygonGeometry = new PolygonGeometry(original);

        for (let i: number = 0; i < original.length; i++) {
            expect(polygonGeometry.polygon[i][0]).toBe(original[i][0]);
            expect(polygonGeometry.polygon[i][1]).toBe(original[i][1]);
        }
    });

    it("should throw if polygon has less than three positions", () => {
        expect(() => { return new PolygonGeometry([[0, 0], [0, 0]]); })
            .toThrowError(Error);
    });

    it("should throw if first and last positions are not equivalent", () => {
        expect(() => { return new PolygonGeometry([[0, 0], [1, 0], [1, 1], [0, 1]]); })
            .toThrowError(Error);
    });

    it("should throw if basic coord is below supported range", () => {
        expect(() => { return new PolygonGeometry([[-0.5, 0], [1, 0], [1, 1], [-0.5, 0]]); })
            .toThrowError(Error);

        expect(() => { return new PolygonGeometry([[0, -0.5], [1, 0], [1, 1], [0, -0.5]]); })
            .toThrowError(Error);
    });

    it("should throw if basic coord is above supported range", () => {
        expect(() => { return new PolygonGeometry([[1.5, 0], [1, 0], [1, 1], [1.5, 0]]); })
            .toThrowError(Error);

        expect(() => { return new PolygonGeometry([[0, 1.5], [1, 0], [1, 1], [0, 1.5]]); })
            .toThrowError(Error);
    });

    it("holes should be set", () => {
        let polygon = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
        let original = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];

        let polygonGeometry = new PolygonGeometry(polygon, [original]);

        expect(polygonGeometry.holes.length).toBe(1);

        for (let i: number = 0; i < original.length; i++) {
            expect(polygonGeometry.holes[0][i][0]).toBe(original[i][0]);
            expect(polygonGeometry.holes[0][i][1]).toBe(original[i][1]);
        }
    });

    it("should throw if hole has less than three positions", () => {
        expect(() => { return new PolygonGeometry([[0, 0], [0, 0], [0, 0]], [[[0, 0], [0, 0]]]); })
            .toThrowError(Error);
    });

    it("should throw if first and last positions are not equivalent", () => {
        expect(() => { return new PolygonGeometry([[0, 0], [1, 0], [0, 0]], [[[0, 0], [1, 0], [1, 1]]]); })
            .toThrowError(Error);
    });

    it("should throw if basic coord is below supported range for hole", () => {
        expect(() => { return new PolygonGeometry([[0, 0], [1, 0], [0, 0]], [[[-0.5, 0], [1, 0], [1, 1], [-0.5, 0]]]); })
            .toThrowError(Error);

        expect(() => { return new PolygonGeometry([[0, 0], [1, 0], [0, 0]], [[[0, -0.5], [1, 0], [1, 1], [0, -0.5]]]); })
            .toThrowError(Error);
    });

    it("should throw if basic coord is above supported range for hole", () => {
        expect(() => { return new PolygonGeometry([[0, 0], [1, 0], [0, 0]], [[[1.5, 0], [1, 0], [1, 1], [1.5, 0]]]); })
            .toThrowError(Error);

        expect(() => { return new PolygonGeometry([[0, 0], [1, 0], [0, 0]], [[[0, 1.5], [1, 0], [1, 1], [0, 1.5]]]); })
            .toThrowError(Error);
    });
});

describe("PolygonGeometry.getVertex2d", () => {
    it("should return the polygon vertices", () => {
        const polygon = [[0.2, 0.3], [0.4, 0.5], [0.1, 0.7], [0.2, 0.3]];
        const geometry = new PolygonGeometry(polygon);

        expect(geometry.getVertex2d(0)).toEqual([0.2, 0.3]);
        expect(geometry.getVertex2d(1)).toEqual([0.4, 0.5]);
        expect(geometry.getVertex2d(2)).toEqual([0.1, 0.7]);
        expect(geometry.getVertex2d(3)).toEqual([0.2, 0.3]);
    });
});

describe("RectGeometry.getCentroid2d", () => {
    let precision: number = 1e-8;

    it("should return the centroid", () => {
        const polygon = [[0.1, 0.2], [0.3, 0.2], [0.3, 0.5], [0.1, 0.5], [0.1, 0.2]];
        const geometry = new PolygonGeometry(polygon);

        const result = geometry.getCentroid2d();

        expect(result[0]).toBeCloseTo(0.2, precision);
        expect(result[1]).toBeCloseTo(0.35, precision);
    });
});

describe("RectGeometry.getCentroid2d", () => {
    it("should return the centroid", () => {
        const polygon = [[0.1, 0.2], [0.3, 0.2], [0.3, 0.5], [0.1, 0.5], [0.1, 0.2]];
        const geometry = new PolygonGeometry(polygon);

        const result = geometry.getVertices2d();

        expect(result).not.toBe(geometry.polygon);
        expect(result).not.toBe(polygon);

        expect(result.length).toBe(5);
        expect(result[0]).toEqual(polygon[0]);
        expect(result[1]).toEqual(polygon[1]);
        expect(result[2]).toEqual(polygon[2]);
        expect(result[3]).toEqual(polygon[3]);
        expect(result[4]).toEqual(polygon[4]);
    });
});

describe("PolygonGeometry.addVertex2d", () => {
    it("should add a vertex before closing vertex", () => {
        let original = [[0, 0], [0, 0], [0, 0]];

        let polygonGeometry = new PolygonGeometry(original);
        polygonGeometry.addVertex2d([1, 1]);

        let polygon = polygonGeometry.polygon;

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
        let original = [[0, 0], [0, 0], [0, 0]];

        let polygonGeometry = new PolygonGeometry(original);
        polygonGeometry.addVertex2d([2, 2]);

        let polygon = polygonGeometry.polygon;

        expect(polygon[2][0]).toBe(1);
        expect(polygon[2][1]).toBe(1);
    });

    it("should clamp negative added vertex to valid basic coordinates", () => {
        let original = [[0, 0], [0, 0], [0, 0]];

        let polygonGeometry = new PolygonGeometry(original);
        polygonGeometry.addVertex2d([-1, -1]);

        let polygon = polygonGeometry.polygon;

        expect(polygon[2][0]).toBe(0);
        expect(polygon[2][1]).toBe(0);
    });
});

describe("PolygonGeometry.removeVertex2d", () => {
    it("should throw if index is negative", () => {
        let original = [[0, 0], [0, 0], [0, 0], [0, 0]];

        let polygonGeometry = new PolygonGeometry(original);

        expect(() => { polygonGeometry.removeVertex2d(-1); })
            .toThrowError(Error);
    });

    it("should throw if index is larger than last index of array", () => {
        let original = [[0, 0], [0, 0], [0, 0], [0, 0]];

        let polygonGeometry = new PolygonGeometry(original);

        expect(() => { polygonGeometry.removeVertex2d(4); })
            .toThrowError(Error);
    });

    it("should throw if polygon has too few vertices", () => {
        let original = [[0, 0], [1, 1], [0, 0]];

        let polygonGeometry = new PolygonGeometry(original);

        expect(() => { polygonGeometry.removeVertex2d(1); })
            .toThrowError(Error);
    });

    it("should remove second vertex", () => {
        let original = [[0, 0], [1, 1], [1, 0], [0, 0]];

        let polygonGeometry = new PolygonGeometry(original);
        polygonGeometry.removeVertex2d(2);

        let polygon = polygonGeometry.polygon;

        expect(polygon.length).toBe(3);

        expect(polygon[0][0]).toBe(0);
        expect(polygon[0][1]).toBe(0);

        expect(polygon[1][0]).toBe(1);
        expect(polygon[1][1]).toBe(1);

        expect(polygon[2][0]).toBe(0);
        expect(polygon[2][1]).toBe(0);
    });

    it("should remove first vertex and set second as closing vertex", () => {
        let original = [[0, 0], [1, 1], [0.5, 0.5], [0, 0]];

        let polygonGeometry = new PolygonGeometry(original);
        polygonGeometry.removeVertex2d(0);

        let polygon = polygonGeometry.polygon;

        expect(polygon.length).toBe(3);

        expect(polygon[0][0]).toBe(1);
        expect(polygon[0][1]).toBe(1);

        expect(polygon[1][0]).toBe(0.5);
        expect(polygon[1][1]).toBe(0.5);

        expect(polygon[2][0]).toBe(1);
        expect(polygon[2][1]).toBe(1);
    });

    it("should remove last vertex and set second as closing vertex", () => {
        let original = [[0, 0], [1, 1], [0.5, 0.5], [0, 0]];

        let polygonGeometry = new PolygonGeometry(original);
        polygonGeometry.removeVertex2d(3);

        let polygon = polygonGeometry.polygon;

        expect(polygon.length).toBe(3);

        expect(polygon[0][0]).toBe(1);
        expect(polygon[0][1]).toBe(1);

        expect(polygon[1][0]).toBe(0.5);
        expect(polygon[1][1]).toBe(0.5);

        expect(polygon[2][0]).toBe(1);
        expect(polygon[2][1]).toBe(1);
    });
});

describe("RectGeometry.setVertex2d", () => {
    it("should set the vertex with index 2", () => {
        let original = [[0, 0], [1, 1], [1, 1], [0, 0]];

        let polygonGeometry = new PolygonGeometry(original);

        let vertex = [0.5, 0.6];
        let transform = transformHelper.createTransform();

        polygonGeometry.setVertex2d(2, vertex, transform);

        let polygon = polygonGeometry.polygon;

        expect(polygon[2][0]).toBe(vertex[0]);
        expect(polygon[2][1]).toBe(vertex[1]);
    });

    it("should clamp the set vertex", () => {
        let original = [[0, 0], [1, 1], [1, 1], [0, 0]];

        let polygonGeometry = new PolygonGeometry(original);

        let vertex = [2, -1];
        let transform = transformHelper.createTransform();

        polygonGeometry.setVertex2d(2, vertex, transform);

        let polygon = polygonGeometry.polygon;

        expect(polygon[2][0]).toBe(1);
        expect(polygon[2][1]).toBe(0);
    });

    it("should set both the first and last vertex when setting index 0", () => {
        let original = [[0, 0], [1, 1], [1, 1], [0, 0]];

        let polygonGeometry = new PolygonGeometry(original);

        let vertex = [0.5, 0.6];
        let transform = transformHelper.createTransform();

        polygonGeometry.setVertex2d(0, vertex, transform);

        let polygon = polygonGeometry.polygon;

        expect(polygon[0][0]).toBe(vertex[0]);
        expect(polygon[0][1]).toBe(vertex[1]);

        expect(polygon[3][0]).toBe(vertex[0]);
        expect(polygon[3][1]).toBe(vertex[1]);
    });

    it("should set both the first and last vertex when setting last", () => {
        let original = [[0, 0], [1, 1], [1, 1], [0, 0]];

        let polygonGeometry = new PolygonGeometry(original);

        let vertex = [0.5, 0.6];
        let transform = transformHelper.createTransform();

        polygonGeometry.setVertex2d(3, vertex, transform);

        let polygon = polygonGeometry.polygon;

        expect(polygon[0][0]).toBe(vertex[0]);
        expect(polygon[0][1]).toBe(vertex[1]);

        expect(polygon[3][0]).toBe(vertex[0]);
        expect(polygon[3][1]).toBe(vertex[1]);
    });
});

describe("RectGeometry.setCentroid2d", () => {
    let precision: number = 1e-8;

    it("should set the vertices according to the new centroid", () => {
        let original = [[0.2, 0.2], [0.6, 0.2], [0.6, 0.4], [0.2, 0.4], [0.2, 0.2]];

        let polygonGeometry = new PolygonGeometry(original);

        let vertex = [0.5, 0.6];
        let transform = transformHelper.createTransform();

        polygonGeometry.setCentroid2d(vertex, transform);

        let polygon = polygonGeometry.polygon;

        expect(polygon[0][0]).toBeCloseTo(0.3, precision);
        expect(polygon[0][1]).toBeCloseTo(0.5, precision);

        expect(polygon[1][0]).toBeCloseTo(0.7, precision);
        expect(polygon[1][1]).toBeCloseTo(0.5, precision);

        expect(polygon[2][0]).toBeCloseTo(0.7, precision);
        expect(polygon[2][1]).toBeCloseTo(0.7, precision);

        expect(polygon[3][0]).toBeCloseTo(0.3, precision);
        expect(polygon[3][1]).toBeCloseTo(0.7, precision);

        expect(polygon[4][0]).toBeCloseTo(0.3, precision);
        expect(polygon[4][1]).toBeCloseTo(0.5, precision);
    });

    it("should limit centroid translation to keep vertices within basic coordinates", () => {
        let original = [[0.2, 0.2], [0.6, 0.2], [0.6, 0.4], [0.2, 0.4], [0.2, 0.2]];

        let polygonGeometry = new PolygonGeometry(original);

        let vertex = [0.0, 0.0];
        let transform = transformHelper.createTransform();

        polygonGeometry.setCentroid2d(vertex, transform);

        let polygon = polygonGeometry.polygon;

        expect(polygon[0][0]).toBeCloseTo(0.0, precision);
        expect(polygon[0][1]).toBeCloseTo(0.0, precision);

        expect(polygon[1][0]).toBeCloseTo(0.4, precision);
        expect(polygon[1][1]).toBeCloseTo(0.0, precision);

        expect(polygon[2][0]).toBeCloseTo(0.4, precision);
        expect(polygon[2][1]).toBeCloseTo(0.2, precision);

        expect(polygon[3][0]).toBeCloseTo(0.0, precision);
        expect(polygon[3][1]).toBeCloseTo(0.2, precision);

        expect(polygon[4][0]).toBeCloseTo(0.0, precision);
        expect(polygon[4][1]).toBeCloseTo(0.0, precision);
    });
});

describe("PolygonGeometry.getVertex3d", () => {
    it("should unproject and return the 3D vertex", () => {
        const polygon = [[0, 0], [0.1, 0], [0.1, 0], [0, 0]];
        const geometry = new PolygonGeometry(polygon);

        const transform = new MockCreator().create(Transform, "Transform");
        const unprojectSpy: jasmine.Spy = <jasmine.Spy>transform.unprojectBasic;
        unprojectSpy.and.returnValue([1, 2, 3]);

        expect(geometry.getVertex3d(1, transform)).toEqual([1, 2, 3]);

        expect(unprojectSpy.calls.count()).toBe(1);
        expect(unprojectSpy.calls.first().args[0]).toEqual([0.1, 0]);
    });
});

describe("PolygonGeometry.getVertices3d", () => {
    it("should unproject all vertices", () => {
        const polygon = [[0, 0], [0.1, 0], [0.1, 0.1], [0, 0.1], [0, 0]];
        const geometry = new PolygonGeometry(polygon);

        const transform = new MockCreator().create(Transform, "Transform");
        const unprojectSpy: jasmine.Spy = <jasmine.Spy>transform.unprojectBasic;
        unprojectSpy.and.returnValue([1, 2, 3]);

        expect(geometry.getVertices3d(transform).length).toBe(5);

        expect(unprojectSpy.calls.count()).toBe(5);
    });
});

describe("PolygonGeometry.getPoints3d", () => {
    it("should subsample", () => {
        const polygon = [[0, 0], [0.1, 0], [0.1, 0.1], [0, 0]];
        const geometry = new PolygonGeometry(polygon);

        const transform = new MockCreator().create(Transform, "Transform");
        const unprojectSpy: jasmine.Spy = <jasmine.Spy>transform.unprojectBasic;
        unprojectSpy.and.returnValue([1, 2, 3]);

        expect(geometry.getPoints3d(transform).length).toBeGreaterThan(4);

        expect(unprojectSpy.calls.count()).toBeGreaterThan(4);
    });
});

describe("PolygonGeometry.getHoleVertices3d", () => {
    it("should unproject all vertices", () => {
        const polygon = [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0]];
        const hole = [[0.2, 0.2], [0.3, 0.2], [0.3, 0.3], [0.2, 0.2]];
        const geometry = new PolygonGeometry(polygon, [hole]);

        const transform = new MockCreator().create(Transform, "Transform");
        const unprojectSpy: jasmine.Spy = <jasmine.Spy>transform.unprojectBasic;
        unprojectSpy.and.returnValue([1, 2, 3]);

        const holeVertices3d: number[][][] = geometry.getHoleVertices3d(transform);

        expect(holeVertices3d.length).toBe(1);
        expect(holeVertices3d[0].length).toBe(4);

        expect(unprojectSpy.calls.count()).toBe(4);
    });
});

describe("PolygonGeometry.getHolePoints3d", () => {
    it("should subsample", () => {
        const polygon = [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0]];
        const hole = [[0.2, 0.2], [0.3, 0.2], [0.3, 0.3], [0.2, 0.2]];
        const geometry = new PolygonGeometry(polygon, [hole]);

        const transform = new MockCreator().create(Transform, "Transform");
        const unprojectSpy: jasmine.Spy = <jasmine.Spy>transform.unprojectBasic;
        unprojectSpy.and.returnValue([1, 2, 3]);

        const holeVertices3d: number[][][] = geometry.getHolePoints3d(transform);

        expect(holeVertices3d.length).toBe(1);
        expect(holeVertices3d[0].length).toBeGreaterThan(4);

        expect(unprojectSpy.calls.count()).toBeGreaterThan(4);
    });
});

describe("PolygonGeometry.get3dDomainTriangles", () => {
    it("should return one triangle for three points", () => {
        const polygon = [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0]];
        const geometry = new PolygonGeometry(polygon);

        const transform = new Transform(
            1, 1, 1, 0.5, [0, 0, 0], [0, 0, 0],
            undefined, undefined, [1, 0, 0]);

        const triangles = geometry.get3dDomainTriangles3d(transform);

        expect(triangles.length / 3).toBe(3);
    });
});

describe("PolygonGeometry.getTriangles", () => {
    it("should return one triangle for three close points", () => {
        const polygon = [[0, 0], [1e-4, 0], [1e-4, 1e-4], [0, 0]];
        const geometry = new PolygonGeometry(polygon);

        const transform = new Transform(
            1, 1, 1, 0.5, [0, 0, 0], [0, 0, 0],
            undefined, undefined, [1, 0, 0]);

        const triangles = geometry.getTriangles3d(transform);

        expect(triangles.length / (3 * 3)).toBe(1);
    });

    it("should return multiple triangles becasue of interpolation for three points", () => {
        const polygon = [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0]];
        const geometry = new PolygonGeometry(polygon);

        const transform = new Transform(
            1, 1, 1, 0.5, [0, 0, 0], [0, 0, 0],
            undefined, undefined, [1, 0, 0]);

        const triangles = geometry.getTriangles3d(transform);

        expect(triangles.length / (3 * 3)).toBeGreaterThan(1);
    });

    it("should return two triangles for four close points for a spherical", () => {
        const polygon = [[0, 0], [1e-4, 0], [1e-4, 1e-4], [0, 1e-4], [0, 0]];
        const geometry = new PolygonGeometry(polygon);
        const transform = new Transform(
            1, 1, 1, 0.5, [0, 0, 0], [0, 0, 0],
            undefined, undefined, [1, 0, 0]);

        const triangles = geometry.getTriangles3d(transform);

        expect(triangles.length / (3 * 3)).toBe(2);
    });
});
