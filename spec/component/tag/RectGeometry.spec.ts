import {IGPano} from "../../../src/API";
import {RectGeometry} from "../../../src/Component";
import {Transform} from "../../../src/Geo";
import {Node} from "../../../src/Graph";

import {TransformHelper} from "../../helper/TransformHelper.spec";

describe("RectGeometry.ctor", () => {
    it("should be defined", () => {
        let rectGeometry: RectGeometry = new RectGeometry([0, 0, 1, 1]);

        expect(rectGeometry).toBeDefined();
    });

    it("rect should be set", () => {
        let original: number[] = [0.2, 0.2, 0.4, 0.4];

        let rectGeometry: RectGeometry = new RectGeometry(original);

        expect(rectGeometry.rect[0]).toBe(0.2);
        expect(rectGeometry.rect[1]).toBe(0.2);
        expect(rectGeometry.rect[2]).toBe(0.4);
        expect(rectGeometry.rect[3]).toBe(0.4);
    });

    it("should throw if y values are inverted", () => {
        let original: number[] = [0.2, 0.4, 0.4, 0.2];

        expect(() => { return new RectGeometry(original); }).toThrowError(Error);
    });

    it("should throw if value is below supported range", () => {
        let original: number[] = [-1, 0.4, 0.4, 0.2];

        expect(() => { return new RectGeometry(original); }).toThrowError(Error);
    });

    it("should throw if value is above supported range", () => {
        let original: number[] = [2, 0.4, 0.4, 0.2];

        expect(() => { return new RectGeometry(original); }).toThrowError(Error);
    });
});

describe("RectGeometry.getVertex2d", () => {
    it("should return the polygon vertices", () => {
        const rect: number[] = [0.2, 0.3, 0.4, 0.5];
        const geometry: RectGeometry = new RectGeometry(rect);

        expect(geometry.getVertex2d(0)).toEqual([0.2, 0.5]);
        expect(geometry.getVertex2d(1)).toEqual([0.2, 0.3]);
        expect(geometry.getVertex2d(2)).toEqual([0.4, 0.3]);
        expect(geometry.getVertex2d(3)).toEqual([0.4, 0.5]);
        expect(geometry.getVertex2d(4)).toEqual([0.2, 0.5]);
    });
});

describe("RectGeometry.getCentroid2d", () => {
    it("should return the centroid", () => {
        const rect: number[] = [0.2, 0.4, 0.6, 0.7];
        const rectGeometry: RectGeometry = new RectGeometry(rect);

        const result: number[] = rectGeometry.getCentroid2d();

        expect(result).toEqual([0.4, 0.55]);
    });
});

describe("RectGeometry.getCentroid2d", () => {
    it("should shift the centroid when inverted", () => {
        const rect: number[] = [0.9, 0.4, 0.2, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);

        const result: number[] = rectGeometry.getCentroid2d();

        expect(result).toEqual([1.05, 0.5]);
    });
});

describe("RectGeometry.getVertices2d", () => {
    it("should return the vertices create from the rect representation", () => {
        const rect: number[] = [0.2, 0.4, 0.6, 0.7];
        const rectGeometry: RectGeometry = new RectGeometry(rect);

        const result: number[][] = rectGeometry.getVertices2d();

        expect(result.length).toBe(5);
        expect(result[0]).toEqual([0.2, 0.7]);
        expect(result[1]).toEqual([0.2, 0.4]);
        expect(result[2]).toEqual([0.6, 0.4]);
        expect(result[3]).toEqual([0.6, 0.7]);
        expect(result[4]).toEqual([0.2, 0.7]);
    });
});

describe("RectGeometry.getVertices2d", () => {
    it("should return the shifted clockwise vertices when inverted", () => {
        const rect: number[] = [0.9, 0.4, 0.2, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);

        const result: number[][] = rectGeometry.getVertices2d();

        expect(result.length).toBe(5);
        expect(result[0]).toEqual([0.9, 0.6]);
        expect(result[1]).toEqual([0.9, 0.4]);
        expect(result[2]).toEqual([1.2, 0.4]);
        expect(result[3]).toEqual([1.2, 0.6]);
        expect(result[4]).toEqual([0.9, 0.6]);
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

    it("should set rect according to bottom left value", () => {
        let original: number[] = [0, 0, 1, 1];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [0.5, 0.5];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(0, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(vertex[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(vertex[1]);
    });

    it("should set rect according to top left value", () => {
        let original: number[] = [0, 0, 1, 1];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [0.5, 0.5];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(1, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(vertex[0]);
        expect(rectGeometry.rect[1]).toBe(vertex[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should set rect according to top right value", () => {
        let original: number[] = [0, 0, 1, 1];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [0.5, 0.5];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(2, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(vertex[1]);
        expect(rectGeometry.rect[2]).toBe(vertex[0]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should set rect according to bottom right value", () => {
        let original: number[] = [0, 0, 1, 1];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [0.5, 0.5];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(3, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(vertex[0]);
        expect(rectGeometry.rect[3]).toBe(vertex[1]);
    });

    it("should clamp negative input value to [0, 1] interval", () => {
        let original: number[] = [0.25, 0.25, 0.75, 0.75];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [-1, -1];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(1, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(0);
        expect(rectGeometry.rect[1]).toBe(0);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should clamp input value larger than 1 to [0, 1] interval", () => {
        let original: number[] = [0.25, 0.25, 0.75, 0.75];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [2, 2];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(3, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(1);
        expect(rectGeometry.rect[3]).toBe(1);
    });

    it("should not allow right to pass left", () => {
        let original: number[] = [0.5, 0.5, 0.7, 0.7];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [0.3, original[3]];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(3, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should not allow left to pass right", () => {
        let original: number[] = [0.4, 0.4, 0.5, 0.5];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [0.6, original[1]];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(1, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should not allow bottom to pass top", () => {
        let original: number[] = [0.5, 0.5, 0.6, 0.6];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [original[2], 0.4];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(3, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should not allow top to pass bottom", () => {
        let original: number[] = [0.4, 0.4, 0.5, 0.5];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [original[0], 0.6];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(1, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should become inverted when passing boundary to the left", () => {
        let original: number[] = [0.1, 0.1, 0.4, 0.4];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [0.9, original[1]];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(1, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(vertex[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should become inverted when passing boundary to the right", () => {
        let original: number[] = [0.6, 0.6, 0.9, 0.9];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [0.1, original[3]];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(3, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(vertex[0]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should change correctly when inverted", () => {
        let original: number[] = [0.9, 0.1, 0.4, 0.4];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [0.8, original[1]];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(1, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(vertex[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should become regular when passing boundary to the left", () => {
        let original: number[] = [0.7, 0.1, 0.1, 0.4];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [0.9, original[3]];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(3, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(vertex[0]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should become regular when passing boundary to the right", () => {
        let original: number[] = [0.9, 0.1, 0.4, 0.4];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [0.1, original[1]];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(1, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(vertex[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should not allow right to pass left over boundary", () => {
        let original: number[] = [0.01, 0.1, 0.02, 0.2];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [0.99, original[3]];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(3, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should not allow left to pass right over boundary", () => {
        let original: number[] = [0.98, 0.1, 0.99, 0.2];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let vertex: number[] = [0.01, original[1]];
        let transform: Transform = createTransform(true);

        rectGeometry.setVertex2d(1, vertex, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });
});

describe("RectGeometry.setCentroid2d", () => {
    let precision: number = 8;

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

    it("should set rect according to new centroid", () => {
        let original: number[] = [0.2, 0.2, 0.3, 0.3];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let centroid: number[] = [0.45, 0.45];
        let transform: Transform = createTransform(false);

        rectGeometry.setCentroid2d(centroid, transform);

        expect(rectGeometry.rect[0]).toBeCloseTo(0.4, precision);
        expect(rectGeometry.rect[1]).toBeCloseTo(0.4, precision);
        expect(rectGeometry.rect[2]).toBeCloseTo(0.5, precision);
        expect(rectGeometry.rect[3]).toBeCloseTo(0.5, precision);
    });

    it("should limit x-axis translation for non pano", () => {
        let original: number[] = [0.1, 0.1, 0.3, 0.3];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let centroid: number[] = [0, 0.2];
        let transform: Transform = createTransform(false);

        rectGeometry.setCentroid2d(centroid, transform);

        expect(rectGeometry.rect[0]).toBeCloseTo(0, precision);
        expect(rectGeometry.rect[1]).toBeCloseTo(0.1, precision);
        expect(rectGeometry.rect[2]).toBeCloseTo(0.2, precision);
        expect(rectGeometry.rect[3]).toBeCloseTo(0.3, precision);
    });

    it("should not limit x-axis translation for non pano", () => {
        let original: number[] = [0.1, 0.1, 0.3, 0.3];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let centroid: number[] = [0, 0.2];
        let transform: Transform = createTransform(true);

        rectGeometry.setCentroid2d(centroid, transform);

        expect(rectGeometry.rect[0]).toBeCloseTo(0.9, precision);
        expect(rectGeometry.rect[1]).toBeCloseTo(0.1, precision);
        expect(rectGeometry.rect[2]).toBeCloseTo(0.1, precision);
        expect(rectGeometry.rect[3]).toBeCloseTo(0.3, precision);
    });

    it("should limit y-axis translation for non pano", () => {
        let original: number[] = [0.1, 0.1, 0.3, 0.3];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let centroid: number[] = [0.2, 0];
        let transform: Transform = createTransform(false);

        rectGeometry.setCentroid2d(centroid, transform);

        expect(rectGeometry.rect[0]).toBeCloseTo(0.1, precision);
        expect(rectGeometry.rect[1]).toBeCloseTo(0, precision);
        expect(rectGeometry.rect[2]).toBeCloseTo(0.3, precision);
        expect(rectGeometry.rect[3]).toBeCloseTo(0.2, precision);
    });

    it("should limit y-axis translation for non pano", () => {
        let original: number[] = [0.1, 0.1, 0.3, 0.3];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let centroid: number[] = [0.2, 0];
        let transform: Transform = createTransform(true);

        rectGeometry.setCentroid2d(centroid, transform);

        expect(rectGeometry.rect[0]).toBeCloseTo(0.1, precision);
        expect(rectGeometry.rect[1]).toBeCloseTo(0, precision);
        expect(rectGeometry.rect[2]).toBeCloseTo(0.3, precision);
        expect(rectGeometry.rect[3]).toBeCloseTo(0.2, precision);
    });
});

describe("RectGeometry.initializeAnchorIndexing", () => {
    it("should initialize without parameter", () => {
        const rect: number[] = [0.2, 0.2, 0.3, 0.3];
        const rectGeometry: RectGeometry = new RectGeometry(rect);

        rectGeometry.initializeAnchorIndexing();

        expect(rectGeometry.anchorIndex).toBe(0);
    });

    it("should initialize to supplied value parameter", () => {
        const rect: number[] = [0.2, 0.2, 0.3, 0.3];
        const rectGeometry: RectGeometry = new RectGeometry(rect);

        rectGeometry.initializeAnchorIndexing(2);

        expect(rectGeometry.anchorIndex).toBe(2);
    });

    it("should throw for incorrect indices", () => {
        const rect: number[] = [0.2, 0.2, 0.3, 0.3];
        const rectGeometry: RectGeometry = new RectGeometry(rect);

        expect((): void => { rectGeometry.initializeAnchorIndexing(-1); }).toThrowError(Error);
        expect((): void => { rectGeometry.initializeAnchorIndexing(4); }).toThrowError(Error);
    });

    it("should throw if already intialized", () => {
        const rect: number[] = [0.2, 0.2, 0.3, 0.3];
        const rectGeometry: RectGeometry = new RectGeometry(rect);

        rectGeometry.initializeAnchorIndexing();

        expect((): void => { rectGeometry.initializeAnchorIndexing(); }).toThrowError(Error);
    });
});

describe("RectGeometry.terminateAnchorIndexing", () => {
    it("should clear anchor index", () => {
        const rect: number[] = [0.2, 0.2, 0.3, 0.3];
        const rectGeometry: RectGeometry = new RectGeometry(rect);

        rectGeometry.initializeAnchorIndexing();
        rectGeometry.terminateAnchorIndexing();

        expect(rectGeometry.anchorIndex).toBeUndefined();
    });
});

describe("RectGeometry.setOppositeVertex", () => {
    it("should clamp supplied coords to [0, 1] interval", () => {
        const rect: number[] = [0.5, 0.5, 0.6, 0.5];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform();

        rectGeometry.initializeAnchorIndexing(1);

        rectGeometry.setOppositeVertex2d([2, 2], transform);
        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.rect).toEqual([0.5, 0.5, 1, 1]);

        rectGeometry.setOppositeVertex2d([-1, -1], transform);
        expect(rectGeometry.anchorIndex).toBe(3);
        expect(rectGeometry.rect).toEqual([0, 0, 0.5, 0.5]);
    });

    it("should rotate anchor index clockwise", () => {
        const rect: number[] = [0.5, 0.5, 0.6, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform();

        rectGeometry.initializeAnchorIndexing(1);
        expect(rectGeometry.anchorIndex).toBe(1);

        rectGeometry.setOppositeVertex2d([0.4, 0.6], transform);
        expect(rectGeometry.anchorIndex).toBe(2);
        expect(rectGeometry.rect).toEqual([0.4, 0.5, 0.5, 0.6]);

        rectGeometry.setOppositeVertex2d([0.4, 0.4], transform);
        expect(rectGeometry.anchorIndex).toBe(3);
        expect(rectGeometry.rect).toEqual([0.4, 0.4, 0.5, 0.5]);

        rectGeometry.setOppositeVertex2d([0.6, 0.4], transform);
        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.rect).toEqual([0.5, 0.4, 0.6, 0.5]);

        rectGeometry.setOppositeVertex2d([0.6, 0.6], transform);
        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.rect).toEqual([0.5, 0.5, 0.6, 0.6]);
    });

    it("should rotate anchor index counterclockwise", () => {
        const rect: number[] = [0.5, 0.5, 0.6, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform();

        rectGeometry.initializeAnchorIndexing(1);
        expect(rectGeometry.anchorIndex).toBe(1);

        rectGeometry.setOppositeVertex2d([0.6, 0.4], transform);
        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.rect).toEqual([0.5, 0.4, 0.6, 0.5]);

        rectGeometry.setOppositeVertex2d([0.4, 0.4], transform);
        expect(rectGeometry.anchorIndex).toBe(3);
        expect(rectGeometry.rect).toEqual([0.4, 0.4, 0.5, 0.5]);

        rectGeometry.setOppositeVertex2d([0.4, 0.6], transform);
        expect(rectGeometry.anchorIndex).toBe(2);
        expect(rectGeometry.rect).toEqual([0.4, 0.5, 0.5, 0.6]);

        rectGeometry.setOppositeVertex2d([0.6, 0.6], transform);
        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.rect).toEqual([0.5, 0.5, 0.6, 0.6]);
    });

    it("should rotate anchor index diagonally se-nw", () => {
        const rect: number[] = [0.5, 0.5, 0.6, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform();

        rectGeometry.initializeAnchorIndexing(1);
        expect(rectGeometry.anchorIndex).toBe(1);

        rectGeometry.setOppositeVertex2d([0.4, 0.4], transform);
        expect(rectGeometry.anchorIndex).toBe(3);
        expect(rectGeometry.rect).toEqual([0.4, 0.4, 0.5, 0.5]);

        rectGeometry.setOppositeVertex2d([0.6, 0.6], transform);
        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.rect).toEqual([0.5, 0.5, 0.6, 0.6]);
    });

    it("should rotate anchor index diagonally ne-sw", () => {
        const rect: number[] = [0.5, 0.4, 0.6, 0.5];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform();

        rectGeometry.initializeAnchorIndexing(0);
        expect(rectGeometry.anchorIndex).toBe(0);

        rectGeometry.setOppositeVertex2d([0.4, 0.6], transform);
        expect(rectGeometry.anchorIndex).toBe(2);
        expect(rectGeometry.rect).toEqual([0.4, 0.5, 0.5, 0.6]);

        rectGeometry.setOppositeVertex2d([0.6, 0.4], transform);
        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.rect).toEqual([0.5, 0.4, 0.6, 0.5]);
    });

    it("should not change anchor index when opposite decreases to equal anchor", () => {
        const rect: number[] = [0.5, 0.5, 0.6, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform();

        rectGeometry.initializeAnchorIndexing(1);

        rectGeometry.setOppositeVertex2d([0.5, 0.6], transform);
        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.rect).toEqual([0.5, 0.5, 0.5, 0.6]);

        rectGeometry.setOppositeVertex2d([0.5, 0.5], transform);
        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.rect).toEqual([0.5, 0.5, 0.5, 0.5]);
    });

    it("should not change anchor index when opposite increases to equal anchor", () => {
        const rect: number[] = [0.4, 0.4, 0.5, 0.5];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform();

        rectGeometry.initializeAnchorIndexing(3);

        rectGeometry.setOppositeVertex2d([0.5, 0.4], transform);
        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.rect).toEqual([0.5, 0.4, 0.5, 0.5]);

        rectGeometry.setOppositeVertex2d([0.5, 0.5], transform);
        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.rect).toEqual([0.5, 0.5, 0.5, 0.5]);
    });

    it("should always have a larger right x than left x except when equal", () => {
        const rect: number[] = [0.5, 0.5, 0.6, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform();

        rectGeometry.initializeAnchorIndexing(1);

        rectGeometry.setOppositeVertex2d([0.4, 0.6], transform);
        expect(rectGeometry.rect[0] < rectGeometry.rect[2]).toBe(true);

        rectGeometry.setOppositeVertex2d([0.6, 0.6], transform);
        expect(rectGeometry.rect[0] < rectGeometry.rect[2]).toBe(true);

        rectGeometry.setOppositeVertex2d([0.5, 0.6], transform);
        expect(rectGeometry.rect[0] === rectGeometry.rect[2]).toBe(true);
    });

    it("should always have a larger bottom y than top y except when equal", () => {
        const rect: number[] = [0.5, 0.5, 0.6, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform();

        rectGeometry.initializeAnchorIndexing(1);

        rectGeometry.setOppositeVertex2d([0.6, 0.4], transform);
        expect(rectGeometry.rect[1] < rectGeometry.rect[3]).toBe(true);

        rectGeometry.setOppositeVertex2d([0.6, 0.6], transform);
        expect(rectGeometry.rect[1] < rectGeometry.rect[3]).toBe(true);

        rectGeometry.setOppositeVertex2d([0.6, 0.5], transform);
        expect(rectGeometry.rect[1] === rectGeometry.rect[3]).toBe(true);
    });
});

describe("RectGeometry.inverted", () => {
    it("should not be inverted if right is larger than left", () => {
        const rect: number[] = [0.5, 0.5, 0.6, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);

        expect(rectGeometry.inverted).toBe(false);
    });

    it("should be inverted if left is larger than right", () => {
        const rect: number[] = [0.9, 0.5, 0.1, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);

        expect(rectGeometry.inverted).toBe(true);
    });
});

describe("RectGeometry.setOppositeVertex", () => {
    const createFullGPano: () => IGPano = (): IGPano => {
        return {
            CroppedAreaImageHeightPixels: 1,
            CroppedAreaImageWidthPixels: 1,
            CroppedAreaLeftPixels: 0,
            CroppedAreaTopPixels: 0,
            FullPanoHeightPixels: 1,
            FullPanoWidthPixels: 1,
        };
    };

    it("should invert for pano when right side passes boundary rightward", () => {
        const rect: number[] = [0.9, 0.5, 0.99, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(0);

        rectGeometry.setOppositeVertex2d([0.01, 0.5], transform);

        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.inverted).toBe(true);
        expect(rectGeometry.rect).toEqual([0.9, 0.5, 0.01, 0.6]);
    });

    it("should invert for pano when left side passes right side and boundary rightward", () => {
        const rect: number[] = [0.9, 0.5, 0.99, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(3);

        rectGeometry.setOppositeVertex2d([0.01, 0.5], transform);

        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.inverted).toBe(true);
        expect(rectGeometry.rect).toEqual([0.99, 0.5, 0.01, 0.6]);
    });

    it("should uninvert for pano when left side passes boundary rightward", () => {
        const rect: number[] = [0.9, 0.5, 0.1, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(3);

        rectGeometry.setOppositeVertex2d([0.01, 0.5], transform);

        expect(rectGeometry.anchorIndex).toBe(3);
        expect(rectGeometry.inverted).toBe(false);
        expect(rectGeometry.rect).toEqual([0.01, 0.5, 0.1, 0.6]);
    });

    it("should uninvert for pano when left side passes right side and boundary rightward", () => {
        const rect: number[] = [0.99, 0.5, 0.01, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(3);

        rectGeometry.setOppositeVertex2d([0.1, 0.5], transform);

        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.inverted).toBe(false);
        expect(rectGeometry.rect).toEqual([0.01, 0.5, 0.1, 0.6]);
    });

    it("should invert for pano when left side passes boundary leftward", () => {
        const rect: number[] = [0.01, 0.5, 0.1, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(3);

        rectGeometry.setOppositeVertex2d([0.99, 0.5], transform);

        expect(rectGeometry.anchorIndex).toBe(3);
        expect(rectGeometry.inverted).toBe(true);
        expect(rectGeometry.rect).toEqual([0.99, 0.5, 0.1, 0.6]);
    });

    it("should invert for pano when right side passes left side and boundary leftward", () => {
        const rect: number[] = [0.01, 0.5, 0.1, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(0);

        rectGeometry.setOppositeVertex2d([0.9, 0.5], transform);

        expect(rectGeometry.anchorIndex).toBe(3);
        expect(rectGeometry.inverted).toBe(true);
        expect(rectGeometry.rect).toEqual([0.9, 0.5, 0.01, 0.6]);
    });

    it("should uninvert for pano when right side passes boundary leftward", () => {
        const rect: number[] = [0.9, 0.5, 0.1, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(0);

        rectGeometry.setOppositeVertex2d([0.99, 0.5], transform);

        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.inverted).toBe(false);
        expect(rectGeometry.rect).toEqual([0.9, 0.5, 0.99, 0.6]);
    });

    it("should uninvert for pano when right side passes left side and boundary leftward", () => {
        const rect: number[] = [0.99, 0.5, 0.1, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(0);

        rectGeometry.setOppositeVertex2d([0.9, 0.5], transform);

        expect(rectGeometry.anchorIndex).toBe(3);
        expect(rectGeometry.inverted).toBe(false);
        expect(rectGeometry.rect).toEqual([0.9, 0.5, 0.99, 0.6]);
    });

    it("should keep inversion for anchor index 0", () => {
        const rect: number[] = [0.9, 0.5, 0.1, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(0);

        rectGeometry.setOppositeVertex2d([0.2, 0.5], transform);

        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.inverted).toBe(true);
        expect(rectGeometry.rect).toEqual([0.9, 0.5, 0.2, 0.6]);
    });

    it("should keep inversion for anchor index 1", () => {
        const rect: number[] = [0.9, 0.5, 0.1, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(1);

        rectGeometry.setOppositeVertex2d([0.2, 0.6], transform);

        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.inverted).toBe(true);
        expect(rectGeometry.rect).toEqual([0.9, 0.5, 0.2, 0.6]);
    });

    it("should keep inversion for anchor index 2", () => {
        const rect: number[] = [0.9, 0.5, 0.1, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(2);

        rectGeometry.setOppositeVertex2d([0.8, 0.6], transform);

        expect(rectGeometry.anchorIndex).toBe(2);
        expect(rectGeometry.inverted).toBe(true);
        expect(rectGeometry.rect).toEqual([0.8, 0.5, 0.1, 0.6]);
    });

    it("should keep inversion for anchor index 2", () => {
        const rect: number[] = [0.9, 0.5, 0.1, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(3);

        rectGeometry.setOppositeVertex2d([0.8, 0.5], transform);

        expect(rectGeometry.anchorIndex).toBe(3);
        expect(rectGeometry.inverted).toBe(true);
        expect(rectGeometry.rect).toEqual([0.8, 0.5, 0.1, 0.6]);
    });

    it("should keep inversion when passing vertically to the right", () => {
        const rect: number[] = [0.9, 0.5, 0.1, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(1);

        rectGeometry.setOppositeVertex2d([0.1, 0.4], transform);

        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.inverted).toBe(true);
        expect(rectGeometry.rect).toEqual([0.9, 0.4, 0.1, 0.5]);

        rectGeometry.setOppositeVertex2d([0.1, 0.6], transform);

        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.inverted).toBe(true);
        expect(rectGeometry.rect).toEqual([0.9, 0.5, 0.1, 0.6]);
    });

    it("should keep inversion when passing vertically to the left", () => {
        const rect: number[] = [0.9, 0.5, 0.1, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(2);

        rectGeometry.setOppositeVertex2d([0.9, 0.4], transform);

        expect(rectGeometry.anchorIndex).toBe(3);
        expect(rectGeometry.inverted).toBe(true);
        expect(rectGeometry.rect).toEqual([0.9, 0.4, 0.1, 0.5]);

        rectGeometry.setOppositeVertex2d([0.9, 0.6], transform);

        expect(rectGeometry.anchorIndex).toBe(2);
        expect(rectGeometry.inverted).toBe(true);
        expect(rectGeometry.rect).toEqual([0.9, 0.5, 0.1, 0.6]);
    });

    it("should reset loop when right passes left", () => {
        const rect: number[] = [0.15, 0.5, 0.1, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(0);

        rectGeometry.setOppositeVertex2d([0.2, 0.5], transform);

        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.inverted).toBe(false);
        expect(rectGeometry.rect).toEqual([0.15, 0.5, 0.2, 0.6]);
    });

    it("should reset loop when left passes right", () => {
        const rect: number[] = [0.2, 0.5, 0.15, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(3);

        rectGeometry.setOppositeVertex2d([0.1, 0.5], transform);

        expect(rectGeometry.anchorIndex).toBe(3);
        expect(rectGeometry.inverted).toBe(false);
        expect(rectGeometry.rect).toEqual([0.1, 0.5, 0.15, 0.6]);
    });
});

describe("RectGeometry.setOppositeVertex", () => {
    const createFullGPano: () => IGPano = (): IGPano => {
        return {
            CroppedAreaImageHeightPixels: 1,
            CroppedAreaImageWidthPixels: 1,
            CroppedAreaLeftPixels: 0,
            CroppedAreaTopPixels: 0,
            FullPanoHeightPixels: 1,
            FullPanoWidthPixels: 1,
        };
    };

    it("should rotate anchor index clockwise for pano", () => {
        const rect: number[] = [0.5, 0.5, 0.6, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(1);
        expect(rectGeometry.anchorIndex).toBe(1);

        rectGeometry.setOppositeVertex2d([0.4, 0.6], transform);
        expect(rectGeometry.anchorIndex).toBe(2);
        expect(rectGeometry.rect).toEqual([0.4, 0.5, 0.5, 0.6]);

        rectGeometry.setOppositeVertex2d([0.4, 0.4], transform);
        expect(rectGeometry.anchorIndex).toBe(3);
        expect(rectGeometry.rect).toEqual([0.4, 0.4, 0.5, 0.5]);

        rectGeometry.setOppositeVertex2d([0.6, 0.4], transform);
        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.rect).toEqual([0.5, 0.4, 0.6, 0.5]);

        rectGeometry.setOppositeVertex2d([0.6, 0.6], transform);
        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.rect).toEqual([0.5, 0.5, 0.6, 0.6]);
    });

    it("should rotate anchor index counterclockwise for pano", () => {
        const rect: number[] = [0.5, 0.5, 0.6, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(1);
        expect(rectGeometry.anchorIndex).toBe(1);

        rectGeometry.setOppositeVertex2d([0.6, 0.4], transform);
        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.rect).toEqual([0.5, 0.4, 0.6, 0.5]);

        rectGeometry.setOppositeVertex2d([0.4, 0.4], transform);
        expect(rectGeometry.anchorIndex).toBe(3);
        expect(rectGeometry.rect).toEqual([0.4, 0.4, 0.5, 0.5]);

        rectGeometry.setOppositeVertex2d([0.4, 0.6], transform);
        expect(rectGeometry.anchorIndex).toBe(2);
        expect(rectGeometry.rect).toEqual([0.4, 0.5, 0.5, 0.6]);

        rectGeometry.setOppositeVertex2d([0.6, 0.6], transform);
        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.rect).toEqual([0.5, 0.5, 0.6, 0.6]);
    });

    it("should rotate anchor index diagonally se-nw for pano", () => {
        const rect: number[] = [0.5, 0.5, 0.6, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(1);
        expect(rectGeometry.anchorIndex).toBe(1);

        rectGeometry.setOppositeVertex2d([0.4, 0.4], transform);
        expect(rectGeometry.anchorIndex).toBe(3);
        expect(rectGeometry.rect).toEqual([0.4, 0.4, 0.5, 0.5]);

        rectGeometry.setOppositeVertex2d([0.6, 0.6], transform);
        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.rect).toEqual([0.5, 0.5, 0.6, 0.6]);
    });

    it("should rotate anchor index diagonally ne-sw for pano", () => {
        const rect: number[] = [0.5, 0.4, 0.6, 0.5];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(0);
        expect(rectGeometry.anchorIndex).toBe(0);

        rectGeometry.setOppositeVertex2d([0.4, 0.6], transform);
        expect(rectGeometry.anchorIndex).toBe(2);
        expect(rectGeometry.rect).toEqual([0.4, 0.5, 0.5, 0.6]);

        rectGeometry.setOppositeVertex2d([0.6, 0.4], transform);
        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.rect).toEqual([0.5, 0.4, 0.6, 0.5]);
    });

    it("should not change anchor index when opposite decreases to equal anchor for pano", () => {
        const rect: number[] = [0.5, 0.5, 0.6, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(1);

        rectGeometry.setOppositeVertex2d([0.5, 0.6], transform);
        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.rect).toEqual([0.5, 0.5, 0.5, 0.6]);

        rectGeometry.setOppositeVertex2d([0.5, 0.5], transform);
        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.rect).toEqual([0.5, 0.5, 0.5, 0.5]);
    });

    it("should not change anchor index when opposite increases to equal anchor for pano", () => {
        const rect: number[] = [0.4, 0.4, 0.5, 0.5];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(3);

        rectGeometry.setOppositeVertex2d([0.5, 0.4], transform);
        expect(rectGeometry.anchorIndex).toBe(0);
        expect(rectGeometry.rect).toEqual([0.5, 0.4, 0.5, 0.5]);

        rectGeometry.setOppositeVertex2d([0.5, 0.5], transform);
        expect(rectGeometry.anchorIndex).toBe(1);
        expect(rectGeometry.rect).toEqual([0.5, 0.5, 0.5, 0.5]);
    });

    it("should always have a larger right x than left x except when equal for pano", () => {
        const rect: number[] = [0.5, 0.5, 0.6, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(1);

        rectGeometry.setOppositeVertex2d([0.4, 0.6], transform);
        expect(rectGeometry.rect[0] < rectGeometry.rect[2]).toBe(true);

        rectGeometry.setOppositeVertex2d([0.6, 0.6], transform);
        expect(rectGeometry.rect[0] < rectGeometry.rect[2]).toBe(true);

        rectGeometry.setOppositeVertex2d([0.5, 0.6], transform);
        expect(rectGeometry.rect[0] === rectGeometry.rect[2]).toBe(true);
    });

    it("should always have a larger bottom y than top y except when equal for pano", () => {
        const rect: number[] = [0.5, 0.5, 0.6, 0.6];
        const rectGeometry: RectGeometry = new RectGeometry(rect);
        const transform: Transform = new TransformHelper().createTransform(createFullGPano());

        rectGeometry.initializeAnchorIndexing(1);

        rectGeometry.setOppositeVertex2d([0.6, 0.4], transform);
        expect(rectGeometry.rect[1] < rectGeometry.rect[3]).toBe(true);

        rectGeometry.setOppositeVertex2d([0.6, 0.6], transform);
        expect(rectGeometry.rect[1] < rectGeometry.rect[3]).toBe(true);

        rectGeometry.setOppositeVertex2d([0.6, 0.5], transform);
        expect(rectGeometry.rect[1] === rectGeometry.rect[3]).toBe(true);
    });
});
