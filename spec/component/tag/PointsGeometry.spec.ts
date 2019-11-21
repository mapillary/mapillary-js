import {PointsGeometry, GeometryTagError} from "../../../src/Component";
import {Transform} from "../../../src/Geo";
import TransformHelper from "../../helper/FrameHelper.spec";

describe("PointsGeometry.ctor", () => {
    it("should be defined", () => {
        let pointsGeometry: PointsGeometry = new PointsGeometry([[0.5, 0.5], [0.7, 0.7]]);

        expect(pointsGeometry).toBeDefined();
    });

    it("points should be set", () => {
        let pointsGeometry: PointsGeometry = new PointsGeometry([[0.5, 0.6], [0.7, 0.8]]);

        expect(pointsGeometry.points.length).toBe(2);
        expect(pointsGeometry.points[0][0]).toBe(0.5);
        expect(pointsGeometry.points[0][1]).toBe(0.6);
        expect(pointsGeometry.points[1][0]).toBe(0.7);
        expect(pointsGeometry.points[1][1]).toBe(0.8);
    });

    it("should throw if number of points is less than two", () => {
        expect(() => { return new PointsGeometry([[0.5, 0.6]]); }).toThrowError(GeometryTagError);
    });

    it("should throw if basic coord is below supported range", () => {
        expect(() => { return new PointsGeometry([[-0.5, 0.6], [0.7, 0.8]]); }).toThrowError(GeometryTagError);
        expect(() => { return new PointsGeometry([[0.5, -0.6], [0.7, 0.8]]); }).toThrowError(GeometryTagError);
        expect(() => { return new PointsGeometry([[0.5, 0.6], [-0.7, 0.8]]); }).toThrowError(GeometryTagError);
        expect(() => { return new PointsGeometry([[0.5, 0.6], [0.7, -0.8]]); }).toThrowError(GeometryTagError);
    });

    it("should throw if basic coord is above supported range", () => {
        expect(() => { return new PointsGeometry([[1.5, 0.6], [0.7, 0.8]]); }).toThrowError(GeometryTagError);
        expect(() => { return new PointsGeometry([[0.5, 1.6], [0.7, 0.8]]); }).toThrowError(GeometryTagError);
        expect(() => { return new PointsGeometry([[0.5, 0.6], [1.7, 0.8]]); }).toThrowError(GeometryTagError);
        expect(() => { return new PointsGeometry([[0.5, 0.6], [0.7, 1.8]]); }).toThrowError(GeometryTagError);
    });
});

describe("PointsGeometry.getCentroid2d", () => {
    it("should get an array that is the average of the points", () => {
        const points: number[][] = [[0.5, 0.6], [0.8, 0.9]];
        const pointsGeometry: PointsGeometry = new PointsGeometry(points);

        const transform: Transform = new TransformHelper().createTransform();
        const result: number[] = pointsGeometry.getCentroid2d(transform);

        expect(result).not.toBe(points[0]);
        expect(result).not.toBe(points[1]);

        expect(result).toEqual([0.65, 0.75]);
    });

    it("should get an array that is the average of the points irrespective of order", () => {
        const points: number[][] = [[0.8, 0.9], [0.5, 0.6]];
        const pointsGeometry: PointsGeometry = new PointsGeometry(points);

        const transform: Transform = new TransformHelper().createTransform();
        const result: number[] = pointsGeometry.getCentroid2d(transform);

        expect(result).not.toBe(points[0]);
        expect(result).not.toBe(points[1]);

        expect(result).toEqual([0.65, 0.75]);
    });

    it("should get centroid based on smallest rectangle containing all points", () => {
        const points: number[][] = [[0.5, 0.6], [0.8, 0.9], [0.55, 0.65], [0.55, 0.65], [0.55, 0.65]];
        const pointsGeometry: PointsGeometry = new PointsGeometry(points);

        const transform: Transform = new TransformHelper().createTransform();
        const result: number[] = pointsGeometry.getCentroid2d(transform);

        expect(result).not.toBe(points[0]);
        expect(result).not.toBe(points[1]);

        expect(result).toEqual([0.65, 0.75]);
    });
});

describe("PointsGeometry.getRect2d", () => {
    it("should get the rectangle based on the two points", () => {
        const points: number[][] = [[0.5, 0.6], [0.8, 0.9]];
        const pointsGeometry: PointsGeometry = new PointsGeometry(points);

        const transform: Transform = new TransformHelper().createTransform();
        const result: number[] = pointsGeometry.getRect2d(transform);

        expect(result.length).toBe(4);
        expect(result).toEqual([
            points[0][0],
            points[0][1],
            points[1][0],
            points[1][1],
        ]);
    });

    it("should get the rectangle based on the two points irrespective of order", () => {
        const points: number[][] = [[0.8, 0.9], [0.5, 0.6]];
        const pointsGeometry: PointsGeometry = new PointsGeometry(points);

        const transform: Transform = new TransformHelper().createTransform();
        const result: number[] = pointsGeometry.getRect2d(transform);

        expect(result.length).toBe(4);
        expect(result).toEqual([
            points[1][0],
            points[1][1],
            points[0][0],
            points[0][1],
        ]);
    });

    it("should get the smallest rectangle containing all points", () => {
        const points: number[][] = [[0.5, 0.6], [0.8, 0.9], [0.55, 0.65], [0.55, 0.65], [0.55, 0.65]];
        const pointsGeometry: PointsGeometry = new PointsGeometry(points);

        const transform: Transform = new TransformHelper().createTransform();
        const result: number[] = pointsGeometry.getRect2d(transform);

        expect(result.length).toBe(4);
        expect(result).toEqual([
            points[0][0],
            points[0][1],
            points[1][0],
            points[1][1],
        ]);
    });

    it("should get the smallest wrapping rectangle containing all points for pano", () => {
        const points: number[][] = [[0.9, 0.6], [0.2, 0.8]];
        const pointsGeometry: PointsGeometry = new PointsGeometry(points);

        const helper: TransformHelper = new TransformHelper();
        const transform: Transform = helper.createTransform(helper.createFullGPano());
        const result: number[] = pointsGeometry.getRect2d(transform);

        expect(result.length).toBe(4);
        expect(result).toEqual([
            points[0][0],
            points[0][1],
            points[1][0],
            points[1][1],
        ]);
    });

    it("should get the smallest wrapping rectangle containing all points for pano irrespective of order", () => {
        const points: number[][] = [[0.2, 0.8], [0.9, 0.6]];
        const pointsGeometry: PointsGeometry = new PointsGeometry(points);

        const helper: TransformHelper = new TransformHelper();
        const transform: Transform = helper.createTransform(helper.createFullGPano());
        const result: number[] = pointsGeometry.getRect2d(transform);

        expect(result.length).toBe(4);
        expect(result).toEqual([
            points[1][0],
            points[1][1],
            points[0][0],
            points[0][1],
        ]);
    });
});

describe("PointsGeometry.setVertex2d", () => {
    it("should set point to value", () => {
        const original: number[][] = [[0.1, 0.2], [0.3, 0.4]];
        const pointGeometry: PointsGeometry = new PointsGeometry(original);

        const point: number[] = [0.5, 0.6];
        const transform: Transform = new TransformHelper().createTransform();

        pointGeometry.setVertex2d(1, point, transform);

        expect(pointGeometry.points[1][0]).toBe(point[0]);
        expect(pointGeometry.points[1][1]).toBe(point[1]);
    });

    it("should clamp negative input value to [0, 1] interval", () => {
        const original: number[][] = [[0.1, 0.2], [0.3, 0.4]];
        const pointGeometry: PointsGeometry = new PointsGeometry(original);

        const point: number[] = [-1, -1];
        const transform: Transform = new TransformHelper().createTransform();

        pointGeometry.setVertex2d(1, point, transform);

        expect(pointGeometry.points[1][0]).toBe(0);
        expect(pointGeometry.points[1][1]).toBe(0);
    });

    it("should clamp input value larger than 1 to [0, 1] interval", () => {
        const original: number[][] = [[0.1, 0.2], [0.3, 0.4]];
        const pointGeometry: PointsGeometry = new PointsGeometry(original);

        const point: number[] = [2, 2];
        const transform: Transform = new TransformHelper().createTransform();

        pointGeometry.setVertex2d(1, point, transform);

        expect(pointGeometry.points[1][0]).toBe(1);
        expect(pointGeometry.points[1][1]).toBe(1);
    });
});

describe("PointsGeometry.removePoint2d", () => {
    it("should reomve point according to index", () => {
        const original: number[][] = [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]];
        const pointGeometry: PointsGeometry = new PointsGeometry(original);

        pointGeometry.removePoint2d(1);

        expect(pointGeometry.points.length).toBe(2);
        expect(pointGeometry.points[0][0]).toBe(0.1);
        expect(pointGeometry.points[0][1]).toBe(0.2);
        expect(pointGeometry.points[1][0]).toBe(0.5);
        expect(pointGeometry.points[1][1]).toBe(0.6);
    });
});

describe("PointsGeometry.removePoint2d", () => {
    it("should reomve point according to index", () => {
        const original: number[][] = [[0.1, 0.2], [0.3, 0.4]];
        const pointGeometry: PointsGeometry = new PointsGeometry(original);

        pointGeometry.addPoint2d([0.5, 0.6]);

        expect(pointGeometry.points.length).toBe(3);
        expect(pointGeometry.points[0][0]).toBe(0.1);
        expect(pointGeometry.points[0][1]).toBe(0.2);
        expect(pointGeometry.points[1][0]).toBe(0.3);
        expect(pointGeometry.points[1][1]).toBe(0.4);
        expect(pointGeometry.points[2][0]).toBe(0.5);
        expect(pointGeometry.points[2][1]).toBe(0.6);
    });
});
