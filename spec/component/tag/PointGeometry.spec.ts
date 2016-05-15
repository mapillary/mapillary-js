/// <reference path="../../../typings/browser.d.ts" />

import {IGPano} from "../../../src/API";
import {PointGeometry, GeometryTagError} from "../../../src/Component";
import {Transform} from "../../../src/Geo";
import {Node} from "../../../src/Graph";

describe("RectGeometry.ctor", () => {
    it("should be defined", () => {
        let pointGeometry: PointGeometry = new PointGeometry([0.5, 0.5]);

        expect(pointGeometry).toBeDefined();
    });

    it("rect should be set", () => {
        let original: number[] = [0.5, 0.5]

        let pointGeometry: PointGeometry = new PointGeometry([0.5, 0.5]);

        expect(pointGeometry.point[0]).toBe(0.5);
        expect(pointGeometry.point[1]).toBe(0.5);
    });

    it("should throw if basic coord is below supported range", () => {
        expect(() => { new PointGeometry([-1, 0.5]); }).toThrowError(GeometryTagError);
        expect(() => { new PointGeometry([0.5, -1]); }).toThrowError(GeometryTagError);
    });

    it("should throw if basic coord is above supported range", () => {
        expect(() => { new PointGeometry([2, 0.5]); }).toThrowError(GeometryTagError);
        expect(() => { new PointGeometry([0.5, 2]); }).toThrowError(GeometryTagError);
    });
});

describe("RectGeometry.setVertex2d", () => {
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

    it("should set point to value", () => {
        let original: number[] = [0, 0];
        let pointGeometry: PointGeometry = new PointGeometry(original);

        let point: number[] = [0.5, 0.5];
        let transform: Transform = createTransform(true);

        pointGeometry.setCentroid2d(point, transform);

        expect(pointGeometry.point[0]).toBe(point[0]);
        expect(pointGeometry.point[1]).toBe(point[1]);
    });

    it("should clamp negative input value to [0, 1] interval", () => {
        let original: number[] = [0.5, 0.5];
        let pointGeometry: PointGeometry = new PointGeometry(original);

        let point: number[] = [-1, -1];
        let transform: Transform = createTransform(true);

        pointGeometry.setCentroid2d(point, transform);

        expect(pointGeometry.point[0]).toBe(0);
        expect(pointGeometry.point[1]).toBe(0);
    });

    it("should clamp input value larger than 1 to [0, 1] interval", () => {
        let original: number[] = [0.5, 0.5];
        let pointGeometry: PointGeometry = new PointGeometry(original);

        let point: number[] = [2, 2];
        let transform: Transform = createTransform(true);

        pointGeometry.setCentroid2d(point, transform);

        expect(pointGeometry.point[0]).toBe(1);
        expect(pointGeometry.point[1]).toBe(1);
    });
});
