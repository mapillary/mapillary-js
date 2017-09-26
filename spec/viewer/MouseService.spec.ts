/// <reference path="../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";

import {MouseService} from "../../src/Viewer";

import {EventHelper} from "../helper/EventHelper.spec";

describe("MouseService.ctor", () => {
    it("should be definded", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        expect(mouseService).toBeDefined();
    });
});

describe("MouseService.mouseDragStart$", () => {
    it("should emit mouse drag start", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let mouseDragStartEmitCount: number = 0;
        mouseService.mouseDragStart$
            .subscribe(
                (event: MouseEvent): void => {
                    mouseDragStartEmitCount++;
                    expect(event.button === 0);
                    expect(event.type === "mousedown");
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, canvasContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, document);

        doc.dispatchEvent(mouseMoveEvent);
        expect(mouseDragStartEmitCount).toBe(0);

        canvasContainer.dispatchEvent(mouseDownEvent);

        doc.dispatchEvent(mouseMoveEvent);
        expect(mouseDragStartEmitCount).toBe(1);
    });

    it("should not emit mouse drag start when not left button", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let mouseDragStartEmitCount: number = 0;
        mouseService.mouseDragStart$
            .subscribe(
                (event: MouseEvent): void => {
                    mouseDragStartEmitCount++;
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 1 }, canvasContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, document);

        canvasContainer.dispatchEvent(mouseDownEvent);
        doc.dispatchEvent(mouseMoveEvent);

        expect(mouseDragStartEmitCount).toBe(0);
    });
});

describe("MouseService.mouseDrag$", () => {
    it("should emit mouse drag", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let mouseDragEmitCount: number = 0;
        mouseService.mouseDrag$
            .subscribe(
                (event: MouseEvent): void => {
                    mouseDragEmitCount++;
                    expect(event.type === "mousemove");
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, canvasContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, document);

        doc.dispatchEvent(mouseMoveEvent);
        expect(mouseDragEmitCount).toBe(0);

        canvasContainer.dispatchEvent(mouseDownEvent);

        doc.dispatchEvent(mouseMoveEvent);
        expect(mouseDragEmitCount).toBe(1);

        doc.dispatchEvent(mouseMoveEvent);
        expect(mouseDragEmitCount).toBe(2);
    });

    it("should emit mouse drag after mouse drag start", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let mouseDragEmitCount: number = 0;
        mouseService.mouseDrag$
            .subscribe(
                (event: MouseEvent): void => {
                    mouseDragEmitCount++;
                });

        let mouseDragStartEmitCount: number = 0;
        mouseService.mouseDragStart$
            .subscribe(
                (event: MouseEvent): void => {
                    expect(mouseDragEmitCount).toBe(0);
                    mouseDragStartEmitCount++;
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, canvasContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, document);

        canvasContainer.dispatchEvent(mouseDownEvent);
        expect(mouseDragStartEmitCount).toBe(0);
        expect(mouseDragEmitCount).toBe(0);

        doc.dispatchEvent(mouseMoveEvent);
        expect(mouseDragStartEmitCount).toBe(1);
        expect(mouseDragEmitCount).toBe(1);
    });

    it("should emit mouse drag after switch mapping from mouse drag start", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let emitCount: number = 0;
        mouseService.mouseDragStart$
            .switchMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return mouseService.mouseDrag$;
                })
            .subscribe(
                (event: MouseEvent): void => {
                    emitCount++;
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, canvasContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, doc);

        canvasContainer.dispatchEvent(mouseDownEvent);
        expect(emitCount).toBe(0);

        doc.dispatchEvent(mouseMoveEvent);
        expect(emitCount).toBe(1);

        doc.dispatchEvent(mouseMoveEvent);
        expect(emitCount).toBe(2);

        doc.dispatchEvent(mouseMoveEvent);
        expect(emitCount).toBe(3);
    });

    it("should emit filtered mouse drag after switch mapping from filtered mouse drag start", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        mouseService.claimMouse("test", 1);

        let emitCount: number = 0;
        mouseService
            .filtered$("test", mouseService.mouseDragStart$)
            .switchMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return mouseService.filtered$("test", mouseService.mouseDrag$);
                })
            .subscribe(
                (event: MouseEvent): void => {
                    emitCount++;
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, canvasContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, document);

        canvasContainer.dispatchEvent(mouseDownEvent);
        expect(emitCount).toBe(0);

        doc.dispatchEvent(mouseMoveEvent);
        expect(emitCount).toBe(1);

        doc.dispatchEvent(mouseMoveEvent);
        expect(emitCount).toBe(2);

        doc.dispatchEvent(mouseMoveEvent);
        expect(emitCount).toBe(3);
    });
});

describe("MouseService.mouseDragEnd$", () => {
    it("should emit mouse drag end on mouse up", (done: Function) => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        mouseService.mouseDragEnd$
            .subscribe(
                (event: Event): void => {
                    done();
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, canvasContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, document);
        const mouseUpEvent: MouseEvent = EventHelper.createMouseEvent("mouseup", {}, document);

        canvasContainer.dispatchEvent(mouseDownEvent);
        doc.dispatchEvent(mouseMoveEvent);
        doc.dispatchEvent(mouseUpEvent);
    });

    it("should emit mouse drag end on window blur", (done: Function) => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        mouseService.mouseDragEnd$
            .subscribe(
                (event: MouseEvent): void => {
                    done();
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, canvasContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, document);
        const blurEvent: UIEvent = EventHelper.createUIEvent("blur");

        canvasContainer.dispatchEvent(mouseDownEvent);
        doc.dispatchEvent(mouseMoveEvent);
        window.dispatchEvent(blurEvent);
    });
});

describe("MouseService.domMouseDragStart$", () => {
    it("should emit DOM mouse drag start", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let domMouseDragStartEmitCount: number = 0;
        mouseService.domMouseDragStart$
            .subscribe(
                (event: MouseEvent): void => {
                    domMouseDragStartEmitCount++;
                    expect(event.button === 0);
                    expect(event.type === "mousedown");
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, domContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, document);

        doc.dispatchEvent(mouseMoveEvent);
        expect(domMouseDragStartEmitCount).toBe(0);

        domContainer.dispatchEvent(mouseDownEvent);

        doc.dispatchEvent(mouseMoveEvent);
        expect(domMouseDragStartEmitCount).toBe(1);
    });

    it("should not emit DOM mouse drag start when not left button", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let domMouseDragStartEmitCount: number = 0;
        mouseService.domMouseDragStart$
            .subscribe(
                (event: MouseEvent): void => {
                    domMouseDragStartEmitCount++;
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 1 }, domContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, document);

        domContainer.dispatchEvent(mouseDownEvent);
        doc.dispatchEvent(mouseMoveEvent);

        expect(domMouseDragStartEmitCount).toBe(0);
    });
});

describe("MouseService.domMouseDrag$", () => {
    it("should emit DOM mouse drag", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let domMouseDragEmitCount: number = 0;
        mouseService.domMouseDrag$
            .subscribe(
                (event: MouseEvent): void => {
                    domMouseDragEmitCount++;
                    expect(event.type === "mousemove");
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, domContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, document);

        doc.dispatchEvent(mouseMoveEvent);
        expect(domMouseDragEmitCount).toBe(0);

        domContainer.dispatchEvent(mouseDownEvent);

        doc.dispatchEvent(mouseMoveEvent);
        expect(domMouseDragEmitCount).toBe(1);

        doc.dispatchEvent(mouseMoveEvent);
        expect(domMouseDragEmitCount).toBe(2);
    });

    it("should emit DOM mouse drag after DOM mouse drag start", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let domMouseDragEmitCount: number = 0;
        mouseService.domMouseDrag$
            .subscribe(
                (event: MouseEvent): void => {
                    domMouseDragEmitCount++;
                });

        let domMouseDragStartEmitCount: number = 0;
        mouseService.domMouseDragStart$
            .subscribe(
                (event: MouseEvent): void => {
                    expect(domMouseDragEmitCount).toBe(0);
                    domMouseDragStartEmitCount++;
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, domContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, document);

        domContainer.dispatchEvent(mouseDownEvent);
        expect(domMouseDragStartEmitCount).toBe(0);
        expect(domMouseDragEmitCount).toBe(0);

        doc.dispatchEvent(mouseMoveEvent);
        expect(domMouseDragStartEmitCount).toBe(1);
        expect(domMouseDragEmitCount).toBe(1);
    });

    it("should emit DOM mouse drag after switch mapping from DOM mouse drag start", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let emitCount: number = 0;
        mouseService.domMouseDragStart$
            .switchMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return mouseService.domMouseDrag$;
                })
            .subscribe(
                (event: MouseEvent): void => {
                    emitCount++;
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, domContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, doc);

        domContainer.dispatchEvent(mouseDownEvent);
        expect(emitCount).toBe(0);

        doc.dispatchEvent(mouseMoveEvent);
        expect(emitCount).toBe(1);

        doc.dispatchEvent(mouseMoveEvent);
        expect(emitCount).toBe(2);

        doc.dispatchEvent(mouseMoveEvent);
        expect(emitCount).toBe(3);
    });

    it("should emit filtered DOM ouse drag after switch mapping from DOM filtered mouse drag start", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        mouseService.claimMouse("test", 1);

        let emitCount: number = 0;
        mouseService
            .filtered$("test", mouseService.domMouseDragStart$)
            .switchMap(
                (e: MouseEvent): Observable<MouseEvent> => {
                    return mouseService.filtered$("test", mouseService.domMouseDrag$);
                })
            .subscribe(
                (event: MouseEvent): void => {
                    emitCount++;
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, domContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, document);

        domContainer.dispatchEvent(mouseDownEvent);
        expect(emitCount).toBe(0);

        doc.dispatchEvent(mouseMoveEvent);
        expect(emitCount).toBe(1);

        doc.dispatchEvent(mouseMoveEvent);
        expect(emitCount).toBe(2);

        doc.dispatchEvent(mouseMoveEvent);
        expect(emitCount).toBe(3);
    });
});

describe("MouseService.domMouseDragEnd$", () => {
    it("should emit DOM mouse drag end on DOM mouse up", (done: Function) => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        mouseService.domMouseDragEnd$
            .subscribe(
                (event: MouseEvent): void => {
                    done();
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, domContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, document);
        const mouseUpEvent: MouseEvent = EventHelper.createMouseEvent("mouseup", {}, document);

        domContainer.dispatchEvent(mouseDownEvent);
        doc.dispatchEvent(mouseMoveEvent);
        doc.dispatchEvent(mouseUpEvent);
    });

    it("should emit DOM mouse drag end on window blur", (done: Function) => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        mouseService.domMouseDragEnd$
            .subscribe(
                (event: MouseEvent): void => {
                    done();
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, domContainer);
        const mouseMoveEvent: MouseEvent = EventHelper.createMouseEvent("mousemove", {}, document);
        const blurEvent: UIEvent = EventHelper.createUIEvent("blur");

        domContainer.dispatchEvent(mouseDownEvent);
        doc.dispatchEvent(mouseMoveEvent);
        window.dispatchEvent(blurEvent);
    });
});

describe("MouseService.claimMouse", () => {
    it("should emit filtered after claiming mouse", (done: Function) => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        mouseService.claimMouse("test", 0);
        mouseService.filtered$("test", mouseService.mouseDown$)
            .subscribe(
                (mouseDown: MouseEvent): void => {
                    expect(mouseDown).toBeDefined();
                    done();
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, canvasContainer);

        canvasContainer.dispatchEvent(mouseDownEvent);
    });

    it("should not emit filtered if not claimed", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let mouseDownCount: number = 0;
        mouseService.filtered$("test", mouseService.mouseDown$)
            .subscribe(
                (mouseDown: MouseEvent): void => {
                    mouseDownCount++;
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, canvasContainer);

        canvasContainer.dispatchEvent(mouseDownEvent);

        expect(mouseDownCount).toBe(0);
    });

    it("should emit to highest z-index", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let mouseDownCount1: number = 0;
        mouseService.claimMouse("test1", 1);
        mouseService.filtered$("test1", mouseService.mouseDown$)
            .subscribe(
                (mouseDown: MouseEvent): void => {
                    mouseDownCount1++;
                });

        let mouseDownCount2: number = 0;
        mouseService.claimMouse("test2", 2);
        mouseService.filtered$("test2", mouseService.mouseDown$)
            .subscribe(
                (mouseDown: MouseEvent): void => {
                    mouseDownCount2++;
                });

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, canvasContainer);

        canvasContainer.dispatchEvent(mouseDownEvent);

        expect(mouseDownCount1).toBe(0);
        expect(mouseDownCount2).toBe(1);
    });

    it("should emit to lower z-index after higher z-index unclaims", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let mouseDownCount1: number = 0;
        mouseService.claimMouse("test1", 1);
        mouseService.filtered$("test1", mouseService.mouseDown$)
            .subscribe(
                (mouseDown: MouseEvent): void => {
                    mouseDownCount1++;
                });

        let mouseDownCount2: number = 0;
        mouseService.claimMouse("test2", 2);
        mouseService.filtered$("test2", mouseService.mouseDown$)
            .subscribe(
                (mouseDown: MouseEvent): void => {
                    mouseDownCount2++;
                });

        mouseService.unclaimMouse("test2");

        const mouseDownEvent: MouseEvent = EventHelper.createMouseEvent("mousedown", { button: 0 }, canvasContainer);

        canvasContainer.dispatchEvent(mouseDownEvent);

        expect(mouseDownCount1).toBe(1);
        expect(mouseDownCount2).toBe(0);
    });
});

describe("MouseService.claimWheel", () => {
    it("should emit filtered after claiming wheel", (done: Function) => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        mouseService.claimWheel("test", 0);
        mouseService.filteredWheel$("test", mouseService.mouseWheel$)
            .subscribe(
                (wheel: WheelEvent): void => {
                    expect(wheel).toBeDefined();
                    done();
                });

        const wheelEvent: WheelEvent = EventHelper.createWheelEvent("wheel", { button: 0 }, canvasContainer);

        canvasContainer.dispatchEvent(wheelEvent);
    });

    it("should not emit filtered if not claimed", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let wheelCount: number = 0;
        mouseService.filteredWheel$("test", mouseService.mouseWheel$)
            .subscribe(
                (wheel: WheelEvent): void => {
                    wheelCount++;
                });

        const wheelEvent: WheelEvent = EventHelper.createWheelEvent("wheel", { button: 0 }, canvasContainer);

        canvasContainer.dispatchEvent(wheelEvent);

        expect(wheelCount).toBe(0);
    });

    it("should emit to highest z-index", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let wheelCount1: number = 0;
        mouseService.claimWheel("test1", 1);
        mouseService.filteredWheel$("test1", mouseService.mouseWheel$)
            .subscribe(
                (wheel: WheelEvent): void => {
                    wheelCount1++;
                });

        let wheelCount2: number = 0;
        mouseService.claimWheel("test2", 2);
        mouseService.filteredWheel$("test2", mouseService.mouseWheel$)
            .subscribe(
                (wheel: WheelEvent): void => {
                    wheelCount2++;
                });

        const wheelEvent: WheelEvent = EventHelper.createWheelEvent("wheel", { button: 0 }, canvasContainer);

        canvasContainer.dispatchEvent(wheelEvent);

        expect(wheelCount1).toBe(0);
        expect(wheelCount2).toBe(1);
    });

    it("should emit to lower z-index after higher z-index unclaims", () => {
        const container: HTMLElement = document.createElement("div");
        const canvasContainer: HTMLElement = document.createElement("div");
        const domContainer: HTMLElement = document.createElement("div");
        const doc: HTMLElement = document.createElement("div");

        const mouseService: MouseService = new MouseService(container, canvasContainer, domContainer, doc);

        let wheelCount1: number = 0;
        mouseService.claimWheel("test1", 1);
        mouseService.filteredWheel$("test1", mouseService.mouseWheel$)
            .subscribe(
                (wheel: WheelEvent): void => {
                    wheelCount1++;
                });

        let wheelCount2: number = 0;
        mouseService.claimWheel("test2", 2);
        mouseService.filteredWheel$("test2", mouseService.mouseWheel$)
            .subscribe(
                (wheel: WheelEvent): void => {
                    wheelCount2++;
                });

        mouseService.unclaimWheel("test2");

        const wheelEvent: WheelEvent = EventHelper.createWheelEvent("wheel", { button: 0 }, canvasContainer);

        canvasContainer.dispatchEvent(wheelEvent);

        expect(wheelCount1).toBe(1);
        expect(wheelCount2).toBe(0);
    });
});
