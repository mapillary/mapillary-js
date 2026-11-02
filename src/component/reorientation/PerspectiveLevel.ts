import * as THREE from "three";
import { computeBearings } from "../../geo/Geo";
import { Spatial } from "../../geo/Spatial";
import { Transform } from "../../geo/Transform";
import { ViewportCoords } from "../../geo/ViewportCoords";

/**
 * Automatic horizon levelling decision for perspective images, shared by the
 * ordinary viewer (ReorientationComponent) and Time Travel comparisons
 * (SliderGLRenderer), so both level exactly the same photos.
 */

export const MAX_HORIZON_CORRECTION_DEG = 75;
export const MAX_REORIENTATION_ROLL_DEG = 45;
export const MIN_PERSPECTIVE_LEVEL_ROLL_DEG = 7;
export const MAX_PERSPECTIVE_AUTO_ZOOM = 0.75;
export const MAX_PERSPECTIVE_FOV = 125;
export const PERSPECTIVE_EDGE_MARGIN = 1e-3;

/**
 * Small perspective corrections are indistinguishable from a tilted SfM frame
 * without an independent gravity signal, so the raw camera frame is safer.
 */
export function shouldLevelPerspective(rollDeg: number): boolean {
    return Number.isFinite(rollDeg) &&
        rollDeg >= MIN_PERSPECTIVE_LEVEL_ROLL_DEG &&
        rollDeg <= MAX_REORIENTATION_ROLL_DEG;
}

/** Basic row of the reconstructed horizon in column `x`, or null. */
export function perspectiveHorizonRow(transform: Transform, x: number): number | null {
    if (transform == null) {
        return null;
    }

    const cameraZ = transform.unprojectSfM([0, 0], 0)[2];
    let low = 0;
    let high = 1;
    let lowZ = transform.unprojectBasic([x, low], 10)[2] - cameraZ;
    const highZ = transform.unprojectBasic([x, high], 10)[2] - cameraZ;
    if (lowZ * highZ > 0) {
        return null;
    }

    for (let i = 0; i < 32; i++) {
        const middle = (low + high) / 2;
        const middleZ =
            transform.unprojectBasic([x, middle], 10)[2] - cameraZ;
        if (lowZ * middleZ > 0) {
            low = middle;
            lowZ = middleZ;
        } else {
            high = middle;
        }
    }

    const horizon = (low + high) / 2;
    return Math.abs(horizon - 0.5) * 180 <=
        MAX_HORIZON_CORRECTION_DEG ? horizon : null;
}

/** Unsigned roll, in degrees, between the image up and gravity at `center`. */
export function perspectiveRollDeg(transform: Transform, center: number[]): number | null {
    if (transform == null) {
        return null;
    }
    const origin = new THREE.Vector3().fromArray(
        transform.unprojectSfM([0, 0], 0));
    const direction = new THREE.Vector3().fromArray(
        transform.unprojectBasic(center, 10))
        .sub(origin)
        .normalize();
    const imageUp = transform.upVector()
        .addScaledVector(direction, -transform.upVector().dot(direction))
        .normalize();
    const gravityUp = new THREE.Vector3(0, 0, 1)
        .addScaledVector(direction, -direction.z)
        .normalize();
    const rollDeg = imageUp.angleTo(gravityUp) * 180 / Math.PI;
    return Number.isFinite(rollDeg) ? rollDeg : null;
}

/**
 * Zoom (log2 of the field of view reduction from `baseFov`) needed so a
 * gravity-levelled view centered on `center` does not expose the photo's
 * boundary, or null when that exceeds the automatic zoom limit.
 */
export function perspectiveAutoZoom(
    transform: Transform,
    aspect: number,
    center: number[],
    baseFov: number,
    viewportCoords: ViewportCoords = new ViewportCoords()): number | null {
    if (transform == null || !(aspect > 0) || !Number.isFinite(aspect)) {
        return null;
    }

    const origin = new THREE.Vector3().fromArray(
        transform.unprojectSfM([0, 0], 0));
    const rollDeg = perspectiveRollDeg(transform, center);
    if (rollDeg == null ||
        rollDeg > MAX_REORIENTATION_ROLL_DEG) {
        return null;
    }

    const camera = new THREE.PerspectiveCamera(60, aspect, 1e-1, 1e4);
    camera.position.copy(origin);

    const maxFov = (basic: number[], up: THREE.Vector3): number => {
        camera.up.copy(up);
        camera.lookAt(new THREE.Vector3().fromArray(
            transform.unprojectBasic(basic, 10)));
        camera.updateMatrixWorld(true);

        const fits = (fov: number): boolean => {
            camera.fov = fov;
            camera.updateProjectionMatrix();
            const corners = [
                viewportCoords.viewportToBasic(-1, 1, transform, camera),
                viewportCoords.viewportToBasic(1, 1, transform, camera),
                viewportCoords.viewportToBasic(1, -1, transform, camera),
                viewportCoords.viewportToBasic(-1, -1, transform, camera),
            ];
            return corners.every((point: number[]): boolean =>
                point != null &&
                point[0] >= PERSPECTIVE_EDGE_MARGIN &&
                point[0] <= 1 - PERSPECTIVE_EDGE_MARGIN &&
                point[1] >= PERSPECTIVE_EDGE_MARGIN &&
                point[1] <= 1 - PERSPECTIVE_EDGE_MARGIN);
        };

        let low = 0;
        let high = MAX_PERSPECTIVE_FOV;
        for (let i = 0; i < 16; i++) {
            const middle = (low + high) / 2;
            if (fits(middle)) {
                low = middle;
            } else {
                high = middle;
            }
        }
        return low;
    };

    const levelFov = maxFov(center, new THREE.Vector3(0, 0, 1));
    const zoom = Math.max(0, Math.log(baseFov / levelFov) / Math.log(2));
    return Number.isFinite(zoom) && zoom <= MAX_PERSPECTIVE_AUTO_ZOOM ?
        zoom : null;
}

/**
 * Unzoomed vertical field of view the viewer uses for a perspective image in
 * fill render mode (RenderCamera's fill computation).
 */
export function perspectiveFillFov(
    transform: Transform,
    aspect: number,
    viewportCoords: ViewportCoords = new ViewportCoords()): number {
    const spatial = new Spatial();
    const y = computeBearings(transform, [[0, 0]], [[1, 0]], 25, viewportCoords)
        .map(b => spatial.projectToPlane(b, [1, 0, 0]))
        .map(p => 2 * spatial.radToDeg(Math.abs(Math.atan2(p[1], -p[2]))));
    const x = computeBearings(transform, [[0, 0]], [[0, 1]], 25, viewportCoords)
        .map(b => spatial.projectToPlane(b, [0, 1, 0]))
        .map(p => 2 * spatial.radToDeg(Math.abs(Math.atan2(p[0] / aspect, -p[2]))));
    const fovs = [...y, ...x];
    const vFovMin = fovs.length > 0 ? 0.995 * Math.min(...fovs) : MAX_PERSPECTIVE_FOV;
    return Math.min(vFovMin, MAX_PERSPECTIVE_FOV);
}

/**
 * Whether the ordinary viewer's automatic horizon levelling would level this
 * perspective image when it is opened fresh (center column, unzoomed) in a
 * viewport of `aspect`. Sequence continuity checks are not included: they
 * need the neighbouring captures the viewer walked through.
 */
export function wouldAutoLevelPerspective(
    transform: Transform,
    aspect: number,
    viewportCoords: ViewportCoords = new ViewportCoords()): boolean {
    try {
        const horizon = perspectiveHorizonRow(transform, 0.5);
        if (horizon == null) {
            return false;
        }
        const center = [0.5, horizon];
        if (!shouldLevelPerspective(perspectiveRollDeg(transform, center))) {
            return false;
        }
        const baseFov = perspectiveFillFov(transform, aspect, viewportCoords);
        return perspectiveAutoZoom(transform, aspect, center, baseFov, viewportCoords) != null;
    } catch (_) {
        return false;
    }
}
