/// <reference path="../../typings/index.d.ts" />

import {GLRendererMockCreator} from "../helper/GLRendererMockCreator.spec";
import {MockCreator} from "../helper/MockCreator.spec";

import {ImageTileLoader} from "../../src/API";
import {
    GLRenderer,
    TextureRenderer,
} from "../../src/Render";

describe("TextureRenderer.ctor", () => {
    it("should be contructed", () => {
        let glRendererMock: GLRenderer = new GLRendererMockCreator().createMock();
        let imageTileFetcher: ImageTileLoader = new MockCreator().createMock(ImageTileLoader, "ImageTileFetcher");

        let textureRenderer: TextureRenderer = new TextureRenderer(glRendererMock, imageTileFetcher);

        expect(textureRenderer).toBeDefined();
    });
});
