/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {
    GLRenderer,
    GLRenderStage,
    GLRenderMode,
    IGLRender,
    IGLRenderFunction,
    IGLRenderHash,
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

describe("GLRenderer.ctor", () => {
    it("should be contructed", () => {
        let element: HTMLDivElement = document.createElement("div");
        let glRenderer: GLRenderer = new GLRenderer(element, rx.Observable.empty<IFrame>());

        expect(glRenderer).not.toBeNull();
    });

    it("should not instantiate a WebGL context", () => {
        spyOn(THREE, "WebGLRenderer");

        let element: HTMLDivElement = document.createElement("div");
        let glRenderer: GLRenderer = new GLRenderer(element, rx.Observable.empty<IFrame>());

        expect(THREE.WebGLRenderer).not.toHaveBeenCalled();
    });
});

describe("GLRenderer.renderer", () => {
    let createGLRenderer = (frame$?: rx.Observable<IFrame>): GLRenderer => {
        let element: HTMLDivElement = document.createElement("div");
        let glRenderer: GLRenderer = new GLRenderer(element, !!frame$ ? frame$ : rx.Observable.empty<IFrame>());

        return glRenderer;
    };

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
            currentTransform: null,
            previousTransform: null,
        }

        spyOn(state, "currentNode").and.returnValue({ });
        spyOn(state, "currentTransform").and.returnValue({ });
        spyOn(state, "previousNode").and.returnValue({ });
        spyOn(state, "previousTransform").and.returnValue({ });

        return { id: frameId, state: state };
    }

    it("should be created on first render", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let glRenderer: GLRenderer = createGLRenderer();
        let renderHash: IGLRenderHash = createGLRenderHash(0, true);

        glRenderer.render$.onNext(renderHash);

        expect(THREE.WebGLRenderer).toHaveBeenCalled();
    });

    it("should render", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let glRenderer: GLRenderer = createGLRenderer();
        let renderHash: IGLRenderHash = createGLRenderHash(0, true);

        glRenderer.render$.onNext(renderHash);

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);
    });

    it("should only render once for the same frame id", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let glRenderer: GLRenderer = createGLRenderer();
        let renderHash: IGLRenderHash = createGLRenderHash(0, true);

        glRenderer.render$.onNext(renderHash);
        glRenderer.render$.onNext(renderHash);

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);
    });

    it("should render twice for two frame ids", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frame$: rx.BehaviorSubject<IFrame> = new rx.BehaviorSubject<IFrame>(createFrame(1));
        let glRenderer: GLRenderer = createGLRenderer(frame$);

        let frameSubscription: rx.IDisposable = frame$
            .map<IGLRenderHash>(
                (frame: IFrame): IGLRenderHash => {
                    let renderHash: IGLRenderHash = createGLRenderHash(frame.id, true);

                    return renderHash;
                })
            .subscribe(glRenderer.render$);

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);

        frame$.onNext(createFrame(2));
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(2);
    });

    it("should clear when hash is cleared", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "clear");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frame$: rx.BehaviorSubject<IFrame> = new rx.BehaviorSubject<IFrame>(createFrame(1));
        let glRenderer: GLRenderer = createGLRenderer(frame$);

        let frameSubscription: rx.IDisposable = frame$
            .map<IGLRenderHash>(
                (frame: IFrame): IGLRenderHash => {
                    let renderHash: IGLRenderHash = createGLRenderHash(frame.id, true);

                    return renderHash;
                })
            .subscribe(glRenderer.render$);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(1);

        frameSubscription.dispose();

        frame$.onNext(createFrame(2));

        glRenderer.clear("mock");
        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(2);
    });

    it("should not clear or render on frames when no renders registered", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "clear");
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frame$: rx.BehaviorSubject<IFrame> = new rx.BehaviorSubject<IFrame>(createFrame(1));
        let glRenderer: GLRenderer = createGLRenderer(frame$);

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(0);

        frame$.onNext(createFrame(2));

        expect((<jasmine.Spy>rendererMock.clear).calls.count()).toBe(0);
        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(0);
    });

    it("should not render frame if not needed", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frameId: number = 1;
        let frame$: rx.BehaviorSubject<IFrame> = new rx.BehaviorSubject<IFrame>(createFrame(frameId));
        let glRenderer: GLRenderer = createGLRenderer(frame$);

        glRenderer.render$.onNext(createGLRenderHash(frameId, true));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);

        frameId = 2;
        frame$.onNext(createFrame(frameId));
        glRenderer.render$.onNext(createGLRenderHash(frameId, false));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);
    });

    it("should render frame if camera has changed", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frameId: number = 1;
        let frame$: rx.BehaviorSubject<IFrame> = new rx.BehaviorSubject<IFrame>(createFrame(frameId));
        let glRenderer: GLRenderer = createGLRenderer(frame$);

        glRenderer.render$.onNext(createGLRenderHash(frameId, true));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);

        frameId = 2;
        let frame: IFrame = createFrame(frameId);
        frame.state.camera.position.copy(new THREE.Vector3(1, 1, 1));

        frame$.onNext(frame);
        glRenderer.render$.onNext(createGLRenderHash(frameId, false));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(2);
    });

    it("should render on resize", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frameId: number = 1;
        let frame$: rx.BehaviorSubject<IFrame> = new rx.BehaviorSubject<IFrame>(createFrame(frameId));
        let glRenderer: GLRenderer = createGLRenderer(frame$);

        glRenderer.render$.onNext(createGLRenderHash(frameId, true));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);

        glRenderer.resize();

        frameId = 2;
        frame$.onNext(createFrame(frameId));
        glRenderer.render$.onNext(createGLRenderHash(frameId, false));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(2);
    });

    it("should render on changed render mode", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(rendererMock, "render");
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let frameId: number = 1;
        let frame$: rx.BehaviorSubject<IFrame> = new rx.BehaviorSubject<IFrame>(createFrame(frameId));
        let glRenderer: GLRenderer = createGLRenderer(frame$);

        glRenderer.render$.onNext(createGLRenderHash(frameId, true));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(1);

        glRenderer.setRenderMode(GLRenderMode.Fill);

        frameId = 2;
        frame$.onNext(createFrame(frameId));
        glRenderer.render$.onNext(createGLRenderHash(frameId, false));

        expect((<jasmine.Spy>rendererMock.render).calls.count()).toBe(2);
    });

    it("should not render a frame until all render hashes has submitted", () => {
        let rendererMock: RendererMock = new RendererMock();
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let hash1: string = "hash1";
        let hash2: string = "hash2";

        let frameId: number = 1;

        let frame$: rx.BehaviorSubject<IFrame> = new rx.BehaviorSubject<IFrame>(createFrame(frameId));
        let glRenderer: GLRenderer = createGLRenderer(frame$);

        let renderHash1: IGLRenderHash = createGLRenderHash(frameId, true, hash1);
        let renderHash2: IGLRenderHash = createGLRenderHash(frameId, true, hash2);

        glRenderer.render$.onNext(renderHash1);
        glRenderer.render$.onNext(renderHash2);

        spyOn(rendererMock, "clear");
        spyOn(rendererMock, "render");

        frameId = 2;
        frame$.onNext(createFrame(frameId));

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