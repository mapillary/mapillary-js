import {IGPano} from "../../../src/API";
import {PointGeometry} from "../../../src/Component";
import {Transform} from "../../../src/Geo";
import {Node} from "../../../src/Graph";

describe("PointGeometry.ctor", () => {
    it("should be defined", () => {
        let pointGeometry: PointGeometry = new PointGeometry([0.5, 0.5]);

        expect(pointGeometry).toBeDefined();
    });

    it("point should be set", () => {
        let pointGeometry: PointGeometry = new PointGeometry([0.5, 0.5]);

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

describe("PointGeometry.getCentroid2d", () => {
    it("should get an array that is equal to the point", () => {
        const point: number[] = [0.5, 0.6];
        const pointGeometry: PointGeometry = new PointGeometry(point);

        const result: number[] = pointGeometry.getCentroid2d();

        expect(result).not.toBe(pointGeometry.point);
        expect(result).not.toBe(point);

        expect(result).toEqual(point);
    });
});
