import * as THREE from "three";
import { isSpherical } from "../../geo/Geo";
import { Image } from "../../graph/Image";

/** Align upright panorama frames by heading without trusting reconstructed roll/pitch. */
export function sliderHeadingRotation(current: Image, previous: Image): THREE.Quaternion {
    const rotation = new THREE.Quaternion();
    if (current == null || previous == null ||
        !isSpherical(current.cameraType) || !isSpherical(previous.cameraType) ||
        !Number.isFinite(current.compassAngle) || !Number.isFinite(previous.compassAngle)) {
        return rotation;
    }
    // Compass bearings are clockwise; local camera yaw around +Y is the inverse.
    // A comparison facing north must look south to match a south-facing original.
    const heading = ((previous.compassAngle - current.compassAngle) % 360) * Math.PI / 180;
    return rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), heading);
}
