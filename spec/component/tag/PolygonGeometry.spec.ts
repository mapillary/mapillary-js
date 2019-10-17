import {IGPano} from "../../../src/API";
import {PolygonGeometry} from "../../../src/Component";
import {Transform} from "../../../src/Geo";
import {Node} from "../../../src/Graph";

import {MockCreator} from "../../helper/MockCreator.spec";

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
        let polygon: number[][] = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
        let original: number[][] = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(polygon, [original]);

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
        const polygon: number[][] = [[0.2, 0.3], [0.4, 0.5], [0.1, 0.7], [0.2, 0.3]];
        const geometry: PolygonGeometry = new PolygonGeometry(polygon);

        expect(geometry.getVertex2d(0)).toEqual([0.2, 0.3]);
        expect(geometry.getVertex2d(1)).toEqual([0.4, 0.5]);
        expect(geometry.getVertex2d(2)).toEqual([0.1, 0.7]);
        expect(geometry.getVertex2d(3)).toEqual([0.2, 0.3]);
    });
});

describe("RectGeometry.getCentroid2d", () => {
    let precision: number = 1e-8;

    it("should return the centroid", () => {
        const polygon: number[][] = [[0.1, 0.2], [0.3, 0.2], [0.3, 0.5], [0.1, 0.5], [0.1, 0.2]];
        const geometry: PolygonGeometry = new PolygonGeometry(polygon);

        const result: number[] = geometry.getCentroid2d();

        expect(result[0]).toBeCloseTo(0.2, precision);
        expect(result[1]).toBeCloseTo(0.35, precision);
    });
});

describe("RectGeometry.getCentroid2d", () => {
    it("should return the centroid", () => {
        const polygon: number[][] = [[0.1, 0.2], [0.3, 0.2], [0.3, 0.5], [0.1, 0.5], [0.1, 0.2]];
        const geometry: PolygonGeometry = new PolygonGeometry(polygon);

        const result: number[][] = geometry.getVertices2d();

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
            .toThrowError(Error);
    });

    it("should throw if index is larger than last index of array", () => {
        let original: number[][] = [[0, 0], [0, 0], [0, 0], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);

        expect(() => { polygonGeometry.removeVertex2d(4); })
            .toThrowError(Error);
    });

    it("should throw if polygon has too few vertices", () => {
        let original: number[][] = [[0, 0], [1, 1], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);

        expect(() => { polygonGeometry.removeVertex2d(1); })
            .toThrowError(Error);
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

describe("RectGeometry.setVertex2d", () => {
    let createNode: (gpano: IGPano) => Node = (gpano: IGPano): Node => {
        let node: Node = new Node({
            cl: { lat: 0, lon: 0},
            key: "key",
            l: { lat: 0, lon: 0 },
            sequence_key: "skey",
        });

        node.makeFull({
            atomic_scale: 0,
            c_rotation: [0, 0, 0],
            ca: 0,
            calt: 0,
            captured_at: 0,
            cca: 0,
            cfocal: 0,
            cluster_key: "ckey",
            gpano: gpano,
            height: 0,
            merge_cc: 0,
            merge_version: 0,
            orientation: 0,
            private: false,
            user: { key: "key", username: "username"},
            width: 0,
        });

        return node;
    };

    let createTransform: (pano: boolean) => Transform = (pano: boolean): Transform => {
        let gpano: IGPano = pano ?
            {
                CroppedAreaImageHeightPixels: 1,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0,
                FullPanoHeightPixels: 1,
                FullPanoWidthPixels: 1,
            } :
            null;

        let node: Node = createNode(gpano);

        return new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            [0, 0, 0],
            null);
    };

    it("should set the vertex with index 2", () => {
        let original: number[][] = [[0, 0], [1, 1], [1, 1], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);

        let vertex: number[] = [0.5, 0.6];
        let transform: Transform = createTransform(false);

        polygonGeometry.setVertex2d(2, vertex, transform);

        let polygon: number[][] = polygonGeometry.polygon;

        expect(polygon[2][0]).toBe(vertex[0]);
        expect(polygon[2][1]).toBe(vertex[1]);
    });

    it("should clamp the set vertex", () => {
        let original: number[][] = [[0, 0], [1, 1], [1, 1], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);

        let vertex: number[] = [2, -1];
        let transform: Transform = createTransform(false);

        polygonGeometry.setVertex2d(2, vertex, transform);

        let polygon: number[][] = polygonGeometry.polygon;

        expect(polygon[2][0]).toBe(1);
        expect(polygon[2][1]).toBe(0);
    });

    it("should set both the first and last vertex when setting index 0", () => {
        let original: number[][] = [[0, 0], [1, 1], [1, 1], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);

        let vertex: number[] = [0.5, 0.6];
        let transform: Transform = createTransform(false);

        polygonGeometry.setVertex2d(0, vertex, transform);

        let polygon: number[][] = polygonGeometry.polygon;

        expect(polygon[0][0]).toBe(vertex[0]);
        expect(polygon[0][1]).toBe(vertex[1]);

        expect(polygon[3][0]).toBe(vertex[0]);
        expect(polygon[3][1]).toBe(vertex[1]);
    });

    it("should set both the first and last vertex when setting last", () => {
        let original: number[][] = [[0, 0], [1, 1], [1, 1], [0, 0]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);

        let vertex: number[] = [0.5, 0.6];
        let transform: Transform = createTransform(false);

        polygonGeometry.setVertex2d(3, vertex, transform);

        let polygon: number[][] = polygonGeometry.polygon;

        expect(polygon[0][0]).toBe(vertex[0]);
        expect(polygon[0][1]).toBe(vertex[1]);

        expect(polygon[3][0]).toBe(vertex[0]);
        expect(polygon[3][1]).toBe(vertex[1]);
    });
});

describe("RectGeometry.setCentroid2d", () => {
    let precision: number = 1e-8;

    let createNode: (gpano: IGPano) => Node = (gpano: IGPano): Node => {
        let node: Node = new Node({
            cl: { lat: 0, lon: 0},
            key: "key",
            l: { lat: 0, lon: 0 },
            sequence_key: "skey",
        });

        node.makeFull({
            atomic_scale: 0,
            c_rotation: [0, 0, 0],
            ca: 0,
            calt: 0,
            captured_at: 0,
            cca: 0,
            cfocal: 0,
            cluster_key: "ckey",
            gpano: gpano,
            height: 0,
            merge_cc: 0,
            merge_version: 0,
            orientation: 0,
            private: false,
            user: { key: "key", username: "username"},
            width: 0,
        });

        return node;
    };

    let createTransform: (pano: boolean) => Transform = (pano: boolean): Transform => {
        let gpano: IGPano = pano ?
            {
                CroppedAreaImageHeightPixels: 1,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0,
                FullPanoHeightPixels: 1,
                FullPanoWidthPixels: 1,
            } :
            null;

        let node: Node = createNode(gpano);

        return new Transform(
            node.orientation,
            node.width,
            node.height,
            node.focal,
            node.scale,
            node.gpano,
            node.rotation,
            [0, 0, 0],
            null);
    };

    it("should set the vertices according to the new centroid", () => {
        let original: number[][] = [[0.2, 0.2], [0.6, 0.2], [0.6, 0.4], [0.2, 0.4], [0.2, 0.2]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);

        let vertex: number[] = [0.5, 0.6];
        let transform: Transform = createTransform(false);

        polygonGeometry.setCentroid2d(vertex, transform);

        let polygon: number[][] = polygonGeometry.polygon;

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
        let original: number[][] = [[0.2, 0.2], [0.6, 0.2], [0.6, 0.4], [0.2, 0.4], [0.2, 0.2]];

        let polygonGeometry: PolygonGeometry = new PolygonGeometry(original);

        let vertex: number[] = [0.0, 0.0];
        let transform: Transform = createTransform(false);

        polygonGeometry.setCentroid2d(vertex, transform);

        let polygon: number[][] = polygonGeometry.polygon;

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
        const polygon: number[][] = [[0, 0], [0.1, 0], [0.1, 0], [0, 0]];
        const geometry: PolygonGeometry = new PolygonGeometry(polygon);

        const transform: Transform = new MockCreator().create(Transform, "Transform");
        const unprojectSpy: jasmine.Spy = <jasmine.Spy>transform.unprojectBasic;
        unprojectSpy.and.returnValue([1, 2, 3]);

        expect(geometry.getVertex3d(1, transform)).toEqual([1, 2, 3]);

        expect(unprojectSpy.calls.count()).toBe(1);
        expect(unprojectSpy.calls.first().args[0]).toEqual([0.1, 0]);
    });
});

describe("PolygonGeometry.getVertices3d", () => {
    it("should unproject all vertices", () => {
        const polygon: number[][] = [[0, 0], [0.1, 0], [0.1, 0.1], [0, 0.1], [0, 0]];
        const geometry: PolygonGeometry = new PolygonGeometry(polygon);

        const transform: Transform = new MockCreator().create(Transform, "Transform");
        const unprojectSpy: jasmine.Spy = <jasmine.Spy>transform.unprojectBasic;
        unprojectSpy.and.returnValue([1, 2, 3]);

        expect(geometry.getVertices3d(transform).length).toBe(5);

        expect(unprojectSpy.calls.count()).toBe(5);
    });
});

describe("PolygonGeometry.getPoints3d", () => {
    it("should subsample", () => {
        const polygon: number[][] = [[0, 0], [0.1, 0], [0.1, 0.1], [0, 0]];
        const geometry: PolygonGeometry = new PolygonGeometry(polygon);

        const transform: Transform = new MockCreator().create(Transform, "Transform");
        const unprojectSpy: jasmine.Spy = <jasmine.Spy>transform.unprojectBasic;
        unprojectSpy.and.returnValue([1, 2, 3]);

        expect(geometry.getPoints3d(transform).length).toBeGreaterThan(4);

        expect(unprojectSpy.calls.count()).toBeGreaterThan(4);
    });
});

describe("PolygonGeometry.getHoleVertices3d", () => {
    it("should unproject all vertices", () => {
        const polygon: number[][] = [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0]];
        const hole: number[][] = [[0.2, 0.2], [0.3, 0.2], [0.3, 0.3], [0.2, 0.2]];
        const geometry: PolygonGeometry = new PolygonGeometry(polygon, [hole]);

        const transform: Transform = new MockCreator().create(Transform, "Transform");
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
        const polygon: number[][] = [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0]];
        const hole: number[][] = [[0.2, 0.2], [0.3, 0.2], [0.3, 0.3], [0.2, 0.2]];
        const geometry: PolygonGeometry = new PolygonGeometry(polygon, [hole]);

        const transform: Transform = new MockCreator().create(Transform, "Transform");
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
        const polygon: number[][] = [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0]];
        const geometry: PolygonGeometry = new PolygonGeometry(polygon);

        const transform: Transform = new Transform(1, 1, 1, 0.5, 1, undefined, [0, 0, 0], [0, 0, 0], undefined);

        const triangles: number[] = geometry.get3dDomainTriangles3d(transform);

        expect(triangles.length / 3).toBe(3);
    });
});

describe("PolygonGeometry.getTriangles", () => {
    it("should return one triangle for three close points", () => {
        const polygon: number[][] = [[0, 0], [1e-4, 0], [1e-4, 1e-4], [0, 0]];
        const geometry: PolygonGeometry = new PolygonGeometry(polygon);

        const transform: Transform = new Transform(1, 1, 1, 0.5, 1, undefined, [0, 0, 0], [0, 0, 0], undefined);

        const triangles: number[] = geometry.getTriangles3d(transform);

        expect(triangles.length / (3 * 3)).toBe(1);
    });

    it("should return multiple triangles becasue of interpolation for three points", () => {
        const polygon: number[][] = [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0]];
        const geometry: PolygonGeometry = new PolygonGeometry(polygon);

        const transform: Transform = new Transform(1, 1, 1, 0.5, 1, undefined, [0, 0, 0], [0, 0, 0], undefined);

        const triangles: number[] = geometry.getTriangles3d(transform);

        expect(triangles.length / (3 * 3)).toBeGreaterThan(1);
    });

    it("should return two triangles for four close points for a panorama", () => {
        const polygon: number[][] = [[0, 0], [1e-4, 0], [1e-4, 1e-4], [0, 1e-4], [0, 0]];
        const geometry: PolygonGeometry = new PolygonGeometry(polygon);

        const gpano: IGPano = {
            CroppedAreaImageHeightPixels: 0,
            CroppedAreaImageWidthPixels: 0,
            CroppedAreaLeftPixels: 0,
            CroppedAreaTopPixels: 0,
            FullPanoHeightPixels: 0,
            FullPanoWidthPixels: 0,
        };

        const transform: Transform = new Transform(1, 1, 1, 0.5, 1, gpano, [0, 0, 0], [0, 0, 0], undefined);

        const triangles: number[] = geometry.getTriangles3d(transform);

        expect(triangles.length / (3 * 3)).toBe(2);
    });
});
