import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/observable/empty";

import "rxjs/add/operator/count";
import "rxjs/add/operator/first";
import "rxjs/add/operator/skip";
import "rxjs/add/operator/take";

import {ISize, RenderCamera, RenderMode, RenderService} from "../../src/Render";
import {IFrame, ICurrentState} from "../../src/State";
import {Camera} from "../../src/Geo";

describe("RenderService.ctor", () => {
    it("should be contructed", () => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, Observable.empty<IFrame>(), RenderMode.Letterbox);

        expect(renderService).toBeDefined();
    });
});

describe("RenderService.renderMode", () => {
    it("should default to letterboxing", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, Observable.empty<IFrame>(), null);

        renderService.renderMode$
            .first()
            .subscribe(
                (renderMode: RenderMode): void => {
                    expect(renderMode).toBe(RenderMode.Fill);

                    done();
                });
    });

    it("should default set render mode to constructor parameter", (done) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, Observable.empty<IFrame>(), RenderMode.Fill);

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
            new RenderService(element, Observable.empty<IFrame>(), RenderMode.Letterbox);

        renderService.renderMode$.next(RenderMode.Fill);

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
            new RenderService(element, Observable.empty<IFrame>(), RenderMode.Letterbox);

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
            new RenderService(element, Observable.empty<IFrame>(), RenderMode.Letterbox);

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
            new RenderService(element, Observable.empty<IFrame>(), RenderMode.Letterbox);

        renderService.size$
            .take(2)
            .subscribe(
                (size: ISize): void => { return; },
                (e: Error): void => { return; },
                (): void => { done(); });

        renderService.resize$.next(null);
    });
});

describe("RenderService.renderCameraFrame", () => {
    let createFrame: (frameId: number, alpha?: number, camera?: Camera) => IFrame =
        (frameId: number, alpha?: number, camera?: Camera): IFrame => {
            let state: ICurrentState = {
                alpha: alpha != null ? alpha : 0,
                camera: camera != null ? camera : new Camera(),
                currentCamera: camera != null ? camera : new Camera(),
                currentIndex: 0,
                currentNode: null,
                currentTransform: null,
                lastNode: null,
                motionless: false,
                nodesAhead: 0,
                previousNode: null,
                previousTransform: null,
                reference: { alt: 0, lat: 0, lon: 0 },
                trajectory: [],
                zoom: 0,
            };

            spyOn(state, "currentNode").and.returnValue({ });
            spyOn(state, "currentTransform").and.returnValue({ });
            spyOn(state, "previousNode").and.returnValue({ });
            spyOn(state, "previousTransform").and.returnValue({ });

            return { fps: 60, id: frameId, state: state };
        };

    it("should be defined", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: Subject<IFrame> = new Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc).toBeDefined();

                    done();
                });

        frame$.next(createFrame(0));
    });

    it("should be changed for first frame", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: Subject<IFrame> = new Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(true);

                    done();
                });

        frame$.next(createFrame(0));
    });

    it("should not be changed for two identical frames", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: Subject<IFrame> = new Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .skip(1)
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(false);

                    done();
                });

        frame$.next(createFrame(0));
        frame$.next(createFrame(1));
    });

    it("should be changed for alpha changes between two frames", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: Subject<IFrame> = new Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .skip(1)
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(true);

                    done();
                });

        frame$.next(createFrame(0, 0.00));
        frame$.next(createFrame(1, 0.01));
    });

    it("should be changed for camera changes between two frames", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: Subject<IFrame> = new Subject<IFrame>();

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
        frame$.next(createFrame(0, 0, camera));

        camera.position.x = 0.01;
        frame$.next(createFrame(1, 0, camera));
    });

    it("should be changed for resize", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: Subject<IFrame> = new Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .skip(1)
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(true);

                    done();
                });

        frame$.next(createFrame(0));

        renderService.resize$.next(null);
        frame$.next(createFrame(1));
    });

    it("should be changed for changed render mode", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: Subject<IFrame> = new Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .skip(1)
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(true);

                    done();
                });

        frame$.next(createFrame(0));

        renderService.renderMode$.next(RenderMode.Fill);
        frame$.next(createFrame(1));
    });

    it("should have correct render mode when changed before subscribe", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: Subject<IFrame> = new Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderMode$.next(RenderMode.Fill);

        renderService.renderCameraFrame$
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.renderMode).toBe(RenderMode.Fill);

                    done();
                });

        frame$.next(createFrame(0));
    });

    it("should emit once for each frame", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: Subject<IFrame> = new Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCameraFrame$
            .count()
            .subscribe(
                (count: number): void => {
                    expect(count).toBe(4);

                    done();
                });

        frame$.next(createFrame(0));
        frame$.next(createFrame(1));

        renderService.renderMode$.next(RenderMode.Fill);
        renderService.resize$.next(null);

        frame$.next(createFrame(2));

        frame$.next(createFrame(3));

        frame$.complete();
    });
});

describe("RenderService.renderCamera", () => {
    let createFrame: (frameId: number, alpha?: number, camera?: Camera) => IFrame =
        (frameId: number, alpha?: number, camera?: Camera): IFrame => {
            let state: ICurrentState = {
                alpha: alpha != null ? alpha : 0,
                camera: camera != null ? camera : new Camera(),
                currentCamera: camera != null ? camera : new Camera(),
                currentIndex: 0,
                currentNode: null,
                currentTransform: null,
                lastNode: null,
                motionless: false,
                nodesAhead: 0,
                previousNode: null,
                previousTransform: null,
                reference: { alt: 0, lat: 0, lon: 0 },
                trajectory: [],
                zoom: 0,
            };

            spyOn(state, "currentNode").and.returnValue({ });
            spyOn(state, "currentTransform").and.returnValue({ });
            spyOn(state, "previousNode").and.returnValue({ });
            spyOn(state, "previousTransform").and.returnValue({ });

            return { fps: 60, id: frameId, state: state };
        };

    it("should be defined", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: Subject<IFrame> = new Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCamera$
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc).toBeDefined();

                    done();
                });

        frame$.next(createFrame(0));
    });

    it("should only emit when camera has changed", (done) => {
        let element: HTMLDivElement = document.createElement("div");

        let frame$: Subject<IFrame> = new Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.renderCamera$
            .skip(1)
            .first()
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.frameId).toBe(2);

                    done();
                });

        frame$.next(createFrame(0));
        frame$.next(createFrame(1));
        frame$.next(createFrame(2, 0.5));
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
            appendChild(htmlElement: HTMLElement): void { return; },
        };

        let frame$: Subject<IFrame> = new Subject<IFrame>();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox);

        renderService.size$.subscribe();
        renderService.size$.subscribe();

        spyOn(element, "getOffsetHeight");
        spyOn(element, "getOffsetWidth");

        renderService.resize$.next(null);

        expect((<jasmine.Spy>element.getOffsetHeight).calls.count()).toBe(1);
        expect((<jasmine.Spy>element.getOffsetWidth).calls.count()).toBe(1);
    });
});
