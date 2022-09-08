import { Vector3 } from "three";
import {
    PerspectiveCamera,
    PERSPECTIVE_CAMERA_TYPE,
} from "../../src/geometry/camera/PerspectiveCamera";
import { EPSILON } from "../../src/geometry/Constants";

describe("PerspectiveCamera.ctor", () => {
    it("should be defined when constructed", () => {
        const camera = new PerspectiveCamera([0.5, 0.1, 0.2]);
        expect(camera).toBeDefined();
    });

    it("should set properties", () => {
        const camera = new PerspectiveCamera([0.5, 0.1, 0.2]);
        expect(camera.type).toBe(PERSPECTIVE_CAMERA_TYPE);
        expect(camera.parameters.focal).toBe(0.5);
        expect(camera.parameters.k1).toBe(0.1);
        expect(camera.parameters.k2).toBe(0.2);
        expect(camera.uniforms.radialPeak).toBeDefined();
    });
});

describe("PerspectiveCamera.projectToSfm", () => {
    it("should project", () => {
        const camera = new PerspectiveCamera([0.8, 0.01, 0.02]);
        const point = new Vector3(2, 3, 10).normalize().toArray();
        const sfm = camera.projectToSfm(point);
        const bearing = camera.bearingFromSfm(sfm);

        expect(bearing[0]).toBeCloseTo(point[0], EPSILON);
        expect(bearing[1]).toBeCloseTo(point[1], EPSILON);
        expect(bearing[2]).toBeCloseTo(point[2], EPSILON);
    });
});

describe("PerspectiveCamera.bearingFromSfm", () => {
    it("should unproject", () => {
        const camera = new PerspectiveCamera([0.8, 0.01, 0.02]);
        const point = [0.3, 0.5];
        const bearing = camera.bearingFromSfm(point);
        const sfm = camera.projectToSfm(bearing);

        expect(sfm[0]).toBeCloseTo(point[0], EPSILON);
        expect(sfm[1]).toBeCloseTo(point[1], EPSILON);
    });
});
