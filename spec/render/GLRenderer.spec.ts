/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";
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
import {Camera, Transform} from "../../src/Geo";
import {IFrame, ICurrentState} from "../../src/State";

class RendererMock implements THREE.Renderer {
    public domElement: HTMLCanvasElement = document.createElement("canvas");

    public render(s: THREE.Scene, c: THREE.Camera): void { }
    public setSize(w: number, h: number, updateStyle?: boolean): void { }
    public setClearColor(c: THREE.Color, o: number): void { }
    public clear(): void { }
    public clearDepth(): void { }
}

class RenderServiceMock extends RenderService {
    private _sizeMock$: rx.Subject<ISize> = new rx.Subject<ISize>();
    private _renderModeMock$: rx.Subject<RenderMode> = new rx.Subject<RenderMode>();
    private _renderCameraFrameMock$: rx.Subject<RenderCamera> = new rx.Subject<RenderCamera>();

    constructor(element: HTMLElement) {
        super(element, rx.Observable.empty<IFrame>(), RenderMode.Letterbox);
    }

    public get size$(): rx.Subject<ISize> {
        return this._sizeMock$
    }

    public set size$(value: rx.Subject<ISize>) {
        this._sizeMock$ = value;
    }

    public get renderMode$(): rx.Subject<RenderMode> {
        return this._renderModeMock$;
    }

    public set renderMode$(value: rx.Subject<RenderMode>) {
        this._renderModeMock$;
    }

    public get renderCameraFrame$(): rx.Subject<RenderCamera> {
        return this._renderCameraFrameMock$;
    }

    public set renderCameraFrame$(value: rx.Subject<RenderCamera>) {
        this._renderCameraFrameMock$ = value;
    }
}

describe("GLRenderer.ctor", () => {
    it("should be contructed", () => {
        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderServiceMock(element);
        let glRenderer: GLRenderer = new GLRenderer(renderService);

        expect(glRenderer).toBeDefined();
    });

    it("should not instantiate a WebGL context", () => {
        spyOn(THREE, "WebGLRenderer");

        let element: HTMLDivElement = document.createElement("div");
        let renderService: RenderService = new RenderServiceMock(element);
        let glRenderer: GLRenderer = new GLRenderer(renderService);

        expect(THREE.WebGLRenderer).not.toHaveBeenCalled();
    });
});

describe("GLRenderer.renderer", () => {
    let createGLRenderHash = (frameId: number, needsRender: boolean, name?: string): IGLRenderHash => {
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

    let createFrame = (frameId: number): IFrame => {
        let state: ICurrentState = {
            alpha: 0,
            camera: new Camera(),
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

    it("should be created on first render", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let glRenderer: GLRenderer = new GLRenderer(renderServiceMock);
        let renderHash: IGLRenderHash = createGLRenderHash(0, true);

        glRenderer.render$.onNext(renderHash);

        expect(THREE.WebGLRenderer).toHaveBeenCalled();
    });

    it("should render on new hash", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let glRenderer: GLRenderer = new GLRenderer(renderServiceMock);

        let renderHash: IGLRenderHash = createGLRenderHash(0, true);
        glRenderer.render$.onNext(renderHash);

        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Letterbox);
        renderCamera.frameId = 0;
        renderServiceMock.renderCameraFrame$.onNext(renderCamera);

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);
    });

    it("should only render once for the same frame id", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let glRenderer: GLRenderer = new GLRenderer(renderServiceMock);

        let renderHash: IGLRenderHash = createGLRenderHash(0, true);
        glRenderer.render$.onNext(renderHash);

        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Letterbox);
        renderCamera.frameId = 0;
        renderServiceMock.renderCameraFrame$.onNext(renderCamera);

        glRenderer.render$.onNext(renderHash);

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);
    });

    it("should render twice for two frame ids", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frame$: rx.BehaviorSubject<IFrame> = new rx.BehaviorSubject<IFrame>(createFrame(1));

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Letterbox);
        renderCamera.frameId = 1;
        renderServiceMock.renderCameraFrame$ = new rx.BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(renderServiceMock);

        let frameSubscription: rx.IDisposable = frame$
            .map<IGLRenderHash>(
                (frame: IFrame): IGLRenderHash => {
                    let renderHash: IGLRenderHash = createGLRenderHash(frame.id, true);

                    return renderHash;
                })
            .subscribe(glRenderer.render$);

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);

        renderCamera.frameId = 2;
        renderServiceMock.renderCameraFrame$.onNext(renderCamera);
        frame$.onNext(createFrame(2));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(2);
    });

    it("should clear when hash is cleared", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "clear");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frame$: rx.BehaviorSubject<IFrame> = new rx.BehaviorSubject<IFrame>(createFrame(1));

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Letterbox);
        renderCamera.frameId = 1;
        renderServiceMock.renderCameraFrame$ = new rx.BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(renderServiceMock);

        let frameSubscription: rx.IDisposable = frame$
            .map<IGLRenderHash>(
                (frame: IFrame): IGLRenderHash => {
                    let renderHash: IGLRenderHash = createGLRenderHash(frame.id, true);

                    return renderHash;
                })
            .subscribe(glRenderer.render$);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(1);

        frameSubscription.dispose();

        glRenderer.clear("mock");

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(2);
    });

    it("should not clear or render on frames when no renders registered", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "clear");
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Letterbox);
        renderCamera.frameId = 1;
        renderServiceMock.renderCameraFrame$ = new rx.BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(renderServiceMock);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(0);

        renderCamera.frameId = 2;
        renderServiceMock.renderCameraFrame$.onNext(renderCamera);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(0);
    });

    it("should not render frame if not needed", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frameId: number = 1;
        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Letterbox);
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$ = new rx.BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(renderServiceMock);

        glRenderer.render$.onNext(createGLRenderHash(frameId, true));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);

        frameId = 2;
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$.onNext(renderCamera);
        glRenderer.render$.onNext(createGLRenderHash(frameId, false));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);
    });

    it("should render frame if camera has changed", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frameId: number = 1;
        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Letterbox);
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$ = new rx.BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(renderServiceMock);

        glRenderer.render$.onNext(createGLRenderHash(frameId, true));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);

        frameId = 2;
        renderCamera.updateProjection();
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$.onNext(renderCamera);
        glRenderer.render$.onNext(createGLRenderHash(frameId, false));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(2);
    });

    it("should render on resize", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frameId: number = 1;
        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Letterbox);
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$ = new rx.BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(renderServiceMock);

        glRenderer.render$.onNext(createGLRenderHash(frameId, true));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);

        renderServiceMock.size$.onNext({ height: 1, width: 1});

        frameId = 2;
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$.onNext(renderCamera);
        glRenderer.render$.onNext(createGLRenderHash(frameId, false));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(2);
    });

    it("should not render a frame until all render hashes has submitted", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let hash1: string = "hash1";
        let hash2: string = "hash2";

        let frameId: number = 1;

        let renderServiceMock: RenderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Letterbox);
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$ = new rx.BehaviorSubject<RenderCamera>(renderCamera);

        let glRenderer: GLRenderer = new GLRenderer(renderServiceMock);

        let renderHash1: IGLRenderHash = createGLRenderHash(frameId, true, hash1);
        let renderHash2: IGLRenderHash = createGLRenderHash(frameId, true, hash2);

        glRenderer.render$.onNext(renderHash1);
        glRenderer.render$.onNext(renderHash2);

        spyOn(rendererMock, "clear");
        spyOn(rendererMock, "render");

        frameId = 2;
        renderCamera.frameId = frameId;
        renderServiceMock.renderCameraFrame$.onNext(renderCamera);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(0);

        renderHash1 = createGLRenderHash(frameId, true, hash1);
        renderHash2 = createGLRenderHash(frameId, true, hash2);

        glRenderer.render$.onNext(renderHash1);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(0);

        glRenderer.render$.onNext(renderHash2);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(1);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(2);
    });
});