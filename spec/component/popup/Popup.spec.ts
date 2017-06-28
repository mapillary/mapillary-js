/// <reference path="../../../typings/index.d.ts" />

import {Popup} from "../../../src/Component";
import {ViewportCoords} from "../../../src/Geo";
import {RenderCamera} from "../../../src/Render";

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
