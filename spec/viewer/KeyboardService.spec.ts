import {KeyboardService} from "../../src/Viewer";

import {EventHelper} from "../helper/EventHelper.spec";

describe("KeyboardService.ctor", () => {
    it("should be definded", () => {
        const canvasContainer: HTMLElement = document.createElement("div");

        const keyboardService: KeyboardService = new KeyboardService(canvasContainer);

        expect(keyboardService).toBeDefined();
    });
});

describe("KeyboardService.keyDown$", () => {
    it("should emit", (done: Function) => {
        const canvasContainer: HTMLElement = document.createElement("div");

        const keyboardService: KeyboardService = new KeyboardService(canvasContainer);

        keyboardService.keyDown$
            .subscribe(
                (event: KeyboardEvent): void => {
                    expect(event).toBeDefined();
                    expect(event.type).toBe("keydown");
                    expect(event.key).toBe("+");

                    done();
                });

        const keyboardEvent: KeyboardEvent = EventHelper.createKeyboardEvent("keydown", { key: "+" });
        canvasContainer.dispatchEvent(keyboardEvent);
    });
});

describe("KeyboardService.keyUp$", () => {
    it("should emit", (done: Function) => {
        const canvasContainer: HTMLElement = document.createElement("div");

        const keyboardService: KeyboardService = new KeyboardService(canvasContainer);

        keyboardService.keyUp$
            .subscribe(
                (event: KeyboardEvent): void => {
                    expect(event).toBeDefined();
                    expect(event.type).toBe("keyup");
                    expect(event.key).toBe("+");

                    done();
                });

        const keyboardEvent: KeyboardEvent = EventHelper.createKeyboardEvent("keyup", { key: "+" });
        canvasContainer.dispatchEvent(keyboardEvent);
    });
});
