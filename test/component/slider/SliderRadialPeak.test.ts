import { SliderTransform } from "../../../src/component/slider/SliderTransform";

function slider(cameraParameters: number[]): SliderTransform {
    return new SliderTransform(1, 4000, 3000, 1, [0, 0, 0], [0, 0, 0],
                               undefined, undefined, cameraParameters, "perspective");
}

describe("SliderTransform radial peak", () => {
    it("is finite for negative k1 when k2 is zero", () => {
        expect(slider([0.85, -0.2, 0]).radialPeak).toBeCloseTo(Math.sqrt(1 / 0.6), 10);
        expect(slider([0.85, -0.2]).radialPeak).toBeCloseTo(Math.sqrt(1 / 0.6), 10);
    });

    it("stays undefined when distortion does not peak", () => {
        expect(slider([0.85, 0.1, 0]).radialPeak).toBeUndefined();
        expect(slider([0.85, 0, 0]).radialPeak).toBeUndefined();
    });

    it("does not fold points outside the peak back into the image", () => {
        const angle = 63 * Math.PI / 180;
        const sfm = slider([0.85, -0.2, 0])
            .projectSfM([Math.sin(angle), 0, Math.cos(angle)]);
        expect(sfm[0]).toBeCloseTo(0.85 * Math.tan(angle) * 2 / 3, 6);
    });
});
