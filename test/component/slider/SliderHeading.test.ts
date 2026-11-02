import * as THREE from "three";
import { sliderHeadingRotation } from "../../../src/component/slider/SliderHeading";
import { Image } from "../../../src/graph/Image";
import { SliderGLRenderer } from "../../../src/component/slider/SliderGLRenderer";
import { SliderConfigurationMode } from "../../../src/component/interfaces/SliderConfiguration";
import { Camera } from "../../../src/geo/Camera";

function image(compassAngle: number, cameraType: string = "spherical"): Image {
    return { compassAngle, cameraType } as Image;
}
function camera(): Camera {
    const result = new Camera();
    result.lookat.set(0, 0, -1);
    result.up.set(0, 1, 0);
    return result;
}

describe("Slider panorama heading", () => {
    it("aligns opposite-facing captures to the same physical viewing direction", () => {
        const rotation = sliderHeadingRotation(image(180), image(0));
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(rotation);
        expect(direction.z).toBeCloseTo(1);
        expect(direction.y).toBeCloseTo(0);
    });
    it("wraps north crossings without changing pitch or roll", () => {
        const rotation = sliderHeadingRotation(image(350), image(10));
        const expected = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 20 * Math.PI / 180);
        expect(Math.abs(rotation.dot(expected))).toBeCloseTo(1, 10);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(rotation);
        expect(up.x).toBeCloseTo(0);
        expect(up.y).toBeCloseTo(1);
        expect(up.z).toBeCloseTo(0);
    });
    it("falls back to native-relative rotation when heading is unavailable", () => {
        for (const heading of [undefined, null, NaN, Infinity]) {
            expect(sliderHeadingRotation(image(180), image(heading)).toArray()).toEqual([0, 0, 0, 1]);
            expect(sliderHeadingRotation(image(heading), image(0)).toArray()).toEqual([0, 0, 0, 1]);
        }
    });
    it("does not apply panorama heading offsets to perspective or missing images", () => {
        expect(sliderHeadingRotation(image(180, "perspective"), image(0)).toArray()).toEqual([0, 0, 0, 1]);
        expect(sliderHeadingRotation(image(180), image(0, "perspective")).toArray()).toEqual([0, 0, 0, 1]);
        expect(sliderHeadingRotation(null, image(0)).toArray()).toEqual([0, 0, 0, 1]);
    });
    it("applies current rotation and zoom when selecting an opposite-facing comparison", () => {
        const r = new SliderGLRenderer() as any;
        r._gravityAligned = true;
        r._previousSpherical = true;
        r._mode = SliderConfigurationMode.Motion;
        r._currentCamera = camera();
        r._previousCamera = camera();
        const live = new THREE.PerspectiveCamera(45, 1.5, 0.1, 100);
        const delta = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0.7, 0));
        live.quaternion.copy(delta);
        live.updateMatrixWorld(true);
        r._getPreviousPerspective(live);
        r._headingRotation = sliderHeadingRotation(image(180), image(0));
        r._previousRotation = null;
        r._previousPerspective = null;
        const comparison = r._getPreviousPerspective(live);
        const expected = r._headingRotation.clone().multiply(delta);
        expect(Math.abs(comparison.quaternion.dot(expected))).toBeCloseTo(1, 10);
        expect(comparison.fov).toBe(45);
        expect(comparison.projectionMatrix.elements).toEqual(live.projectionMatrix.elements);
        expect(live.quaternion.toArray()).toEqual(delta.toArray());
    });
});
