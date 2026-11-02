import * as THREE from "three";

const MAX_ROLL_CORRECTION = Math.PI / 4;
const LEVEL_TOLERANCE = 0.5 * Math.PI / 180;
const MIN_PROJECTED_UP = 0.1;

function cameraSpace(camera: THREE.Camera, vector: THREE.Vector3): THREE.Vector3 {
    const rotation = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().extractRotation(camera.matrixWorld)).invert();
    return vector.clone().normalize().applyQuaternion(rotation);
}

/** Whether the rendered view's screen-up is the world gravity axis. */
export function sliderViewLeveled(camera: THREE.Camera): boolean {
    const gravity = cameraSpace(camera, new THREE.Vector3(0, 0, 1));
    const length = Math.hypot(gravity.x, gravity.y);
    return length >= MIN_PROJECTED_UP &&
        Math.abs(Math.atan2(gravity.x, gravity.y)) <= LEVEL_TOLERANCE;
}

/**
 * Roll, about the view axis, that keeps a view-aligned comparison upright the
 * same way as the original. Separate reconstructions often disagree on small
 * rolls; reprojecting through those poses tilts an upright photo. Show both
 * native frames upright unless the live view is gravity-leveled and the
 * comparison can be leveled too.
 */
export function sliderViewAlignedRoll(
    camera: THREE.Camera,
    currentUp: THREE.Vector3,
    previousUp: THREE.Vector3,
    previousLevel: boolean): number {
    if (currentUp == null || previousUp == null ||
        previousLevel && sliderViewLeveled(camera)) {
        return 0;
    }
    const current = cameraSpace(camera, currentUp);
    const previous = cameraSpace(camera, previousUp);
    if (Math.hypot(current.x, current.y) < MIN_PROJECTED_UP ||
        Math.hypot(previous.x, previous.y) < MIN_PROJECTED_UP) {
        return 0;
    }
    let roll = Math.atan2(previous.y, previous.x) - Math.atan2(current.y, current.x);
    roll = Math.atan2(Math.sin(roll), Math.cos(roll));
    return Number.isFinite(roll) && Math.abs(roll) <= MAX_ROLL_CORRECTION ? roll : 0;
}
