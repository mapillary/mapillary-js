import * as THREE from "three";
import { sliderViewAlignedRoll, sliderViewLeveled } from "../../../src/component/slider/SliderRoll";

const deg = Math.PI / 180;
function camera(up: THREE.Vector3 = new THREE.Vector3(0, 0, 1)): THREE.PerspectiveCamera {
    const result = new THREE.PerspectiveCamera(60, 1.5, 0.1, 100);
    result.up.copy(up);
    result.lookAt(new THREE.Vector3(0, 1, 0));
    result.updateMatrixWorld(true);
    return result;
}
/** Image up for a forward (+y) photo rolled clockwise by `roll` radians. */
function rolledUp(roll: number): THREE.Vector3 {
    return new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), roll);
}
function screenAngle(c: THREE.Camera, up: THREE.Vector3): number {
    const q = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().extractRotation(c.matrixWorld)).invert();
    const v = up.clone().applyQuaternion(q);
    return Math.atan2(v.x, v.y);
}

describe("Slider view-aligned roll", () => {
    it("shows an upright comparison upright despite opposite small reconstruction rolls", () => {
        const currentUp = rolledUp(3.3 * deg), previousUp = rolledUp(-3.4 * deg);
        const live = camera(currentUp);
        const roll = sliderViewAlignedRoll(live, currentUp, previousUp, false);
        expect(Math.abs(roll)).toBeCloseTo(6.7 * deg, 6);
        const comparison = live.clone();
        comparison.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
        comparison.updateMatrixWorld(true);
        expect(screenAngle(live, currentUp)).toBeCloseTo(0, 6);
        expect(screenAngle(comparison, previousUp)).toBeCloseTo(0, 6);
    });
    it("keeps native alignment when the original is panned or gravity-levelled", () => {
        const currentUp = rolledUp(3 * deg), previousUp = rolledUp(-4 * deg);
        const live = camera();
        const roll = sliderViewAlignedRoll(live, currentUp, previousUp, false);
        const comparison = live.clone();
        comparison.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
        comparison.updateMatrixWorld(true);
        expect(screenAngle(comparison, previousUp)).toBeCloseTo(screenAngle(live, currentUp), 6);
    });
    it("keeps the shared gravity frame when both views are levelled", () => {
        const live = camera();
        expect(sliderViewLeveled(live)).toBe(true);
        expect(sliderViewAlignedRoll(live, rolledUp(9 * deg), rolledUp(-8 * deg), true)).toBe(0);
        expect(sliderViewLeveled(camera(rolledUp(3 * deg)))).toBe(false);
    });
    it("ignores missing, degenerate and implausible frames", () => {
        const live = camera();
        expect(sliderViewAlignedRoll(live, null, rolledUp(0), false)).toBe(0);
        expect(sliderViewAlignedRoll(live, rolledUp(0), null, false)).toBe(0);
        expect(sliderViewAlignedRoll(live, rolledUp(0), rolledUp(60 * deg), false)).toBe(0);
        expect(sliderViewAlignedRoll(live, rolledUp(0), new THREE.Vector3(0, 1, 0), false)).toBe(0);
        expect(sliderViewAlignedRoll(live, rolledUp(2 * deg), rolledUp(2 * deg), false)).toBeCloseTo(0, 10);
    });
});
