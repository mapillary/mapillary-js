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

function tripletOrientation(p1: Point, p2: Point, p3: Point): number {
    const orientation: number =
        (p2.y - p1.y) * (p3.x - p2.x) -
        (p3.y - p2.y) * (p2.x - p1.x);

    return sign(orientation);
}

export function segmentsIntersect(s1: Segment, s2: Segment): boolean {
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
