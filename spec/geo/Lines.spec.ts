import {Lines} from "../../src/Geo";

describe("Lines.segmentsIntersect", () => {
    // No intersection
    it("should not intersect when not overlapping but would have if lines", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 0, y: 1 } };
        const s2: Lines.Segment = { p1: { x: 1, y: 2 }, p2: { x: 2, y: 1 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(false);
    });

    // Inersection in all directions
    it("should intersect when orthogonal left to right", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } };
        const s2: Lines.Segment = { p1: { x: 0, y: 1 }, p2: { x: 1, y: 0 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(true);
    });

    it("should intersect when orthogonal left to right", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 1 }, p2: { x: 1, y: 0 } };
        const s2: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(true);
    });

    it("should intersect when orthogonal from right to left", () => {
        const s1: Lines.Segment = { p1: { x: 1, y: 0 }, p2: { x: 0, y: 1 } };
        const s2: Lines.Segment = { p1: { x: 1, y: 1 }, p2: { x: 0, y: 0 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(true);
    });

    it("should intersect when orthogonal from right to left", () => {
        const s1: Lines.Segment = { p1: { x: 1, y: 1 }, p2: { x: 0, y: 0 } };
        const s2: Lines.Segment = { p1: { x: 1, y: 0 }, p2: { x: 0, y: 1 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(true);
    });

    it("should intersect when orthogonal and different directions", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } };
        const s2: Lines.Segment = { p1: { x: 1, y: 0 }, p2: { x: 0, y: 1 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(true);
    });

    it("should intersect when orthogonal and different directions", () => {
        const s1: Lines.Segment = { p1: { x: 1, y: 1 }, p2: { x: 0, y: 0 } };
        const s2: Lines.Segment = { p1: { x: 0, y: 1 }, p2: { x: 1, y: 0 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(true);
    });

    // No intersection when parallel
    it("should not intersect when parallel and not overlapping", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } };
        const s2: Lines.Segment = { p1: { x: 0, y: 1 }, p2: { x: 1, y: 1 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(false);
    });

    it("should not intersect when parallel, colinear and not overlapping", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } };
        const s2: Lines.Segment = { p1: { x: 2, y: 0 }, p2: { x: 3, y: 0 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(false);
    });

    // Intersection when parallel and overlapping
    it("should not intersect when parallel and overlapping", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
        const s2: Lines.Segment = { p1: { x: 1, y: 0 }, p2: { x: 3, y: 0 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(false);
    });

    // Intersection when endpoint colinear
    it("should intersect when colinear at endpoint", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 1 }, p2: { x: 2, y: 1 } };
        const s2: Lines.Segment = { p1: { x: 1, y: 0 }, p2: { x: 1, y: 1 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(true);
    });

    it("should intersect when colinear at startpoint", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
        const s2: Lines.Segment = { p1: { x: 1, y: 1 }, p2: { x: 1, y: 0 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(true);
    });

    it("should intersect when start points intersect", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } };
        const s2: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 0, y: 1 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(true);
    });

    it("should intersect when end points intersect", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } };
        const s2: Lines.Segment = { p1: { x: 1, y: 1 }, p2: { x: 1, y: 0 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(true);
    });

    // Almost parallel up to numerical issues
    it("should not intersect when almost parallel", () => {
        const s1: Lines.Segment = { p1: { x: 1, y: 0 }, p2: { x: 1 + 1e-6, y: 1 } };
        const s2: Lines.Segment = { p1: { x: 1, y: 0 }, p2: { x: 1, y: 1 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(false);
    });

    it("should intersect when not really parallel", () => {
        const s1: Lines.Segment = { p1: { x: 1, y: 0 }, p2: { x: 1 + 1e-4, y: 1 } };
        const s2: Lines.Segment = { p1: { x: 1, y: 0 }, p2: { x: 1, y: 1 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(true);
    });
});

describe("Lines.segmentIntersection", () => {
    it("should have correct intersection when left to right", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } };
        const s2: Lines.Segment = { p1: { x: 0, y: 1 }, p2: { x: 1, y: 0 } };

        const intersection: Lines.Point = Lines.segmentIntersection(s1, s2);

        expect(intersection.x).toBe(0.5);
        expect(intersection.y).toBe(0.5);
    });

    it("should have correct intersection when right to left", () => {
        const s1: Lines.Segment = { p1: { x: 1, y: 0 }, p2: { x: 0, y: 1 } };
        const s2: Lines.Segment = { p1: { x: 1, y: 1 }, p2: { x: 0, y: 0 } };

        const intersection: Lines.Point = Lines.segmentIntersection(s1, s2);

        expect(intersection.x).toBe(0.5);
        expect(intersection.y).toBe(0.5);
    });

    it("should have no intersection when parallel", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } };
        const s2: Lines.Segment = { p1: { x: 0, y: 1 }, p2: { x: 1, y: 1 } };

        const intersection: Lines.Point = Lines.segmentIntersection(s1, s2);

        expect(intersection).toBeUndefined();
    });

    it("should have no intersection when parallel and overlapping", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
        const s2: Lines.Segment = { p1: { x: 1, y: 0 }, p2: { x: 3, y: 0 } };

        const intersection: Lines.Point = Lines.segmentIntersection(s1, s2);

        expect(intersection).toBeUndefined();
    });

    it("should have no intersection when almost parallel ", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } };
        const s2: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1e-12 } };

        const intersection: Lines.Point = Lines.segmentIntersection(s1, s2);

        expect(intersection).toBeUndefined();
    });
});
