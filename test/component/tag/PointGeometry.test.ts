import { PointGeometry } from "../../../src/component/tag/geometry/PointGeometry";
import { TransformHelper } from "../../helper/TransformHelper";

const transformHelper = new TransformHelper();

describe("PointGeometry.ctor", () => {
    it("should be defined", () => {
        let pointGeometry = new PointGeometry([0.5, 0.5]);

        expect(pointGeometry).toBeDefined();
    });

    it("point should be set", () => {
        let pointGeometry = new PointGeometry([0.5, 0.5]);

        expect(pointGeometry.point[0]).toBe(0.5);
        expect(pointGeometry.point[1]).toBe(0.5);
    });

    it("should throw if basic coord is below supported range", () => {
        expect(() => { return new PointGeometry([-1, 0.5]); }).toThrowError(Error);
        expect(() => { return new PointGeometry([0.5, -1]); }).toThrowError(Error);
    });

    it("should throw if basic coord is above supported range", () => {
        expect(() => { return new PointGeometry([2, 0.5]); }).toThrowError(Error);
        expect(() => { return new PointGeometry([0.5, 2]); }).toThrowError(Error);
    });
});

describe("PointGeometry.setVertex2d", () => {
    it("should set point to value", () => {
        let original = [0, 0];
        let pointGeometry = new PointGeometry(original);

        let point = [0.5, 0.5];
        let transform = transformHelper.createTransform("spherical");

        pointGeometry.setCentroid2d(point, transform);

        expect(pointGeometry.point[0]).toBe(point[0]);
        expect(pointGeometry.point[1]).toBe(point[1]);
    });

    it("should clamp negative input value to [0, 1] interval", () => {
        let original = [0.5, 0.5];
        let pointGeometry = new PointGeometry(original);

        let point = [-1, -1];
        let transform = transformHelper.createTransform("spherical");

        pointGeometry.setCentroid2d(point, transform);

        expect(pointGeometry.point[0]).toBe(0);
        expect(pointGeometry.point[1]).toBe(0);
    });

    it("should clamp input value larger than 1 to [0, 1] interval", () => {
        let original = [0.5, 0.5];
        let pointGeometry = new PointGeometry(original);

        let point = [2, 2];
        let transform = transformHelper.createTransform("spherical");

        pointGeometry.setCentroid2d(point, transform);

        expect(pointGeometry.point[0]).toBe(1);
        expect(pointGeometry.point[1]).toBe(1);
    });
});

describe("PointGeometry.getCentroid2d", () => {
    it("should get an array that is equal to the point", () => {
        const point = [0.5, 0.6];
        const pointGeometry = new PointGeometry(point);

        const result = pointGeometry.getCentroid2d();

        expect(result).not.toBe(pointGeometry.point);
        expect(result).not.toBe(point);

        expect(result).toEqual(point);
    });
});
