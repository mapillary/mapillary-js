/// <reference path="../../../typings/index.d.ts" />

import {Popup} from "../../../src/Component";
import {ViewportCoords} from "../../../src/Geo";
import {RenderCamera} from "../../../src/Render";
import {Alignment} from "../../../src/Viewer";

describe("Popup.ctor", () => {
    it("should be defined", () => {
        const popup: Popup = new Popup();

        expect(popup).toBeDefined();
    });
});

describe("Popup.changed$", () => {
    it("should notify change", (done: Function) => {
        const popup: Popup = new Popup();

        popup.changed$
            .take(5)
            .subscribe(
                (p: Popup): void => { expect(p).toBe(popup); },
                undefined,
                (): void => { done(); });

        popup.setBasicPoint([0.5, 0.5]);
        popup.setBasicRect([0.5, 0.5]);
        popup.setDOMContent(document.createElement("div"));
        popup.setHTML("<div></div");
        popup.setText("text");
    });
});

describe("Popup.update", () => {
    it("should add a .mapillaryjs-popup element", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup(undefined, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        expect(parentContainer.querySelectorAll(".mapillaryjs-popup").length).toBe(1);
    });

    it("should translate to pixel value calculated from basic value", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([40, 60]);

        const popup: Popup = new Popup({ float: Alignment.Center }, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.4, 0.6]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        const transform: string = (<HTMLElement>parentContainer.querySelector(".mapillaryjs-popup")).style.transform;

        expect(/translate\(40px,\s?60px\)/.test(transform)).toBe(true);
    });

    it("should translate to pixel value calculated from basic when position is center for rect", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([40, 60]);

        const popup: Popup = new Popup({ position: Alignment.Center }, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicRect([0.3, 0.5, 0.5, 0.7]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        const transform: string = (<HTMLElement>parentContainer.querySelector(".mapillaryjs-popup")).style.transform;

        expect(/translate\(40px,\s?60px\)/.test(transform)).toBe(true);
    });

    it("should be visible if in front of camera", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([40, 60]);

        const popup: Popup = new Popup({ float: Alignment.Center }, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.4, 0.6]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        const visibility: string = (<HTMLElement>parentContainer.querySelector(".mapillaryjs-popup")).style.visibility;

        expect(visibility).toBe("visible");
    });

    it("should not be visible if behind camera", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue(null);

        const popup: Popup = new Popup({ float: Alignment.Center }, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.4, 0.6]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        const visibility: string = (<HTMLElement>parentContainer.querySelector(".mapillaryjs-popup")).style.visibility;

        expect(visibility).toBe("hidden");
    });

    it("should float to bottom when float is automatic", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup(undefined, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        expect(parentContainer.querySelectorAll(".mapillaryjs-popup-float-bottom").length)
            .toBe(1);
    });
});

describe("Popup.setText", () => {
    it("should set content", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup(undefined, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        expect(parentContainer.querySelector(".mapillaryjs-popup-content").textContent).toBe("Test");
    });

    it("should protect against XSS", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup(undefined, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);
        popup.setText("<script>alert('XSS')</script>");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        expect(parentContainer.querySelector(".mapillaryjs-popup-content").textContent)
            .toBe("<script>alert('XSS')</script>");
    });
});

describe("Popup.setHTML", () => {
    it("should set content", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup(undefined, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);
        popup.setHTML("<span>Test</span>");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        expect(parentContainer.querySelector(".mapillaryjs-popup-content").innerHTML)
            .toBe("<span>Test</span>");
    });
});

describe("Popup.setDOMContent", () => {
    it("should set content", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup(undefined, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);

        const content: HTMLSpanElement = document.createElement("span");
        popup.setDOMContent(content);

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        expect(parentContainer.querySelector(".mapillaryjs-popup-content").firstChild)
            .toEqual(content);
    });

    it("should overwrite previous content", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup(undefined, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);

        popup.setText("Test 1");
        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);
        expect(parentContainer.querySelector(".mapillaryjs-popup-content").textContent)
            .toBe("Test 1");

        popup.setHTML("Test 2");
        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);
        expect(parentContainer.querySelector(".mapillaryjs-popup-content").textContent)
            .toBe("Test 2");

        popup.setDOMContent(document.createTextNode("Test 3"));
        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);
        expect(parentContainer.querySelector(".mapillaryjs-popup-content").textContent)
            .toBe("Test 3");
    });
});

describe("Popup.float", () => {
    it("should float as specified by the float option", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup({ float: Alignment.TopLeft }, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        expect(parentContainer.querySelectorAll(".mapillaryjs-popup-float-top-left").length)
            .toBe(1);
    });

    it("should not have a tip if floating to center", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup({ float: Alignment.Center }, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        expect(parentContainer.querySelectorAll(".mapillaryjs-popup-tip").length).toBe(0);
    });

    it("should have a tip if not floating to center", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup({ float: Alignment.Bottom }, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        expect(parentContainer.querySelectorAll(".mapillaryjs-popup-tip").length).toBe(1);
    });

    it("should float in direction of position for rect", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup({ position: Alignment.BottomRight }, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicRect([0.5, 0.5]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        expect(parentContainer.querySelectorAll(".mapillaryjs-popup-float-bottom-right").length)
            .toBe(1);
    });
});

describe("Popup.opacity", () => {
    it("should have opacity as specified by the opacity option", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup({ opacity: 0.5 }, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        const opacity: string = (<HTMLElement>parentContainer.querySelector(".mapillaryjs-popup"))
            .style.opacity;

        expect(opacity).toBe("0.5");
    });
});

describe("Popup.offset", () => {
    it("should offset in the float direction", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([40, 60]);

        const popup: Popup = new Popup({ offset: 12, float: Alignment.Right }, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.4, 0.6]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        const transform: string = (<HTMLElement>parentContainer.querySelector(".mapillaryjs-popup")).style.transform;

        expect(/translate\(52px,\s?60px\)/.test(transform)).toBe(true);
    });
});

describe("Popup.clean", () => {
    it("should be clean if specified by clean option", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup({ clean: true }, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        expect(parentContainer.querySelectorAll(".mapillaryjs-popup-content-clean").length).toBe(1);
        expect(parentContainer.querySelectorAll(".mapillaryjs-popup-content").length).toBe(0);
    });

    it("should not be clean if not specified by clean option", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup({}, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        expect(parentContainer.querySelectorAll(".mapillaryjs-popup-content-clean").length).toBe(0);
        expect(parentContainer.querySelectorAll(".mapillaryjs-popup-content").length).toBe(1);
    });

    it("should not have a tip if clean", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup({ clean: true }, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        expect(parentContainer.querySelectorAll(".mapillaryjs-popup-tip").length).toBe(0);
    });

    it("should have a tip if not clean", () => {
        const viewportCoords: ViewportCoords = new ViewportCoords();
        spyOn(viewportCoords, "basicToCanvasSafe").and.returnValue([50, 50]);

        const popup: Popup = new Popup({ clean: false }, viewportCoords);

        const parentContainer: HTMLElement = document.createElement("div");
        popup.setParentContainer(parentContainer);
        popup.setBasicPoint([0.5, 0.5]);
        popup.setText("Test");

        popup.update(<RenderCamera>{}, { height: 100, width: 100}, undefined);

        expect(parentContainer.querySelectorAll(".mapillaryjs-popup-tip").length).toBe(1);
    });
});
