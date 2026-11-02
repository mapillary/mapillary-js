import * as THREE from "three";
import {
    perspectiveFillFov,
    perspectiveHorizonRow,
    perspectiveRollDeg,
    wouldAutoLevelPerspective,
} from "../../../src/component/reorientation/PerspectiveLevel";
import { shouldLevelPerspective } from "../../../src/component/reorientation/ReorientationComponent";
import { Transform } from "../../../src/geo/Transform";
import { ProjectionService } from "../../../src/viewer/ProjectionService";

function makeTransform(rotation: number[], parameters: number[] = [0.85, 0, 0],
    orientation: number = 1, width: number = 4000, height: number = 3000): Transform {
    const camera = new ProjectionService().makeCamera("perspective", parameters);
    return new Transform(orientation, width, height, 1, rotation, [0, 0, 0], null, camera);
}
/** Angle-axis world-to-camera rotation for a north-facing camera rolled by `rollDeg`. */
function rolled(rollDeg: number, pitchDeg: number = 0): number[] {
    // Camera axes (x right, y down, z forward) as rows, in world ENU.
    const level = new THREE.Matrix4().set(
        1, 0, 0, 0,
        0, 0, -1, 0,
        0, 1, 0, 0,
        0, 0, 0, 1);
    const pitch = new THREE.Matrix4().makeRotationX(pitchDeg * Math.PI / 180);
    const roll = new THREE.Matrix4().makeRotationZ(rollDeg * Math.PI / 180);
    const q = new THREE.Quaternion().setFromRotationMatrix(roll.multiply(pitch).multiply(level));
    const angle = 2 * Math.acos(Math.min(1, Math.abs(q.w)));
    const s = Math.sqrt(Math.max(1e-12, 1 - q.w * q.w)) * Math.sign(q.w || 1);
    return angle < 1e-9 ? [0, 0, 0] : [q.x / s * angle, q.y / s * angle, q.z / s * angle];
}

describe("Shared perspective levelling decision", () => {
    it("keeps the ordinary viewer's roll range", () => {
        expect(shouldLevelPerspective(6)).toBe(false);
        expect(shouldLevelPerspective(8)).toBe(true);
        expect(shouldLevelPerspective(46)).toBe(false);
    });
    it("measures roll and horizon on a synthetic camera", () => {
        const t = makeTransform(rolled(10));
        const horizon = perspectiveHorizonRow(t, 0.5);
        expect(horizon).toBeCloseTo(0.5, 3);
        expect(perspectiveRollDeg(t, [0.5, horizon])).toBeCloseTo(10, 1);
    });
    it("levels a moderately tilted photo the viewer can fit", () => {
        expect(wouldAutoLevelPerspective(makeTransform(rolled(10)), 1.6)).toBe(true);
    });
    it("does not level a nearly upright photo", () => {
        expect(wouldAutoLevelPerspective(makeTransform(rolled(3)), 1.6)).toBe(false);
    });
    it("does not level the reported Time Travel comparison (implausible 38 deg roll)", () => {
        // Image 1213889739636709: upright phone photo, separate reconstruction.
        const t = makeTransform(
            [-1.2223267744317, 1.2079613891934, 0.1647357955055],
            [0.73551162611046, -0.0015303224124321, -0.018730651694032], 3, 4032, 3024);
        const horizon = perspectiveHorizonRow(t, 0.5);
        expect(horizon).not.toBeNull();
        expect(perspectiveRollDeg(t, [0.5, horizon])).toBeGreaterThan(30);
        expect(wouldAutoLevelPerspective(t, 1440 / 900)).toBe(false);
    });
    it("computes the fill field of view of an undistorted photo", () => {
        const t = makeTransform(rolled(0));
        // Width-limited at a wider viewport: horizontal half-tangent 0.5 / 0.85.
        const expected = 0.995 * 2 * Math.atan(0.5 / 0.85 / 1.6) * 180 / Math.PI;
        expect(perspectiveFillFov(t, 1.6)).toBeCloseTo(expected, 1);
    });
});
