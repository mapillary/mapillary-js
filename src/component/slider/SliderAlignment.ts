import * as THREE from "three";
import { Image } from "../../graph/Image";
import { Transform } from "../../geo/Transform";
import { isSpherical } from "../../geo/Geo";
import { hasReconstructionMesh } from "../../util/Mesh";

/** Match the ordinary viewer's refusal to level an uncalibrated panorama. */
export function canLevelSliderImage(image: Image, transform: Transform): boolean {
    if (!hasReconstructionMesh(image.mesh)) {
        return false;
    }
    const cameraUp = transform.upVector().normalize();
    const forward = new THREE.Vector3().fromArray(transform.unprojectBasic([0.5, 0.5], 10))
        .sub(new THREE.Vector3().fromArray(transform.unprojectBasic([0.5, 0.5], 0)))
        .normalize();
    const imageUp = cameraUp.clone().addScaledVector(forward, -cameraUp.dot(forward)).normalize();
    const gravityUp = new THREE.Vector3(0, 0, 1).addScaledVector(forward, -forward.z).normalize();
    const roll = imageUp.angleTo(gravityUp) * 180 / Math.PI;
    const pitch = Math.asin(Math.max(-1, Math.min(1, forward.z))) * 180 / Math.PI;
    return Number.isFinite(roll) && Number.isFinite(pitch) &&
        Math.abs(pitch) <= 75 && roll <= 45 &&
        (isSpherical(image.cameraType) || roll >= 7);
}
