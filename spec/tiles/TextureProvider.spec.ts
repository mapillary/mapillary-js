/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {MockCreator} from "../helper/MockCreator.spec";

import {
    ImageTileLoader,
    TextureProvider,
} from "../../src/Tiles";

class RendererMock implements THREE.Renderer {
    public domElement: HTMLCanvasElement = document.createElement("canvas");

    public render(s: THREE.Scene, c: THREE.Camera, t?: THREE.WebGLRenderTarget): void { return; }
    public setRenderTarget(t?: THREE.WebGLRenderTarget): void { return; }
    public setSize(w: number, h: number, updateStyle?: boolean): void { return; }
}

describe("TextureRenderer.ctor", () => {
    it("should be contructed", () => {
        let imageTileLoader: ImageTileLoader = new MockCreator().createMock(ImageTileLoader, "ImageTileLoader");
        let rendererMock: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(THREE, "WebGLRenderer").and.returnValue(rendererMock);

        let textureRenderer: TextureProvider = new TextureProvider(1, 1, new Image(), imageTileLoader, rendererMock);

        expect(textureRenderer).toBeDefined();
    });
});
