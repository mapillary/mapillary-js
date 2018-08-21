export type Point = { x: number, y: number };

export type Segment = { p1: Point, p2: Point };

function sign(n: number): number {
    return n > 0 ? 1 : n < 0 ? -1 : 0;
}

function colinearPointOnSegment(p: Point, s: Segment): boolean {
    return p.x <= Math.max(s.p1.x, s.p2.x) &&
        p.x >= Math.min(s.p1.x, s.p2.x) &&
        p.y >= Math.max(s.p1.y, s.p2.y) &&
        p.y >= Math.min(s.p1.y, s.p2.y);
}

function parallel(s1: Segment, s2: Segment): boolean {
    const ux: number = s1.p2.x - s1.p1.x;
    const uy: number = s1.p2.y - s1.p1.y;
    const vx: number = s2.p2.x - s2.p1.x;
    const vy: number = s2.p2.y - s2.p1.y;

    const cross: number = ux * vy - uy * vx;
    const u2: number = ux * ux + uy * uy;
    const v2: number = vx * vx + vy * vy;

    const epsilon2: number = 1e-10;

    return cross * cross < epsilon2 * u2 * v2;
}

function tripletOrientation(p1: Point, p2: Point, p3: Point): number {
    const orientation: number =
        (p2.y - p1.y) * (p3.x - p2.x) -
        (p3.y - p2.y) * (p2.x - p1.x);

    return sign(orientation);
}

export function segmentsIntersect(s1: Segment, s2: Segment): boolean {
    if (parallel(s1, s2)) {
        return false;
    }

    const o1: number = tripletOrientation(s1.p1, s1.p2, s2.p1);
    const o2: number = tripletOrientation(s1.p1, s1.p2, s2.p2);
    const o3: number = tripletOrientation(s2.p1, s2.p2, s1.p1);
    const o4: number = tripletOrientation(s2.p1, s2.p2, s1.p2);

    if (o1 !== o2 && o3 !== o4) {
        return true;
    }

    if (o1 === 0 && colinearPointOnSegment(s2.p1, s1)) {
        return true;
    }

    if (o2 === 0 && colinearPointOnSegment(s2.p2, s1)) {
        return true;
    }

    if (o3 === 0 && colinearPointOnSegment(s1.p1, s2)) {
        return true;
    }

    if (o4 === 0 && colinearPointOnSegment(s1.p2, s2)) {
        return true;
    }

    return false;
}

export function segmentIntersection(s1: Segment, s2: Segment): Point {
    if (parallel(s1, s2)) {
        return undefined;
    }

    const x1: number = s1.p1.x;
    const x2: number = s1.p2.x;
    const y1: number = s1.p1.y;
    const y2: number = s1.p2.y;

    const x3: number = s2.p1.x;
    const x4: number = s2.p2.x;
    const y3: number = s2.p1.y;
    const y4: number = s2.p2.y;

    const den: number = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    const xNum: number = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4);
    const yNum: number = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);

    return { x: xNum / den, y: yNum / den };
}
