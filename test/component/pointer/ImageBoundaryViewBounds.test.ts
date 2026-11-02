import * as THREE from "three";

import * as ImageBoundary from "../../../src/component/pointer/ImageBoundary";
import { Camera } from "../../../src/geo/Camera";
import { Transform } from "../../../src/geo/Transform";
import { ViewportCoords } from "../../../src/geo/ViewportCoords";
import { CameraType } from "../../../src/geo/interfaces/CameraType";
import { ProjectionService } from "../../../src/viewer/ProjectionService";

const coords = new ViewportCoords();

function transform(cameraType: CameraType): Transform {
    const spherical = cameraType === "spherical";
    const camera = new ProjectionService()
        .makeCamera(cameraType, spherical ? [] : [0.85, 0, 0]);
    return new Transform(1, spherical ? 4096 : 4000, spherical ? 2048 : 3000, 1,
        [0, 0, 0], [0, 0, 0], null, camera);
}

/** A render camera at the image position looking at a basic point. */
function render(t: Transform, center: number[], fov: number, aspect: number = 1.5): THREE.PerspectiveCamera {
    const native = new Camera(t);
    const result = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    result.position.copy(native.position);
    result.up.copy(native.up);
    result.lookAt(new THREE.Vector3().fromArray(t.unprojectBasic(center, 10)));
    result.updateMatrixWorld(true);
    result.updateProjectionMatrix();
    return result;
}

describe("ImageBoundary.viewBoundsBasic", () => {
    it("returns null without a valid window, keeping image edges", () => {
        const t = transform("perspective");
        const p = render(t, [0.5, 0.5], 40);
        expect(ImageBoundary.viewBoundsBasic(t, p, null)).toBeNull();
        expect(ImageBoundary.viewBoundsBasic(t, p, undefined)).toBeNull();
        expect(ImageBoundary.viewBoundsBasic(t, p, { center: [0.5], fieldOfView: 30 })).toBeNull();
        expect(ImageBoundary.viewBoundsBasic(t, p, { center: [0.5, 0.5], fieldOfView: 0 })).toBeNull();
        expect(ImageBoundary.viewBoundsBasic(t, p, { center: [0.5, NaN], fieldOfView: 30 })).toBeNull();
    });

    it("is a centered rectangle inside a regular image", () => {
        const t = transform("perspective");
        const rect = ImageBoundary.viewBoundsBasic(t, render(t, [0.5, 0.5], 20), { center: [0.5, 0.5], fieldOfView: 20 });
        expect(rect).not.toBeNull();
        expect(rect[0]).toBeGreaterThan(0);
        expect(rect[1]).toBeGreaterThan(0);
        expect(rect[2]).toBeLessThan(1);
        expect(rect[3]).toBeLessThan(1);
        expect((rect[0] + rect[2]) / 2).toBeCloseTo(0.5, 6);
        expect((rect[1] + rect[3]) / 2).toBeCloseTo(0.5, 6);
    });

    it("is also limited to the edges of a regular image", () => {
        const t = transform("perspective");
        const rect = ImageBoundary.viewBoundsBasic(t, render(t, [0.5, 0.5], 40), { center: [0.5, 0.5], fieldOfView: 120 });
        expect(rect).toEqual([0, 0, 1, 1]);
    });

    it("unwraps a panorama window across the seam", () => {
        const t = transform("spherical");
        const rect = ImageBoundary.viewBoundsBasic(t, render(t, [0.01, 0.5], 40), { center: [0.01, 0.5], fieldOfView: 40 });
        expect(rect).not.toBeNull();
        expect(rect[0]).toBeLessThan(0);
        expect(rect[2]).toBeGreaterThan(0.01);
        expect((rect[0] + rect[2]) / 2).toBeCloseTo(0.01, 6);
    });
});

describe("ImageBoundary.viewportDistances with view bounds", () => {
    for (const cameraType of ["perspective", "spherical"] as CameraType[]) {
        const center = cameraType === "spherical" ? [0.01, 0.5] : [0.5, 0.5];

        it(`keeps the default image edges for ${cameraType} images`, () => {
            const t = transform(cameraType);
            const p = render(t, center, 30);
            expect(ImageBoundary.viewportDistances(t, p, coords))
                .toEqual(ImageBoundary.viewportDistances(t, p, coords, undefined));
        });

        it(`allows panning a zoomed ${cameraType} view within the window`, () => {
            const t = transform(cameraType);
            const bounds = { center, fieldOfView: 30 };
            // Zoomed in twice: the window still contains the view near each edge.
            const rect = ImageBoundary.viewBoundsBasic(t, render(t, center, 15), bounds);
            for (const offset of [[0, 0], [-0.35, 0], [0.35, 0], [0, -0.35], [0, 0.35], [0.3, 0.3], [-0.3, -0.3]]) {
                const target = [
                    center[0] + offset[0] * (rect[2] - rect[0]) / 2,
                    center[1] + offset[1] * (rect[3] - rect[1]) / 2,
                ];
                const p = render(t, target, 15);
                const distances = ImageBoundary.viewportDistances(t, p, coords, ImageBoundary.viewBoundsBasic(t, p, bounds));
                expect(Math.max(...distances)).toBeLessThan(0.01);
            }
        });

        it(`pushes a ${cameraType} view panned past the window back towards it`, () => {
            const t = transform(cameraType);
            const bounds = { center, fieldOfView: 30 };
            const rect = ImageBoundary.viewBoundsBasic(t, render(t, center, 15), bounds);
            const width = rect[2] - rect[0], height = rect[3] - rect[1];
            const cases: [number[], number][] = [
                // Straddling each window edge: that viewport side shows outside.
                [[center[0] + width / 2, center[1]], 1],
                [[center[0] - width / 2, center[1]], 3],
                [[center[0], center[1] + height / 2], 2], // basic Y grows downwards
                [[center[0], center[1] - height / 2], 0],
            ];
            for (const [target, side] of cases) {
                const p = render(t, target, 15);
                const distances = ImageBoundary.viewportDistances(t, p, coords, ImageBoundary.viewBoundsBasic(t, p, bounds));
                expect(distances[side]).toBeGreaterThan(0.01);
                expect(distances[(side + 2) % 4]).toBeLessThan(0.01);
            }
        });

        it(`centers a ${cameraType} view wider than its window instead of drifting`, () => {
            const t = transform(cameraType);
            const p = render(t, center, 40);
            const distances = ImageBoundary.viewportDistances(t, p, coords,
                ImageBoundary.viewBoundsBasic(t, p, { center, fieldOfView: 20 }));
            expect(distances[1] - distances[3]).toBeCloseTo(0, 2);
            expect(distances[0] - distances[2]).toBeCloseTo(0, 2);
        });
    }
});
