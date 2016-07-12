/// <reference path="../../typings/index.d.ts" />

/*
import * as rx from "rx";

import {ISize, RenderCamera, RenderMode, RenderService} from "../../src/Render";
import {IFrame, ICurrentState} from "../../src/State";
import {Camera} from "../../src/Geo";


describe("RenderService.ctor", () => {
    it("should be contructed", () => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, rx.Observable.empty<IFrame>(), RenderMode.Letterbox);

        expect(renderService).toBeDefined();
    });
});

describe("RenderService.renderMode", () => {
    it("should default to letterboxing", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, rx.Observable.empty<IFrame>(), null);

        renderService.renderMode$
            .first()
            .subscribe(
                (renderMode: RenderMode): void => {
                    expect(renderMode).toBe(RenderMode.Letterbox);

                    done();
                });
    });

    it("should default set render mode to constructor parameter", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, rx.Observable.empty<IFrame>(), RenderMode.Fill);

        renderService.renderMode$
            .first()
            .subscribe(
                (renderMode: RenderMode): void => {
                    expect(renderMode).toBe(RenderMode.Fill);

                    done();
                });
    });

    it("should return latest render mode on subscripion", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, rx.Observable.empty<IFrame>(), RenderMode.Letterbox);

        renderService.renderMode$.onNext(RenderMode.Fill);

        renderService.renderMode$
            .first()
            .subscribe(
                (renderMode: RenderMode): void => {
                    expect(renderMode).toBe(RenderMode.Fill);

                    done();
                });
    });
});

describe("RenderService.size", () => {
    it("should be defined", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, rx.Observable.empty<IFrame>(), RenderMode.Letterbox);

        renderService.size$
            .first()
            .subscribe(
                (size: ISize): void => {
                    expect(size).toBeDefined();

                    done();
                });
    });

    it("should have an initial value", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, rx.Observable.empty<IFrame>(), RenderMode.Letterbox);

        renderService.size$
            .first()
            .subscribe(
                (size: ISize): void => {
                    expect(size.width).toBe(0);
                    expect(size.height).toBe(0);

                    done();
                });
    });

    it("should emit new value on resize", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, rx.Observable.empty<IFrame>(), RenderMode.Letterbox);

        renderService.size$
            .take(2)
            .subscribe(
                (size: ISize): void => { return; },
                (e: Error): void => { return; },
                (): void => { done(); });

        renderService.resize$.onNext(null);
    });
});

describe("RenderService.renderCameraFrame", () => {
    let createFrame = (frameId: number, alpha?: number, camera?: Camera): IFrame => {
        let state: ICurrentState = {
            alpha: alpha != null ? alpha : 0,
            camera: camera != null ? camera : new Camera(),
            zoom: 0,
            currentNode: null,
            previousNode: null,
            trajectory: [],
            currentIndex: 0,
            lastNode: null,
            nodesAhead: 0,
            reference: { lat: 0, lon: 0, alt: 0 },
            currentTransform: null,
            previousTransform: null,
            motionless: false,
        }

        spyOn(state, "currentNode").and.returnValue({ });
        spyOn(state, "currentTransform").and.returnValue({ });
        spyOn(state, "previousNode").and.returnValue({ });
        spyOn(state, "previousTransform").and.returnValue({ });

        return { fps: 60, id: frameId, state: state };
    }

    it("should be defined", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc).toBeDefined();

                    done();
                });

        frame$.onNext(createFrame(0));
    });

    it("should be changed for first frame", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(true);

                    done();
                });

        frame$.onNext(createFrame(0));
    });

    it("should not be changed for two identical frames", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .skip(1)
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(false);

                    done();
                });

        frame$.onNext(createFrame(0));
        frame$.onNext(createFrame(1));
    });

    it("should be changed for alpha changes between two frames", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .skip(1)
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(true);

                    done();
                });

        frame$.onNext(createFrame(0, 0.00));
        frame$.onNext(createFrame(1, 0.01));
    });

    it("should be changed for camera changes between two frames", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .skip(1)
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(true);

                    done();
                });

        let camera: Camera = new Camera();
        frame$.onNext(createFrame(0, 0, camera));

        camera.position.x = 0.01;
        frame$.onNext(createFrame(1, 0, camera));
    });

    it("should be changed for resize", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .skip(1)
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(true);

                    done();
                });

        frame$.onNext(createFrame(0));

        renderService.resize$.onNext(null);
        frame$.onNext(createFrame(1));
    });

    it("should be changed for changed render mode", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .skip(1)
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(true);

                    done();
                });

        frame$.onNext(createFrame(0));

        renderService.renderMode$.onNext(RenderMode.Fill);
        frame$.onNext(createFrame(1));
    });

    it("should have correct render mode when changed before subscribe", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderMode$.onNext(RenderMode.Fill);

        renderService.renderCameraFrame$
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.renderMode).toBe(RenderMode.Fill);

                    done();
                });

        frame$.onNext(createFrame(0));
    });

    it("should emit once for each frame", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .count()
            .subscribe(
                (count: number): void => {
                    expect(count).toBe(4);

                    done();
                });

        frame$.onNext(createFrame(0));
        frame$.onNext(createFrame(1));

        renderService.renderMode$.onNext(RenderMode.Fill);
        renderService.resize$.onNext(null);

        frame$.onNext(createFrame(2));

        frame$.onNext(createFrame(3));

        frame$.onCompleted();
    });
});

describe("RenderService.renderCamera", () => {
    let createFrame = (frameId: number, alpha?: number, camera?: Camera): IFrame => {
        let state: ICurrentState = {
            alpha: alpha != null ? alpha : 0,
            camera: camera != null ? camera : new Camera(),
            zoom: 0,
            currentNode: null,
            previousNode: null,
            trajectory: [],
            currentIndex: 0,
            lastNode: null,
            nodesAhead: 0,
            reference: { lat: 0, lon: 0, alt: 0 },
            currentTransform: null,
            previousTransform: null,
            motionless: false,
        }

        spyOn(state, "currentNode").and.returnValue({ });
        spyOn(state, "currentTransform").and.returnValue({ });
        spyOn(state, "previousNode").and.returnValue({ });
        spyOn(state, "previousTransform").and.returnValue({ });

        return { fps: 60, id: frameId, state: state };
    }

    it("should be defined", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCamera$
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc).toBeDefined();

                    done();
                });

        frame$.onNext(createFrame(0));
    });

    it("should only emit when camera has changed", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCamera$
            .skip(1)
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.frameId).toBe(2);

                    done();
                });

        frame$.onNext(createFrame(0));
        frame$.onNext(createFrame(1));
        frame$.onNext(createFrame(2, 0.5));
    });

    it("should check width and height only once on resize", () => {
        let element: any = {
            get offsetHeight(): number {
                return this.getOffsetHeight();
            },
            getOffsetHeight(): number {
                return 0;
            },
            get offsetWidth(): number {
                return this.getOffsetWidth();
            },
            getOffsetWidth(): number {
                return 0;
            },
            appendChild(element: HTMLElement): void { }
        };

        let frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.size$.subscribe();
        renderService.size$.subscribe();

        spyOn(element, "getOffsetHeight");
        spyOn(element, "getOffsetWidth");

        renderService.resize$.onNext(null);

        expect((<jasmine.Spy>element.getOffsetHeight).calls.count()).toBe(1);
        expect((<jasmine.Spy>element.getOffsetWidth).calls.count()).toBe(1);
    });
});
*/
