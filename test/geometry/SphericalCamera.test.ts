import { Vector3 } from "three";
import {
    SphericalCamera,
    SPHERICAL_CAMERA_TYPE,
} from "../../src/geometry/camera/SphericalCamera";
import { EPSILON } from "../../src/geometry/Constants";

describe("SphericalCamera.ctor", () => {
    it("should be defined when constructed", () => {
        const camera = new SphericalCamera();
        expect(camera).toBeDefined();
    });

    it("should set properties", () => {
        const camera = new SphericalCamera();
        expect(camera.type).toBe(SPHERICAL_CAMERA_TYPE);
    });
});

describe("SphericalCamera.projectToSfm", () => {
    it("should project", () => {
        const camera = new SphericalCamera();
        const point = new Vector3(2, 3, 10).normalize().toArray();
        const sfm = camera.projectToSfm(point);
        const bearing = camera.bearingFromSfm(sfm);

        expect(bearing[0]).toBeCloseTo(point[0], EPSILON);
        expect(bearing[1]).toBeCloseTo(point[1], EPSILON);
        expect(bearing[2]).toBeCloseTo(point[2], EPSILON);
    });
});

describe("SphericalCamera.bearingFromSfm", () => {
    it("should unproject", () => {
        const camera = new SphericalCamera();
        const point = [0.2, 0.1];
        const bearing = camera.bearingFromSfm(point);
        const sfm = camera.projectToSfm(bearing);

        expect(sfm[0]).toBeCloseTo(point[0], EPSILON);
        expect(sfm[1]).toBeCloseTo(point[1], EPSILON);
    });
});
