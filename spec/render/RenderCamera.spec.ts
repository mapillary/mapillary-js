/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {Camera} from "../../src/Geo";
import {RenderCamera, RenderMode} from "../../src/Render";

describe("RenderCamera.ctor", () => {
    it("should be defined", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Letterbox);

        expect(renderCamera).toBeDefined();
    });
});

describe("RenderCamera.updateProjection", () => {
    it("should not be changed when not updated", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Letterbox);

        renderCamera.frameId = 0;

        expect(renderCamera.changed).toBe(false);
    });

    it("should be changed when projection has been updated", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Letterbox);

        renderCamera.updateProjection();
        renderCamera.frameId = 0;

        expect(renderCamera.changed).toBe(true);
    });

    it("should not be changed when multiple frame ids are set after projection has been updated", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Letterbox);

        renderCamera.updateProjection();
        renderCamera.frameId = 0;
        renderCamera.frameId = 1;

        expect(renderCamera.changed).toBe(false);
    });
});

describe("RenderCamera.updatePrespective", () => {
    it("should be changed when not updated", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Letterbox);

        renderCamera.updatePerspective(new Camera());
        renderCamera.frameId = 0;

        expect(renderCamera.changed).toBe(true);
    });
});
