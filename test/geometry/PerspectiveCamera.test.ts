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

describe("PerspectiveCamera.radialPeak", () => {
    it("should be finite for negative k1 when k2 is zero", () => {
        // y(r) = r * (1 + k1 * r^2) peaks where 1 + 3 * k1 * r^2 = 0
        const camera = new PerspectiveCamera([0.85, -0.2, 0]);
        expect(camera.uniforms.radialPeak).toBeCloseTo(Math.sqrt(1 / 0.6), 10);
    });

    it("should be continuous as k2 approaches zero", () => {
        const zero = new PerspectiveCamera([0.85, -0.2, 0]);
        const small = new PerspectiveCamera([0.85, -0.2, 1e-12]);
        expect(small.uniforms.radialPeak).toBeCloseTo(Math.sqrt(1 / 0.6), 6);
        expect(zero.uniforms.radialPeak)
            .toBeCloseTo(<number>small.uniforms.radialPeak, 6);
    });

    it("should be infinite when distortion does not peak", () => {
        expect(new PerspectiveCamera([0.85, 0.1, 0]).uniforms.radialPeak)
            .toBe(Number.POSITIVE_INFINITY);
        expect(new PerspectiveCamera([0.85, 0, 0]).uniforms.radialPeak)
            .toBe(Number.POSITIVE_INFINITY);
    });

    it("should not fold points outside the peak back into the image", () => {
        const camera = new PerspectiveCamera([0.85, -0.2, 0]);
        const angle = 63 * Math.PI / 180;
        const sfm = camera.projectToSfm([Math.sin(angle), 0, Math.cos(angle)]);

        // Radius clamped at the peak gives distortion 1 - 0.2 / 0.6 = 2 / 3
        expect(sfm[0]).toBeCloseTo(0.85 * Math.tan(angle) * 2 / 3, 6);
        expect(sfm[1]).toBeCloseTo(0, 10);
    });

    it("should unproject and project the image corner consistently", () => {
        const camera = new PerspectiveCamera([0.55, -0.28, 0]);
        const corner = [-0.5, -0.375];
        const sfm = camera.projectToSfm(camera.bearingFromSfm(corner));

        expect(sfm[0]).toBeCloseTo(corner[0], 6);
        expect(sfm[1]).toBeCloseTo(corner[1], 6);
    });
});
