import { Vector3 } from "three";
import {
    FisheyeCamera,
    FISHEYE_CAMERA_TYPE,
} from "../../src/geometry/camera/FisheyeCamera";
import { EPSILON } from "../../src/geometry/Constants";

describe("FisheyeCamera.ctor", () => {
    it("should be defined when constructed", () => {
        const camera = new FisheyeCamera([0.5, 0.1, 0.2]);
        expect(camera).toBeDefined();
    });

    it("should set properties", () => {
        const camera = new FisheyeCamera([0.5, 0.1, 0.2]);
        expect(camera.type).toBe(FISHEYE_CAMERA_TYPE);
        expect(camera.parameters.focal).toBe(0.5);
        expect(camera.parameters.k1).toBe(0.1);
        expect(camera.parameters.k2).toBe(0.2);
        expect(camera.uniforms.radialPeak).toBeDefined();
    });
});

describe("FisheyeCamera.projectToSfm", () => {
    it("should project", () => {
        const camera = new FisheyeCamera([0.7, 0.01, 0.02]);
        const point = new Vector3(2, 3, 10).normalize().toArray();
        const sfm = camera.projectToSfm(point);
        const bearing = camera.bearingFromSfm(sfm);

        expect(bearing[0]).toBeCloseTo(point[0], EPSILON);
        expect(bearing[1]).toBeCloseTo(point[1], EPSILON);
        expect(bearing[2]).toBeCloseTo(point[2], EPSILON);
    });
});

describe("FisheyeCamera.bearingFromSfm", () => {
    it("should unproject", () => {
        const camera = new FisheyeCamera([0.7, 0.01, 0.02]);
        const point = [0.3, 0.5];
        const bearing = camera.bearingFromSfm(point);
        const sfm = camera.projectToSfm(bearing);

        expect(sfm[0]).toBeCloseTo(point[0], EPSILON);
        expect(sfm[1]).toBeCloseTo(point[1], EPSILON);
    });
});
