import { empty as observableEmpty, BehaviorSubject, Subscription, Subject } from "rxjs";

import { map } from "rxjs/operators";
import * as THREE from "three";
import { GLRenderer } from "../../src/render/GLRenderer";
import { RenderPass } from "../../src/render/RenderPass";
import { GLFrameRenderer } from "../../src/render/interfaces/GLFrameRenderer";
import { GLRenderFunction } from "../../src/render/interfaces/GLRenderFunction";
import { GLRenderHash } from "../../src/render/interfaces/IGLRenderHash";
import { ViewportSize } from "../../src/render/interfaces/ViewportSize";
import { RenderCamera } from "../../src/render/RenderCamera";
import { RenderMode } from "../../src/render/RenderMode";
import { RenderService } from "../../src/render/RenderService";
import { AnimationFrame } from "../../src/state/interfaces/AnimationFrame";
import { FrameHelper } from "../helper/FrameHelper";
import { RendererMock } from "../helper/WebGLRenderer";


class RenderServiceMock extends RenderService {
    private _sizeMock$: Subject<ViewportSize> = new Subject<ViewportSize>();
    private _renderModeMock$: Subject<RenderMode> = new Subject<RenderMode>();
    private _renderCameraFrameMock$: Subject<RenderCamera> = new Subject<RenderCamera>();

    constructor(element: HTMLElement) {
        super(element, observableEmpty(), RenderMode.Letterbox);
    }

    public get size$(): Subject<ViewportSize> {
        return this._sizeMock$;
    }

    public set size$(value: Subject<ViewportSize>) {
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
        spyOn(THREE, "WebGLRenderer");

        let element: HTMLDivElement = document.createElement("div");
        let canvasContainer: HTMLElement = document.createElement("div");
        let canvas = document.createElement("canvas");
        let renderService: RenderService = new RenderServiceMock(element);
        let glRenderer = new GLRenderer(canvas, canvasContainer, renderService);

        expect(glRenderer).toBeDefined();
    });

    it("should not instantiate a WebGL context", () => {
        spyOn(THREE, "WebGLRenderer");

        let element: HTMLDivElement = document.createElement("div");
        let canvasContainer: HTMLElement = document.createElement("div");
        let canvas = document.createElement("canvas");
        let renderService: RenderService = new RenderServiceMock(element);
        let glRenderer = new GLRenderer(canvas, canvasContainer, renderService);

        expect(glRenderer).toBeDefined();

        expect(THREE.WebGLRenderer).not.toHaveBeenCalled();
    });
});

describe("GLRenderer.renderer", () => {
    let createGLRenderHash: (frameId: number, needsRender: boolean, name?: string) => GLRenderHash =
        (frameId: number, needsRender: boolean, name?: string): GLRenderHash => {
            let renderFunction: GLRenderFunction =
                (pc: THREE.PerspectiveCamera, r: THREE.WebGLRenderer): void => {
                    r.render(new THREE.Scene(), pc);
                };

            let render: GLFrameRenderer = {
                frameId: frameId,
                needsRender: needsRender,
                render: renderFunction,
                pass: RenderPass.Background,
            };

            let renderHash = {
                name: name != null ? name : "mock",
                renderer: render,
            };

            return renderHash;
        };

    it("should be created on first render", () => {
        const renderer = new RendererMock();
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        let canvas = document.createElement("canvas");
        let renderServiceMock = new RenderServiceMock(document.createElement("div"));
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);
        let renderHash = createGLRenderHash(0, true);

        glRenderer.render$.next(renderHash);

        expect(THREE.WebGLRenderer).toHaveBeenCalled();
    });

    it("should render on new hash", () => {
        const renderer = new RendererMock();
        spyOn(renderer, "render");
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        let canvas = document.createElement("canvas");
        let renderServiceMock = new RenderServiceMock(document.createElement("div"));
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);

        let renderHash = createGLRenderHash(0, true);
        glRenderer.render$.next(renderHash);

        let renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        const frame = new FrameHelper().createFrame();
        frame.id = 0;
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$.next(renderCamera);

        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(1);
    });

    it("should only render once for the same frame id", () => {
        const renderer = new RendererMock();
        spyOn(renderer, "render");
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        let canvas = document.createElement("canvas");
        let renderServiceMock = new RenderServiceMock(document.createElement("div"));
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);

        let renderHash = createGLRenderHash(0, true);
        glRenderer.render$.next(renderHash);

        let renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        const frame = new FrameHelper().createFrame();
        frame.id = 0;
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$.next(renderCamera);

        glRenderer.render$.next(renderHash);

        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(1);
    });

    it("should render twice for two frame ids", () => {
        const renderer = new RendererMock();
        spyOn(renderer, "render");
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        const frame = new FrameHelper().createFrame();
        frame.id = 1;
        let frame$ = new BehaviorSubject<AnimationFrame>(frame);

        let renderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let canvas = document.createElement("canvas");
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);

        frame$.pipe(
            map(
                (f: AnimationFrame): GLRenderHash => {
                    let renderHash = createGLRenderHash(f.id, true);

                    return renderHash;
                }))
            .subscribe(glRenderer.render$);

        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(1);

        frame.id = 2;
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$.next(renderCamera);
        frame$.next(frame);

        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(2);
    });

    it("should clear when hash is cleared", () => {
        const renderer = new RendererMock();
        spyOn(renderer, "clear");
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        const frame = new FrameHelper().createFrame();
        frame.id = 1;
        let frame$ = new BehaviorSubject<AnimationFrame>(frame);

        let renderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let canvas = document.createElement("canvas");
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);

        let frameSubscription = frame$.pipe(
            map(
                (f: AnimationFrame): GLRenderHash => {
                    let renderHash = createGLRenderHash(f.id, true);

                    return renderHash;
                }))
            .subscribe(glRenderer.render$);

        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(1);

        frameSubscription.unsubscribe();

        glRenderer.clear("mock");

        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(3);
    });

    it("should not clear or render on frames when no renders registered", () => {
        const renderer = new RendererMock();
        spyOn(renderer, "clear");
        spyOn(renderer, "render");
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        let renderServiceMock = new RenderServiceMock(document.createElement("div"));

        let renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        const frame = new FrameHelper().createFrame();
        frame.id = 1;
        renderCamera.setFrame(frame);

        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let canvas = document.createElement("canvas");
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);

        expect(glRenderer).toBeDefined();

        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(0);

        frame.id = 2;
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$.next(renderCamera);

        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(0);
    });

    it("should not render frame if not needed", () => {
        const renderer = new RendererMock();
        spyOn(renderer, "render");
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        let renderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        const frame = new FrameHelper().createFrame();
        frame.id = 1;
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let canvas = document.createElement("canvas");
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);

        glRenderer.render$.next(createGLRenderHash(frame.id, true));

        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(1);

        frame.id = 2;
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$.next(renderCamera);
        glRenderer.render$.next(createGLRenderHash(frame.id, false));

        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(1);
    });

    it("should not render again on same frame if triggered", () => {
        const renderer = new RendererMock();
        spyOn(renderer, "clear");
        spyOn(renderer, "resetState");
        spyOn(renderer, "setClearColor");
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        const frame = new FrameHelper().createFrame();
        frame.id = 1;

        let renderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let canvas = document.createElement("canvas");
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);

        glRenderer.render$.next(createGLRenderHash(frame.id, true));

        expect((<jasmine.Spy>renderer.resetState).calls.count()).toBe(1);
        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(1);
        expect((<jasmine.Spy>renderer.setClearColor).calls.count()).toBe(1);

        glRenderer.triggerRerender();

        expect((<jasmine.Spy>renderer.resetState).calls.count()).toBe(1);
        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(1);
        expect((<jasmine.Spy>renderer.setClearColor).calls.count()).toBe(1);
    });

    it("should render on next frame if triggered", () => {
        const renderer = new RendererMock();
        spyOn(renderer, "clear");
        spyOn(renderer, "resetState");
        spyOn(renderer, "setClearColor");
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        const frame = new FrameHelper().createFrame();
        frame.id = 1;

        let renderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let canvas = document.createElement("canvas");
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);

        glRenderer.render$.next(createGLRenderHash(frame.id, true));

        expect((<jasmine.Spy>renderer.resetState).calls.count()).toBe(1);
        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(1);
        expect((<jasmine.Spy>renderer.setClearColor).calls.count()).toBe(1);

        glRenderer.triggerRerender();

        frame.id = 2;
        renderCamera.setFrame(frame)
        renderServiceMock.renderCameraFrame$.next(renderCamera);
        glRenderer.render$.next(createGLRenderHash(frame.id, false));

        expect((<jasmine.Spy>renderer.resetState).calls.count()).toBe(2);
        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(2);
        expect((<jasmine.Spy>renderer.setClearColor).calls.count()).toBe(2);
    });

    it("should only render on next frame, not subsequent if triggered", () => {
        const renderer = new RendererMock();
        spyOn(renderer, "clear");
        spyOn(renderer, "resetState");
        spyOn(renderer, "setClearColor");
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        const frame = new FrameHelper().createFrame();
        frame.id = 1;

        let renderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let canvas = document.createElement("canvas");
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);

        glRenderer.render$.next(createGLRenderHash(frame.id, true));

        expect((<jasmine.Spy>renderer.resetState).calls.count()).toBe(1);
        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(1);
        expect((<jasmine.Spy>renderer.setClearColor).calls.count()).toBe(1);

        glRenderer.triggerRerender();

        frame.id = 2;
        renderCamera.setFrame(frame)
        renderServiceMock.renderCameraFrame$.next(renderCamera);
        glRenderer.render$.next(createGLRenderHash(frame.id, false));

        frame.id = 3;
        renderCamera.setFrame(frame)
        renderServiceMock.renderCameraFrame$.next(renderCamera);
        glRenderer.render$.next(createGLRenderHash(frame.id, false));

        expect((<jasmine.Spy>renderer.resetState).calls.count()).toBe(2);
        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(2);
        expect((<jasmine.Spy>renderer.setClearColor).calls.count()).toBe(2);
    });

    it("should emit to post render after render cycle", done => {
        const renderer = new RendererMock();
        spyOn(renderer, "clear");
        spyOn(renderer, "resetState");
        spyOn(renderer, "setClearColor");
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        const frame = new FrameHelper().createFrame();
        frame.id = 1;

        let renderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let canvas = document.createElement("canvas");
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);

        glRenderer.opaqueRender$.subscribe(
            () => {
                expect((<jasmine.Spy>renderer.resetState)
                    .calls.count()).toBe(1);
                expect((<jasmine.Spy>renderer.clear)
                    .calls.count()).toBe(1);
                expect((<jasmine.Spy>renderer.setClearColor)
                    .calls.count()).toBe(1);

                done();
            })

        glRenderer.render$.next(createGLRenderHash(frame.id, true));
    });

    it("should render frame if camera has changed", () => {
        const renderer = new RendererMock();
        spyOn(renderer, "render");
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        let renderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        const frame = new FrameHelper().createFrame();
        frame.id = 1;
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let canvas = document.createElement("canvas");
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);

        glRenderer.render$.next(createGLRenderHash(frame.id, true));

        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(1);

        frame.id = 2;
        renderCamera.setRenderMode(RenderMode.Letterbox);
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$.next(renderCamera);
        glRenderer.render$.next(createGLRenderHash(frame.id, false));

        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(2);
    });

    it("should render on resize", () => {
        const renderer = new RendererMock();
        spyOn(renderer, "render");
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        let renderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        const frame = new FrameHelper().createFrame();
        frame.id = 1;
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let canvas = document.createElement("canvas");
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);

        glRenderer.render$.next(createGLRenderHash(frame.id, true));

        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(1);

        renderServiceMock.size$.next({ height: 1, width: 1 });

        frame.id = 2;
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$.next(renderCamera);
        glRenderer.render$.next(createGLRenderHash(frame.id, false));

        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(2);
    });

    it("should not render a frame until all render hashes has submitted", () => {
        const renderer = new RendererMock();
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        let hash1: string = "hash1";
        let hash2: string = "hash2";

        let renderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        const frame = new FrameHelper().createFrame();
        frame.id = 1;
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let canvas = document.createElement("canvas");
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);

        let renderHash1 = createGLRenderHash(frame.id, true, hash1);
        let renderHash2 = createGLRenderHash(frame.id, true, hash2);

        glRenderer.render$.next(renderHash1);
        glRenderer.render$.next(renderHash2);

        spyOn(renderer, "clear");
        spyOn(renderer, "render");

        frame.id = 2;
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$.next(renderCamera);

        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(0);

        renderHash1 = createGLRenderHash(frame.id, true, hash1);
        renderHash2 = createGLRenderHash(frame.id, true, hash2);

        glRenderer.render$.next(renderHash1);

        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(0);

        glRenderer.render$.next(renderHash2);

        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(1);
        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(2);
    });

    it("should render when one of multiple render hashes is cleared", () => {
        const renderer = new RendererMock();
        spyOn(THREE, "WebGLRenderer")
            .and.returnValue(<THREE.WebGLRenderer><unknown>renderer);

        let hash1: string = "hash1";
        let hash2: string = "hash2";

        let renderServiceMock = new RenderServiceMock(document.createElement("div"));
        let renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        const frame = new FrameHelper().createFrame();
        frame.id = 1;
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$ = new BehaviorSubject<RenderCamera>(renderCamera);

        let canvas = document.createElement("canvas");
        let glRenderer = new GLRenderer(canvas, document.createElement("div"), renderServiceMock);

        let renderHash1 = createGLRenderHash(frame.id, true, hash1);
        let renderHash2 = createGLRenderHash(frame.id, true, hash2);

        glRenderer.render$.next(renderHash1);
        glRenderer.render$.next(renderHash2);

        spyOn(renderer, "clear");
        spyOn(renderer, "render");

        frame.id = 2;
        renderCamera.setFrame(frame);
        renderServiceMock.renderCameraFrame$.next(renderCamera);

        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(0);

        renderHash1 = createGLRenderHash(frame.id, false, hash1);
        glRenderer.render$.next(renderHash1);

        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(0);

        glRenderer.clear(hash2);

        expect((<jasmine.Spy>renderer.clear).calls.count()).toBe(1);
        expect((<jasmine.Spy>renderer.render).calls.count()).toBe(1);
    });
});
