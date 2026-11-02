import { stepZoom, zoomStops } from "../../src/state/ZoomSteps";

const scale = (zoom: number): number => Math.round(Math.pow(2, zoom) * 1000) / 1000;

describe("zoom stops", () => {
    it("splits each power-of-two step in half", () => {
        expect(zoomStops(0, 3).map(scale)).toEqual([1, 1.5, 2, 3, 4, 6, 8]);
    });

    it("zooms in one half step at a time", () => {
        let zoom = 0;
        const visited: number[] = [];
        for (let i = 0; i < 7; i++) {
            zoom = stepZoom(zoom, 1, 0, 3);
            visited.push(scale(zoom));
        }
        expect(visited).toEqual([1.5, 2, 3, 4, 6, 8, 8]);
    });

    it("zooms out through the same stops", () => {
        let zoom = 3;
        const visited: number[] = [];
        for (let i = 0; i < 7; i++) {
            zoom = stepZoom(zoom, -1, 0, 3);
            visited.push(scale(zoom));
        }
        expect(visited).toEqual([6, 4, 3, 2, 1.5, 1, 1]);
    });

    it("always takes a visible step after continuous zoom", () => {
        expect(scale(stepZoom(Math.log2(1.45), 1, 0, 3))).toBe(2);
        expect(scale(stepZoom(Math.log2(2.1), -1, 0, 3))).toBe(1.5);
        expect(scale(stepZoom(Math.log2(1.8), 1, 0, 3))).toBe(3);
    });

    it("supports multiple steps and clamps", () => {
        expect(scale(stepZoom(0, 2, 0, 3))).toBe(2);
        expect(scale(stepZoom(5, 1, 0, 3))).toBe(8);
        expect(scale(stepZoom(-1, -1, 0, 3))).toBe(1);
    });
});
