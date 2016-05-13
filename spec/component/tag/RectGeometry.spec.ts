/// <reference path="../../../typings/browser.d.ts" />

import {IGPano} from "../../../src/API";
import {RectGeometry, GeometryTagError} from "../../../src/Component";
import {Transform} from "../../../src/Geo";
import {Node} from "../../../src/Graph";

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

        expect(() => { new RectGeometry(original); }).toThrowError(GeometryTagError);
    });

    it("should throw if value is below supported range", () => {
        let original: number[] = [-1, 0.4, 0.4, 0.2];

        expect(() => { new RectGeometry(original); }).toThrowError(GeometryTagError);
    });

    it("should throw if value is above supported range", () => {
        let original: number[] = [2, 0.4, 0.4, 0.2];

        expect(() => { new RectGeometry(original); }).toThrowError(GeometryTagError);
    });
});

describe("RectGeometry.setPolygonPoint2d", () => {
    let createTransform = (pano: boolean): Transform => {
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

        let node: Node = new Node(0, null, true, null, { key: "", rotation: [0, 0, 0], gpano: gpano }, []);

        return new Transform(node, [0, 0, 0]);
    }

    it("should set rect according to bottom left value", () => {
        let original: number[] = [0, 0, 1, 1];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [0.5, 0.5];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(0, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(polygonPoint[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(polygonPoint[1]);
    });

    it("should set rect according to top left value", () => {
        let original: number[] = [0, 0, 1, 1];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [0.5, 0.5];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(1, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(polygonPoint[0]);
        expect(rectGeometry.rect[1]).toBe(polygonPoint[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should set rect according to top right value", () => {
        let original: number[] = [0, 0, 1, 1];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [0.5, 0.5];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(2, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(polygonPoint[1]);
        expect(rectGeometry.rect[2]).toBe(polygonPoint[0]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should set rect according to bottom right value", () => {
        let original: number[] = [0, 0, 1, 1];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [0.5, 0.5];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(3, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(polygonPoint[0]);
        expect(rectGeometry.rect[3]).toBe(polygonPoint[1]);
    });

    it("should clamp negative input value to [0, 1] interval", () => {
        let original: number[] = [0.25, 0.25, 0.75, 0.75];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [-1, -1];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(1, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(0);
        expect(rectGeometry.rect[1]).toBe(0);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should clamp input value larger than 1 to [0, 1] interval", () => {
        let original: number[] = [0.25, 0.25, 0.75, 0.75];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [2, 2];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(3, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(1);
        expect(rectGeometry.rect[3]).toBe(1);
    });

    it("should not allow right to pass left", () => {
        let original: number[] = [0.5, 0.5, 0.7, 0.7];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [0.3, original[3]];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(3, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should not allow left to pass right", () => {
        let original: number[] = [0.4, 0.4, 0.5, 0.5];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [0.6, original[1]];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(1, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should not allow bottom to pass top", () => {
        let original: number[] = [0.5, 0.5, 0.6, 0.6];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [original[2], 0.4];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(3, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should not allow top to pass bottom", () => {
        let original: number[] = [0.4, 0.4, 0.5, 0.5];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [original[0], 0.6];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(1, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should become inverted when passing boundary to the left", () => {
        let original: number[] = [0.1, 0.1, 0.4, 0.4];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [0.9, original[1]];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(1, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(polygonPoint[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should become inverted when passing boundary to the right", () => {
        let original: number[] = [0.6, 0.6, 0.9, 0.9];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [0.1, original[3]];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(3, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(polygonPoint[0]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should change correctly when inverted", () => {
        let original: number[] = [0.9, 0.1, 0.4, 0.4];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [0.8, original[1]];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(1, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(polygonPoint[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should become regular when passing boundary to the left", () => {
        let original: number[] = [0.7, 0.1, 0.1, 0.4];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [0.9, original[3]];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(3, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(polygonPoint[0]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should become regular when passing boundary to the right", () => {
        let original: number[] = [0.9, 0.1, 0.4, 0.4];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [0.1, original[1]];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(1, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(polygonPoint[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should not allow right to pass left over boundary", () => {
        let original: number[] = [0.01, 0.1, 0.02, 0.2];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [0.99, original[3]];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(3, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });

    it("should not allow left to pass right over boundary", () => {
        let original: number[] = [0.98, 0.1, 0.99, 0.2];
        let rectGeometry: RectGeometry = new RectGeometry(original);

        let polygonPoint: number[] = [0.01, original[1]];
        let transform: Transform = createTransform(true);

        rectGeometry.setPolygonPoint2d(1, polygonPoint, transform);

        expect(rectGeometry.rect[0]).toBe(original[0]);
        expect(rectGeometry.rect[1]).toBe(original[1]);
        expect(rectGeometry.rect[2]).toBe(original[2]);
        expect(rectGeometry.rect[3]).toBe(original[3]);
    });
});

describe("RectGeometry.setCentroid2d", () => {
    let precision: number = 8;

    let createTransform = (pano: boolean): Transform => {
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

        let node: Node = new Node(0, null, true, null, { key: "", rotation: [0, 0, 0], gpano: gpano }, []);

        return new Transform(node, [0, 0, 0]);
    }

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
