/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {
    GLRenderer,
    GLRenderStage,
    IGLRender,
    IGLRenderFunction,
    IGLRenderHash,
} from "../../src/Render";
import {IFrame} from "../../src/State";

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
    it("should be created on first render", () => {
        let rendererMock: RendererMock = new RendererMock();

        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let element: HTMLDivElement = document.createElement("div");

        let glRenderer: GLRenderer = new GLRenderer(element, rx.Observable.empty<IFrame>());

        let renderFunction: IGLRenderFunction = (pc: THREE.PerspectiveCamera, r: THREE.WebGLRenderer): void => { };
        let render: IGLRender = {
            frameId: 0,
            needsRender: false,
            render: renderFunction,
            stage: GLRenderStage.Background,
        }
        let renderHash: IGLRenderHash = {
            name: "mock",
            render: render,
        }

        glRenderer.render$.onNext(renderHash);

        expect(THREE.WebGLRenderer).toHaveBeenCalled();
    });
});