import { formatZoomLevel } from "../../../src/component/zoom/ZoomComponent";

describe("zoom level label", () => {
    it("hides the unzoomed 1.0x view", () => {
        expect(formatZoomLevel(0)).toBe("");
        expect(formatZoomLevel(1e-8)).toBe("");
    });
    it("converts logarithmic SDK zoom to magnification", () => {
        expect(formatZoomLevel(1)).toBe("2.0×");
        expect(formatZoomLevel(2)).toBe("4.0×");
        expect(formatZoomLevel(3)).toBe("8.0×");
    });
    it("shows fractional zoom with one decimal", () => {
        expect(formatZoomLevel(Math.log2(1.5))).toBe("1.5×");
        expect(formatZoomLevel(Math.log2(2.75))).toBe("2.8×");
    });
    it("does not display invalid camera state", () => {
        expect(formatZoomLevel(NaN)).toBe("");
        expect(formatZoomLevel(Infinity)).toBe("");
    });
});
