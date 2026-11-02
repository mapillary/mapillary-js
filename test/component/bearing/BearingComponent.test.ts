import * as vd from "virtual-dom";

import { createBearingContainer } from "../../../src/component/bearing/BearingComponent";

const COMPACT = "mapillary-bearing-compact";

describe("bearing container", () => {
    it("adds the compact class when the viewer shrinks", () => {
        const large = createBearingContainer(false, []);
        const element = <HTMLElement>vd.create(large);
        expect(element.classList.contains(COMPACT)).toBe(false);

        const compact = createBearingContainer(true, []);
        vd.patch(element, vd.diff(large, compact));
        expect(element.classList.contains(COMPACT)).toBe(true);
        expect(element.classList.contains("mapillary-bearing-indicator-container")).toBe(true);
    });

    it("removes the compact class when the viewer grows", () => {
        const compact = createBearingContainer(true, []);
        const element = <HTMLElement>vd.create(compact);
        expect(element.classList.contains(COMPACT)).toBe(true);

        const large = createBearingContainer(false, []);
        vd.patch(element, vd.diff(compact, large));
        expect(element.classList.contains(COMPACT)).toBe(false);
    });

    it("keeps the left bearing tooltip", () => {
        const element = <HTMLElement>vd.create(createBearingContainer(false, []));
        expect(element.getAttribute("data-mapillary-tooltip")).toBe("Bearing");
        expect(element.getAttribute("data-mapillary-tooltip-position")).toBe("left");
    });
});
