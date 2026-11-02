import { NavigationDirection } from "../../../src/graph/edge/NavigationDirection";
import { settledViewX }
    from "../../../src/component/reorientation/ReorientationComponent";

describe("settledViewX", () => {
    it("uses the incoming bearing for a previous sequence step", () => {
        expect(settledViewX(
            NavigationDirection.Prev,
            104.328,
            336.612,
            0.8366)).toBeCloseTo(0.8548, 4);
    });

    it("uses the incoming bearing for a next sequence step", () => {
        expect(settledViewX(
            NavigationDirection.Next,
            12,
            300,
            0.25)).toBeCloseTo(0.7, 6);
    });

    it("keeps the sampled view for spatial navigation", () => {
        expect(settledViewX(
            NavigationDirection.StepForward,
            104.328,
            336.612,
            0.8366)).toBe(0.8366);
    });

    it("keeps the sampled view when no incoming bearing is available", () => {
        expect(settledViewX(
            NavigationDirection.Prev,
            NaN,
            336.612,
            0.8366)).toBe(0.8366);
    });
});
