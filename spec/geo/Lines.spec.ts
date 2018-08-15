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
    it("should intersect when parallel and overlapping", () => {
        const s1: Lines.Segment = { p1: { x: 0, y: 0 }, p2: { x: 2, y: 0 } };
        const s2: Lines.Segment = { p1: { x: 1, y: 0 }, p2: { x: 3, y: 0 } };

        const intersecting: boolean = Lines.segmentsIntersect(s1, s2);

        expect(intersecting).toBe(true);
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
});
