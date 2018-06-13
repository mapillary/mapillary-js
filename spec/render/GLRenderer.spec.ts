import {empty as observableEmpty, BehaviorSubject, Observable, Subscription, Subject} from "rxjs";

import {map} from "rxjs/operators";
import * as THREE from "three";

import {
    GLRenderer,
    GLRenderStage,
    RenderMode,
    RenderCamera,
    IGLRender,
    IGLRenderFunction,
    IGLRenderHash,
    RenderService,
    ISize,
} from "../../src/Render";
import {Camera} from "../../src/Geo";
import {IFrame, ICurrentState} from "../../src/State";

class RendererMock implements THREE.Renderer {
    public domElement: HTMLCanvasElement = document.createElement("canvas");

    public render(s: THREE.Scene, c: THREE.Camera): void { return; }
    public setSize(w: number, h: number, updateStyle?: boolean): void { return; }
    public setClearColor(c: THREE.Color, o: number): void { return; }
    public setPixelRatio(ratio: number): void { return; }
    public clear(): void { return; }
    public clearDepth(): void { return; }
}

class RenderServiceMock extends RenderService {
    private _sizeMock$: Subject<ISize> = new Subject<ISize>();
    private _renderModeMock$: Subject<RenderMode> = new Subject<RenderMode>();
    private _renderCameraFrameMock$: Subject<RenderCamera> = new Subject<RenderCamera>();

    constructor(element: HTMLElement) {
        super(element, observableEmpty(), RenderMode.Letterbox);
    }

    public get size$(): Subject<ISize> {
        return this._sizeMock$;
    }

    public set size$(value: Subject<ISize>) {
        this._sizeMock$ = value;
    }

    public get renderMode$(): Subject<RenderMode> {
        return this._renderModeMock$;
    }

    public set renderMode$(value: Subject<RenderMode>) {
        this._renderModeMock$ = value;
    }

    public get renderCameraFrame$(): Subject<RenderCamera> {
        return this._renderCameraFrameMock$;
    }

    public set renderCameraFrame$(value: Subject<RenderCamera>) {
        this._renderCameraFrameMock$ = value;
    }
}

describe("GLRenderer.ctor", () => {
    it("should be contructed", () => {
        let element: HTMLDivElement = document.createElement("div");
        let canvasContainer: HTMLElement = document.createElement("div");
        let renderService: RenderService = new RenderServiceMock(element);
        let glRenderer: GLRenderer = new GLRenderer(canvasContainer, renderService);

        expect(glRenderer).toBeDefined();
    });

    it("should not instantiate a WebGL context", () => {
        spyOn(THREE, "WebGLRenderer");

        let element: HTMLDivElement = document.createElement("div");
        let canvasContainer: HTMLElement = document.createElement("div");
        let renderService: RenderService = new RenderServiceMock(element);
        let glRenderer: GLRenderer = new GLRenderer(canvasContainer, renderService);

        expect(glRenderer).toBeDefined();

        expect(THREE.WebGLRenderer).not.toHaveBeenCalled();
    });
});

describe("GLRenderer.renderer", () => {
    let createGLRenderHash: (frameId: number, needsRender: boolean, name?: string) => IGLRenderHash =
        (frameId: number, needsRender: boolean, name?: string): IGLRenderHash => {
            let renderFunction: IGLRenderFunction =
                (pc: THREE.PerspectiveCamera, r: THREE.WebGLRenderer): void => {
                    r.render(new THREE.Scene(), pc);
                };

            let render: IGLRender = {
                frameId: frameId,
                needsRender: needsRender,
                render: renderFunction,
                stage: GLRenderStage.Background,
            };

            let renderHash: IGLRenderHash = {
                name: name != null ? name : "mock",
                render: render,
            };

            return renderHash;
        };

    let createFrame: (frameId: number) => IFrame = (frameId: number): IFrame => {
        let state: ICurrentState = {
            alpha: 0,
            camera: new Camera(),
            currentCamera: new Camera(),
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

    it("should be created on first render", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let glRenderer: GLRenderer = new GLRenderer(document.createElement("div"), renderServiceMock);
        let renderHash: IGLRenderHash = createGLRenderHash(0, true);

        glRenderer.render$.next(renderHash);

        expect(THREE.WebGLRenderer).toHaveBeenCalled();
    });

    it("should render on new hash", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let glRenderer: GLRenderer = new GLRenderer(document.createElement("div"), renderServiceMock);

        let renderHash: IGLRenderHash = createGLRenderHash(0, true);
        glRenderer.render$.next(renderHash);

        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.frameId = 0;
        renderServiceMock.renderCameraFrame$.next(renderCamera);

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);
    });

    it("should only render once for the same frame id", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let glRenderer: GLRenderer = new GLRenderer(document.createElement("div"), renderServiceMock);

        let renderHash: IGLRenderHash = createGLRenderHash(0, true);
        glRenderer.render$.next(renderHash);

        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.frameId = 0;
        renderServiceMock.renderCameraFrame$.next(renderCamera);

        glRenderer.render$.next(renderHash);

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);
    });

    it("should render twice for two frame ids", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frame$: BehaviorSubject<IFrame> = new BehaviorSubject<IFrame>(createFrame(1));

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.frameId = 1;
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(document.createElement("div"), renderServiceMock);

        frame$.pipe(
            map(
                (frame: IFrame): IGLRenderHash => {
                    let renderHash: IGLRenderHash = createGLRenderHash(frame.id, true);

                    return renderHash;
                }))
            .subscribe(glRenderer.render$);

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);

        renderCamera.frameId = 2;
        renderServiceMock.renderCameraFrame$.next(renderCamera);
        frame$.next(createFrame(2));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(2);
    });

    it("should clear when hash is cleared", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "clear");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frame$: BehaviorSubject<IFrame> = new BehaviorSubject<IFrame>(createFrame(1));

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.frameId = 1;
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(document.createElement("div"), renderServiceMock);

        let frameSubscription: Subscription = frame$.pipe(
            map(
                (frame: IFrame): IGLRenderHash => {
                    let renderHash: IGLRenderHash = createGLRenderHash(frame.id, true);

                    return renderHash;
                }))
            .subscribe(glRenderer.render$);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(1);

        frameSubscription.unsubscribe();

        glRenderer.clear("mock");

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(3);
    });

    it("should not clear or render on frames when no renders registered", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "clear");
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.frameId = 1;
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(document.createElement("div"), renderServiceMock);

        expect(glRenderer).toBeDefined();

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(0);

        renderCamera.frameId = 2;
        renderServiceMock.renderCameraFrame$.next(renderCamera);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(0);
    });

    it("should not render frame if not needed", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frameId: number = 1;
        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(document.createElement("div"), renderServiceMock);

        glRenderer.render$.next(createGLRenderHash(frameId, true));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);

        frameId = 2;
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$.next(renderCamera);
        glRenderer.render$.next(createGLRenderHash(frameId, false));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);
    });

    it("should render frame if camera has changed", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frameId: number = 1;
        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(document.createElement("div"), renderServiceMock);

        glRenderer.render$.next(createGLRenderHash(frameId, true));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);

        frameId = 2;
        renderCamera.updateProjection();
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$.next(renderCamera);
        glRenderer.render$.next(createGLRenderHash(frameId, false));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(2);
    });

    it("should render on resize", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frameId: number = 1;
        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(document.createElement("div"), renderServiceMock);

        glRenderer.render$.next(createGLRenderHash(frameId, true));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);

        renderServiceMock.size$.next({ height: 1, width: 1});

        frameId = 2;
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$.next(renderCamera);
        glRenderer.render$.next(createGLRenderHash(frameId, false));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(2);
    });

    it("should not render a frame until all render hashes has submitted", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let hash1: string = "hash1";
        let hash2: string = "hash2";

        let frameId: number = 1;

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(document.createElement("div"), renderServiceMock);

        let renderHash1: IGLRenderHash = createGLRenderHash(frameId, true, hash1);
        let renderHash2: IGLRenderHash = createGLRenderHash(frameId, true, hash2);

        glRenderer.render$.next(renderHash1);
        glRenderer.render$.next(renderHash2);

        spyOn(rendererMock, "clear");
        spyOn(rendererMock, "render");

        frameId = 2;
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$.next(renderCamera);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(0);

        renderHash1 = createGLRenderHash(frameId, true, hash1);
        renderHash2 = createGLRenderHash(frameId, true, hash2);

        glRenderer.render$.next(renderHash1);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(0);

        glRenderer.render$.next(renderHash2);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(1);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(2);
    });

    it("should render when one of multiple render hashes is cleared", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let hash1: string = "hash1";
        let hash2: string = "hash2";

        let frameId: number = 1;

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(document.createElement("div"), renderServiceMock);

        let renderHash1: IGLRenderHash = createGLRenderHash(frameId, true, hash1);
        let renderHash2: IGLRenderHash = createGLRenderHash(frameId, true, hash2);

        glRenderer.render$.next(renderHash1);
        glRenderer.render$.next(renderHash2);

        spyOn(rendererMock, "clear");
        spyOn(rendererMock, "render");

        frameId = 2;
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$.next(renderCamera);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(0);

        renderHash1 = createGLRenderHash(frameId, false, hash1);
        glRenderer.render$.next(renderHash1);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(0);

        glRenderer.clear(hash2);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(1);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);
    });
});
