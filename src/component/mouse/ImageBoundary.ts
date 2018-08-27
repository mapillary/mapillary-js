import * as THREE from "three";

import {
    Lines,
    Transform,
    ViewportCoords,
} from "../../../src/Geo";

function basicBoundaryPoints(pointsPerSide: number): number[][] {
    let points: number[][] = [];
    let os: number[][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
    let ds: number[][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];

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

function insideBasic(x: number, y: number): boolean {
    return x >= 0 && x <= 1 && y >= 0 && y <= 1;
}

export function viewportDistances(transform: Transform, perspective: THREE.PerspectiveCamera, viewportCoords: ViewportCoords): number[] {
    const boundaryPointsBasic: number[][] = basicBoundaryPoints(100);
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

    if (insideBasic(topLeftBasicX, topLeftBasicY)) {
        intersections[3] = intersections[0] = true;
    }

    if (insideBasic(topRightBasicX, topRightBasicY)) {
        intersections[0] = intersections[1] = true;
    }

    if (insideBasic(bottomRightBasicX, bottomRightBasicY)) {
        intersections[1] = intersections[2] = true;
    }

    if (insideBasic(bottomLeftBasicX, bottomLeftBasicY)) {
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
