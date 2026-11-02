import { FisheyeCamera } from "../../../src/geometry/camera/FisheyeCamera";
import { SliderTransform } from "../../../src/component/slider/SliderTransform";

function slider(): SliderTransform {
    return new SliderTransform(1, 4000, 3000, 1, [0, 0, 0], [0, 0, 0],
                               undefined, undefined, [0.7, 0.01, 0.02], "fisheye");
}

describe("Fisheye exact optical-axis projection", () => {
    it("projects the positive optical axis to finite texture center at any distance", () => {
        const camera = new FisheyeCamera([0.7, 0.01, 0.02]);
        for (const z of [1, 50, 200]) {
            expect(camera.projectToSfm([0, 0, z])).toEqual([0, 0]);
        }
    });
    it("rejects non-forward optical-axis rays instead of painting the image center", () => {
        const camera = new FisheyeCamera([0.7, 0.01, 0.02]);
        for (const z of [0, -1]) {
            expect(camera.projectToSfm([0, 0, z])).toEqual([Infinity, Infinity]);
        }
    });
    it("preserves continuous near-axis projection", () => {
        const camera = new FisheyeCamera([0.7, 0.01, 0.02]);
        const projected = camera.projectToSfm([1e-10, -1e-10, 1]);
        expect(projected.every(Number.isFinite)).toBe(true);
        expect(Math.abs(projected[0])).toBeLessThan(1e-8);
        expect(Math.abs(projected[1])).toBeLessThan(1e-8);
    });
    it("projects the stationary slider optical axis without division by zero", () => {
        for (const z of [1, 50, 200]) {
            expect(slider().projectSfM([0, 0, z])).toEqual([0, 0]);
        }
    });
    it("keeps the stationary slider rear-ray guard", () => {
        expect(slider().projectSfM([0, 0, -1])).toEqual([Infinity, Infinity]);
    });
});
