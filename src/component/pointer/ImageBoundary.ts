import * as THREE from "three";

import * as Lines from "../../geo/Lines";
import { Transform } from "../../geo/Transform";
import { ViewportCoords } from "../../geo/ViewportCoords";
import { isSpherical } from "../../geo/Geo";
import { PointerViewBounds } from "../interfaces/PointerConfiguration";

/** Basic rectangle [minX, minY, maxX, maxY]; the default is the whole image. */
const IMAGE_BOUNDS: number[] = [0, 0, 1, 1];

function basicBoundaryPoints(pointsPerSide: number, bounds: number[] = IMAGE_BOUNDS): number[][] {
    let points: number[][] = [];
    const [x0, y0, x1, y1] = bounds;
    let os: number[][] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    let ds: number[][] = [[x1 - x0, 0], [0, y1 - y0], [x0 - x1, 0], [0, y0 - y1]];

    for (let side: number = 0; side < 4; ++side) {
        let o: number[] = os[side];
        let d: number[] = ds[side];

        for (let i: number = 0; i < pointsPerSide; ++i) {
            points.push([o[0] + d[0] * i / pointsPerSide,
            o[1] + d[1] * i / pointsPerSide]);
        }
    }

    return points;
}

function insideViewport(x: number, y: number): boolean {
    return x >= -1 && x <= 1 && y >= -1 && y <= 1;
}

function insideBasic(x: number, y: number, bounds: number[]): boolean {
    return x >= bounds[0] && x <= bounds[2] && y >= bounds[1] && y <= bounds[3];
}

/** Unwrap a panorama's basic X to the copy nearest `reference` (bounds may cross the seam). */
function unwrapX(x: number, reference: number, spherical: boolean): number {
    return spherical ? x + Math.round(reference - x) : x;
}

/**
 * Basic rectangle of the current image inscribed in a view window: a
 * perspective frustum from the render camera's position and up vector,
 * looking at `bounds.center` (basic) with vertical `bounds.fieldOfView`
 * (degrees) at the viewport's aspect. Regular images are also limited to
 * their edges. Returns null when the window cannot be resolved, so callers
 * fall back to the image edges.
 */
export function viewBoundsBasic(
    transform: Transform,
    perspective: THREE.PerspectiveCamera,
    bounds: PointerViewBounds | null | undefined): number[] | null {
    if (!bounds || !bounds.center || bounds.center.length !== 2 ||
        !bounds.center.every(Number.isFinite) || !Number.isFinite(bounds.fieldOfView) ||
        bounds.fieldOfView <= 0 || bounds.fieldOfView >= 180 ||
        !Number.isFinite(perspective.aspect) || perspective.aspect <= 0) {
        return null;
    }
    const spherical = isSpherical(transform.cameraType);
    const frustum = new THREE.PerspectiveCamera(bounds.fieldOfView, perspective.aspect, 0.1, 1000);
    frustum.position.copy(perspective.position);
    frustum.up.copy(perspective.up);
    frustum.lookAt(new THREE.Vector3().fromArray(transform.unprojectBasic(bounds.center, 10)));
    frustum.updateMatrixWorld(true);
    frustum.updateProjectionMatrix();
    const samples = 16;
    // Inscribed rectangle: the most restrictive sample on each side.
    // Basic Y grows downwards, so the window's top edge limits minY.
    const limits: number[] = [-Infinity, -Infinity, Infinity, Infinity];
    const point = new THREE.Vector3();
    for (let i = 0; i <= samples; i++) {
        const t = -1 + 2 * i / samples;
        const sides: number[][] = [[-1, t], [t, 1], [1, t], [t, -1]];
        for (let side = 0; side < 4; side++) {
            point.set(sides[side][0], sides[side][1], 0.5).unproject(frustum);
            const direction = point.sub(frustum.position).normalize().multiplyScalar(10);
            const basic = transform.projectBasic(frustum.position.clone().add(direction).toArray());
            if (!basic || !basic.every(Number.isFinite)) {
                return null;
            }
            const x = unwrapX(basic[0], bounds.center[0], spherical);
            const y = basic[1];
            if (side === 0) { limits[0] = Math.max(limits[0], x); }
            if (side === 1) { limits[1] = Math.max(limits[1], y); }
            if (side === 2) { limits[2] = Math.min(limits[2], x); }
            if (side === 3) { limits[3] = Math.min(limits[3], y); }
        }
    }
    const rect = spherical ?
        [limits[0], Math.max(0, limits[1]), limits[2], Math.min(1, limits[3])] :
        [Math.max(0, limits[0]), Math.max(0, limits[1]), Math.min(1, limits[2]), Math.min(1, limits[3])];
    if (!rect.every(Number.isFinite) || rect[0] >= rect[2] || rect[1] >= rect[3] ||
        rect[2] - rect[0] > 1) {
        return null;
    }
    return rect;
}

/**
 * How far the viewport extends past the image edges, or past `bounds`
 * (a basic rectangle from `viewBoundsBasic`), in viewport units:
 * [top, right, bottom, left].
 */
export function viewportDistances(
    transform: Transform,
    perspective: THREE.PerspectiveCamera,
    viewportCoords: ViewportCoords,
    bounds: number[] = IMAGE_BOUNDS): number[] {
    const spherical = bounds !== IMAGE_BOUNDS && isSpherical(transform.cameraType);
    const centerX = (bounds[0] + bounds[2]) / 2;
    const boundaryPointsBasic: number[][] = basicBoundaryPoints(100, bounds);
    const boundaryPointsViewport: number[][] = boundaryPointsBasic
        .map(
            (basic: number[]) => {
                return viewportCoords.basicToViewportSafe(basic[0], basic[1], transform, perspective);
            });

    const visibleBoundaryPoints: number[][] = [];
    const viewportSides: Lines.Point[] = [
        { x: -1, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: -1 },
        { x: -1, y: -1 }];

    const intersections: boolean[] = [false, false, false, false];

    for (let i: number = 0; i < boundaryPointsViewport.length; i++) {
        const p1: number[] = boundaryPointsViewport[i];
        const p2: number[] = boundaryPointsViewport[(i + 1) % boundaryPointsViewport.length];

        if (p1 === null) {
            continue;
        }

        if (p2 === null) {
            if (insideViewport(p1[0], p1[1])) {
                visibleBoundaryPoints.push(p1);
            }

            continue;
        }

        const [x1, y1]: number[] = p1;
        const [x2, y2]: number[] = p2;

        if (insideViewport(x1, y1)) {
            if (insideViewport(x2, y2)) {
                visibleBoundaryPoints.push(p1);
            } else {
                for (let side: number = 0; side < 4; side++) {
                    const s1: Lines.Segment = { p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 } };
                    const s2: Lines.Segment = { p1: viewportSides[side], p2: viewportSides[(side + 1) % 4] };

                    const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

                    if (intersecting) {
                        const intersection: Lines.Point = Lines.segmentIntersection(s1, s2);

                        visibleBoundaryPoints.push(p1, [intersection.x, intersection.y]);
                        intersections[side] = true;
                    }
                }
            }
        }
    }

    const [topLeftBasicX, topLeftBasicY]: number[] =
        viewportCoords.viewportToBasic(-1, 1, transform, perspective);

    const [topRightBasicX, topRightBasicY]: number[] =
        viewportCoords.viewportToBasic(1, 1, transform, perspective);

    const [bottomRightBasicX, bottomRightBasicY]: number[] =
        viewportCoords.viewportToBasic(1, -1, transform, perspective);

    const [bottomLeftBasicX, bottomLeftBasicY]: number[] =
        viewportCoords.viewportToBasic(-1, -1, transform, perspective);

    if (insideBasic(unwrapX(topLeftBasicX, centerX, spherical), topLeftBasicY, bounds)) {
        intersections[3] = intersections[0] = true;
    }

    if (insideBasic(unwrapX(topRightBasicX, centerX, spherical), topRightBasicY, bounds)) {
        intersections[0] = intersections[1] = true;
    }

    if (insideBasic(unwrapX(bottomRightBasicX, centerX, spherical), bottomRightBasicY, bounds)) {
        intersections[1] = intersections[2] = true;
    }

    if (insideBasic(unwrapX(bottomLeftBasicX, centerX, spherical), bottomLeftBasicY, bounds)) {
        intersections[2] = intersections[3] = true;
    }

    const maximums: number[] = [-1, -1, 1, 1];

    for (let visibleBoundaryPoint of visibleBoundaryPoints) {
        const x: number = visibleBoundaryPoint[0];
        const y: number = visibleBoundaryPoint[1];

        if (x > maximums[1]) {
            maximums[1] = x;
        }

        if (x < maximums[3]) {
            maximums[3] = x;
        }

        if (y > maximums[0]) {
            maximums[0] = y;
        }

        if (y < maximums[2]) {
            maximums[2] = y;
        }
    }

    const boundary: number[] = [1, 1, -1, -1];
    const distances: number[] = [];

    for (let side: number = 0; side < 4; side++) {
        if (intersections[side]) {
            distances.push(0);
            continue;
        }

        distances.push(Math.abs(boundary[side] - maximums[side]));
    }

    return distances;
}
