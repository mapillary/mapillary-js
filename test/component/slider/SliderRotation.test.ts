import * as THREE from "three";
import { SliderGLRenderer } from "../../../src/component/slider/SliderGLRenderer";
import { SliderConfigurationMode } from "../../../src/component/interfaces/SliderConfiguration";
import { Camera } from "../../../src/geo/Camera";

function nativeCamera(direction: THREE.Vector3, up: THREE.Vector3): Camera {
    const camera = new Camera();
    camera.position.set(20, 10, 4);
    camera.lookat.copy(camera.position).add(direction);
    camera.up.copy(up);
    return camera;
}
function perspective(camera: Camera): THREE.PerspectiveCamera {
    const result = new THREE.PerspectiveCamera(90, 1.5, 0.1, 100);
    result.position.copy(camera.position);
    result.up.copy(camera.up);
    result.lookAt(camera.lookat);
    result.updateMatrixWorld(true);
    return result;
}
function expectSameRotation(actual: THREE.Quaternion, expected: THREE.Quaternion): void {
    expect(Math.abs(actual.dot(expected))).toBeCloseTo(1, 10);
}
function renderer(): any {
    const result = new SliderGLRenderer() as any;
    result._gravityAligned = true;
    result._previousSpherical = true;
    result._mode = SliderConfigurationMode.Motion;
    // Distinct, non-world-up image frames reproduce the reported unsafe poses.
    result._currentCamera = nativeCamera(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0));
    result._previousCamera = nativeCamera(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0));
    return result;
}

describe("Slider linked fallback rotation", () => {
    it("preserves each image's native upright pose at the default center", () => {
        const r = renderer();
        const live = perspective(r._currentCamera);
        const before = live.quaternion.clone();
        const comparison = r._getPreviousPerspective(live);
        expectSameRotation(comparison.quaternion, perspective(r._previousCamera).quaternion);
        expectSameRotation(live.quaternion, before);
        expect(comparison.up.toArray()).toEqual(r._previousCamera.up.toArray());
    });
    it("applies a view rotated before entry on the first comparison frame", () => {
        const r = renderer();
        const live = perspective(r._currentCamera);
        const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.12, 0.6, 0));
        live.quaternion.multiply(delta);
        live.updateMatrixWorld(true);
        const expected = perspective(r._previousCamera).quaternion.multiply(delta);
        expectSameRotation(r._getPreviousPerspective(live).quaternion, expected);
    });
    it("follows horizontal and vertical drags on every render, without resetting the offset", () => {
        const r = renderer();
        const live = perspective(r._currentCamera);
        const original = r._getPreviousPerspective(live);
        for (const [pitch, yaw] of [[0.1, 0.4], [-0.2, -0.3], [0, 0]]) {
            const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, 0));
            live.quaternion.copy(perspective(r._currentCamera).quaternion).multiply(delta);
            live.updateMatrixWorld(true);
            const comparison = r._getPreviousPerspective(live);
            expect(comparison).toBe(original);
            expectSameRotation(comparison.quaternion, perspective(r._previousCamera).quaternion.multiply(delta));
        }
    });
    it("copies live zoom, aspect and projection after the first render", () => {
        const r = renderer();
        const live = perspective(r._currentCamera);
        r._getPreviousPerspective(live);
        live.fov = 42;
        live.aspect = 2;
        live.zoom = 1.4;
        live.updateProjectionMatrix();
        const comparison = r._getPreviousPerspective(live);
        expect(comparison.fov).toBe(42);
        expect(comparison.aspect).toBe(2);
        expect(comparison.zoom).toBe(1.4);
        expect(comparison.projectionMatrix.elements).toEqual(live.projectionMatrix.elements);
    });
    it("keeps spherical fallback cameras on the recentered mesh as the live position changes", () => {
        const r = renderer();
        const live = perspective(r._currentCamera);
        r._getPreviousPerspective(live);
        live.position.set(2, 3, 4);
        expect(r._getPreviousPerspective(live).position.toArray()).toEqual([2, 3, 4]);
    });
    it("preserves the independent position for perspective fallback images", () => {
        const r = renderer();
        const live = perspective(r._currentCamera);
        r._previousSpherical = false;
        live.position.set(2, 3, 4);
        expect(r._getPreviousPerspective(live).position.toArray()).toEqual(r._previousCamera.position.toArray());
    });
    it("retains the shared live camera for trusted gravity-aligned Motion pairs", () => {
        const r = renderer();
        const live = perspective(r._currentCamera);
        r._currentGravityAligned = true;
        r._previousGravityAligned = true;
        expect(r._getPreviousPerspective(live)).toBe(r._getCurrentPerspective(live));
    });
    it("recomputes the native mapping after the comparison camera is replaced", () => {
        const r = renderer();
        const live = perspective(r._currentCamera);
        r._getPreviousPerspective(live);
        const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.1, 0.4, 0));
        live.quaternion.multiply(delta);
        r._previousCamera = nativeCamera(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1));
        r._previousPerspective = null;
        r._previousRotation = null;
        expectSameRotation(r._getPreviousPerspective(live).quaternion, perspective(r._previousCamera).quaternion.multiply(delta));
    });
});
