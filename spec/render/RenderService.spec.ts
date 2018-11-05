import {empty as observableEmpty, Subject} from "rxjs";

import {skip, first, take, count} from "rxjs/operators";

import {ISize, RenderCamera, RenderMode, RenderService} from "../../src/Render";
import {IFrame} from "../../src/State";
import {Camera} from "../../src/Geo";
import { FrameHelper } from "../helper/FrameHelper.spec";

const createFrame: (frameId: number, alpha?: number, camera?: Camera) => IFrame =
(frameId: number, alpha?: number, camera?: Camera): IFrame => {
    const frame: IFrame = new FrameHelper().createFrame();

    frame.id = frameId;
    frame.state.alpha =  alpha != null ? alpha : 0;
    frame.state.camera = camera != null ? camera : new Camera();
    frame.state.currentCamera = camera != null ? camera : new Camera();

    return frame;
};

describe("RenderService.ctor", () => {
    it("should be contructed", () => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, observableEmpty(), RenderMode.Letterbox);

        expect(renderService).toBeDefined();
    });
});

describe("RenderService.renderMode", () => {
    it("should default to fill", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, observableEmpty(), null);

        renderService.renderMode$.pipe(
            first())
            .subscribe(
                (renderMode: RenderMode): void => {
                    expect(renderMode).toBe(RenderMode.Fill);

                    done();
                });
    });

    it("should set initial render mode to constructor parameter", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, observableEmpty(), RenderMode.Letterbox);

        renderService.renderMode$.pipe(
            first())
            .subscribe(
                (renderMode: RenderMode): void => {
                    expect(renderMode).toBe(RenderMode.Letterbox);

                    done();
                });
    });

    it("should return latest render mode on subscripion", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, observableEmpty(), RenderMode.Letterbox);

        renderService.renderMode$.next(RenderMode.Fill);

        renderService.renderMode$.pipe(
            first())
            .subscribe(
                (renderMode: RenderMode): void => {
                    expect(renderMode).toBe(RenderMode.Fill);

                    done();
                });
    });
});

describe("RenderService.size", () => {
    it("should be defined", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, observableEmpty(), RenderMode.Letterbox);

        renderService.size$.pipe(
            first())
            .subscribe(
                (size: ISize): void => {
                    expect(size).toBeDefined();

                    done();
                });
    });

    it("should have an initial value", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, observableEmpty(), RenderMode.Letterbox);

        renderService.size$.pipe(
            first())
            .subscribe(
                (size: ISize): void => {
                    expect(size.width).toBe(0);
                    expect(size.height).toBe(0);

                    done();
                });
    });

    it("should emit new value on resize", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService =
            new RenderService(element, observableEmpty(), RenderMode.Letterbox);

        renderService.size$.pipe(
            take(2))
            .subscribe(
                (size: ISize): void => { return; },
                (e: Error): void => { return; },
                (): void => { done(); });

        renderService.resize$.next(null);
    });
});

describe("RenderService.renderCameraFrame", () => {
    const createRenderCameraMock: () => RenderCamera = (): RenderCamera => {
        const renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Fill);

        return renderCamera;
    };

    it("should be defined", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let frame$: Subject<IFrame> = new Subject<IFrame>();
        const renderCamera: RenderCamera = createRenderCameraMock();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox, renderCamera);

        renderService.renderCameraFrame$.pipe(
            first())
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc).toBeDefined();

                    done();
                });

        frame$.next(createFrame(0));
        frame$.complete();
    });

    it("should be changed for first frame", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let frame$: Subject<IFrame> = new Subject<IFrame>();
        const renderCamera: RenderCamera = createRenderCameraMock();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox, renderCamera);

        renderService.renderCameraFrame$.pipe(
            first())
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(true);

                    done();
                });

        frame$.next(createFrame(0));
        frame$.complete();
    });

    it("should not be changed for two identical frames", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let frame$: Subject<IFrame> = new Subject<IFrame>();
        const renderCamera: RenderCamera = createRenderCameraMock();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox, renderCamera);

        renderService.renderCameraFrame$.pipe(
            skip(1),
            first())
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(false);

                    done();
                });

        frame$.next(createFrame(0));
        frame$.next(createFrame(1));
        frame$.complete();
    });

    it("should be changed for alpha changes between two frames", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let frame$: Subject<IFrame> = new Subject<IFrame>();
        const renderCamera: RenderCamera = createRenderCameraMock();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox, renderCamera);

        renderService.renderCameraFrame$.pipe(
            skip(1),
            first())
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(true);

                    done();
                });

        frame$.next(createFrame(0, 0.00));
        frame$.next(createFrame(1, 0.01));
        frame$.complete();
    });

    it("should be changed for camera changes between two frames", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let frame$: Subject<IFrame> = new Subject<IFrame>();
        const renderCamera: RenderCamera = createRenderCameraMock();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox, renderCamera);

        renderService.renderCameraFrame$.pipe(
            skip(1),
            first())
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(true);

                    done();
                });

        let camera: Camera = new Camera();
        frame$.next(createFrame(0, 0, camera));

        camera.position.x = 0.01;
        frame$.next(createFrame(1, 0, camera));
        frame$.complete();
    });

    it("should be changed for resize", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let frame$: Subject<IFrame> = new Subject<IFrame>();
        const renderCamera: RenderCamera = createRenderCameraMock();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox, renderCamera);

        renderService.renderCameraFrame$.pipe(
            skip(1),
            first())
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(true);

                    done();
                });

        frame$.next(createFrame(0));

        renderService.resize$.next(null);
        frame$.next(createFrame(1));
        frame$.complete();
    });

    it("should be changed for changed render mode", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let frame$: Subject<IFrame> = new Subject<IFrame>();
        const renderCamera: RenderCamera = createRenderCameraMock();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox, renderCamera);

        renderService.renderCameraFrame$.pipe(
            skip(1),
            first())
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.changed).toBe(true);

                    done();
                });

        frame$.next(createFrame(0));

        renderService.renderMode$.next(RenderMode.Fill);
        frame$.next(createFrame(1));
        frame$.complete();
    });

    it("should have correct render mode when changed before subscribe", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let frame$: Subject<IFrame> = new Subject<IFrame>();
        const renderCamera: RenderCamera = createRenderCameraMock();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox, renderCamera);

        renderService.renderMode$.next(RenderMode.Fill);

        renderService.renderCameraFrame$.pipe(
            first())
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.renderMode).toBe(RenderMode.Fill);

                    done();
                });

        frame$.next(createFrame(0));
        frame$.complete();
    });

    it("should emit once for each frame", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let frame$: Subject<IFrame> = new Subject<IFrame>();
        const renderCamera: RenderCamera = createRenderCameraMock();

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox, renderCamera);

        renderService.renderCameraFrame$.pipe(
            count())
            .subscribe(
                (emitCount: number): void => {
                    expect(emitCount).toBe(4);

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

describe("RenderService.renderCamera$", () => {
    it("should be defined", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let frame$: Subject<IFrame> = new Subject<IFrame>();

        const renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Fill);

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox, renderCamera);

        renderService.renderCamera$.pipe(
            first())
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc).toBeDefined();

                    done();
                });

        frame$.next(createFrame(0));
        frame$.complete();
    });

    it("should only emit when camera has changed", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let frame$: Subject<IFrame> = new Subject<IFrame>();

        const renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Fill);

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox, renderCamera);

        renderService.renderCamera$.pipe(
            skip(1),
            first())
            .subscribe(
                (rc: RenderCamera): void => {
                    expect(rc.frameId).toBe(2);

                    done();
                });

        frame$.next(createFrame(0));
        frame$.next(createFrame(1));
        frame$.next(createFrame(2, 0.5));
        frame$.complete();
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

        renderService.size$.subscribe(() => { /*noop*/ });
        renderService.size$.subscribe(() => { /*noop*/ });

        spyOn(element, "getOffsetHeight");
        spyOn(element, "getOffsetWidth");

        renderService.resize$.next(null);

        expect((<jasmine.Spy>element.getOffsetHeight).calls.count()).toBe(1);
        expect((<jasmine.Spy>element.getOffsetWidth).calls.count()).toBe(1);
    });
});

describe("RenderService.bearing$", () => {
    it("should be defined", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let frame$: Subject<IFrame> = new Subject<IFrame>();

        const renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Fill);

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox, renderCamera);

        renderService.bearing$.pipe(
            first())
            .subscribe(
                (bearing: number): void => {
                    expect(bearing).toBeDefined();

                    done();
                });

        frame$.next(createFrame(0));
    });

    it("should be 90 degrees", (done: Function) => {
        let element: HTMLDivElement = document.createElement("div");
        let frame$: Subject<IFrame> = new Subject<IFrame>();

        const renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Fill);

        let renderService: RenderService = new RenderService(element, frame$, RenderMode.Letterbox, renderCamera);

        renderService.bearing$.pipe(
            first())
            .subscribe(
                (bearing: number): void => {
                    expect(bearing).toBeCloseTo(90, 5);

                    done();
                });

        let frame: IFrame = createFrame(0);
        frame.state.camera.lookat.set(1, 0, 0);

        frame$.next(frame);
    });
});
