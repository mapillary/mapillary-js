import {TouchService} from "../../src/Viewer";

import {EventHelper} from "../helper/EventHelper.spec";

describe("TouchService.ctor", () => {
    it("should be definded", () => {
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");

        const touchService: TouchService = new TouchService(canvasContainer, domContainer);

        expect(touchService).toBeDefined();
    });
});

describe("TouchService.touchStart$", () => {
    it("should emit", () => {
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");

        const touchService: TouchService = new TouchService(canvasContainer, domContainer);

        let emitCount: number = 0;
        touchService.touchStart$
            .subscribe(
                (event: TouchEvent): void => {
                    emitCount++;
                    expect(event.type).toBe("touchstart");
                });

        expect(emitCount).toBe(0);

        canvasContainer.dispatchEvent(EventHelper.createTouchEvent("touchstart"));

        expect(emitCount).toBe(1);
    });
});

describe("TouchService.touchMove$", () => {
    it("should emit", () => {
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");

        const touchService: TouchService = new TouchService(canvasContainer, domContainer);

        let emitCount: number = 0;
        touchService.touchMove$
            .subscribe(
                (event: TouchEvent): void => {
                    emitCount++;
                    expect(event.type).toBe("touchmove");
                });

        expect(emitCount).toBe(0);

        canvasContainer.dispatchEvent(EventHelper.createTouchEvent("touchmove"));

        expect(emitCount).toBe(1);
    });
});

describe("TouchService.touchEnd$", () => {
    it("should emit", () => {
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");

        const touchService: TouchService = new TouchService(canvasContainer, domContainer);

        let emitCount: number = 0;
        touchService.touchEnd$
            .subscribe(
                (event: TouchEvent): void => {
                    emitCount++;
                    expect(event.type).toBe("touchend");
                });

        expect(emitCount).toBe(0);

        canvasContainer.dispatchEvent(EventHelper.createTouchEvent("touchend"));

        expect(emitCount).toBe(1);
    });
});

describe("TouchService.touchCancel$", () => {
    it("should emit", () => {
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");

        const touchService: TouchService = new TouchService(canvasContainer, domContainer);

        let emitCount: number = 0;
        touchService.touchCancel$
            .subscribe(
                (event: TouchEvent): void => {
                    emitCount++;
                    expect(event.type).toBe("touchcancel");
                });

        expect(emitCount).toBe(0);

        canvasContainer.dispatchEvent(EventHelper.createTouchEvent("touchcancel"));

        expect(emitCount).toBe(1);
    });
});
