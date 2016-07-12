/// <reference path="../../typings/index.d.ts" />

import {Camera, Spatial} from "../../src/Geo";
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

describe("RenderCamera.perspective.fov", () => {
    let precision: number = 1e-8;
    let spatial: Spatial = new Spatial();

    /**
     * fov = 2 arctan(d / 2f)
     */
    let getVerticalFov: (d: number, focal: number) => number = (d: number, focal: number): number => {
        return spatial.radToDeg(2 * Math.atan(d / (2 * focal)));
    };

    let createRenderCamera: (
        focal: number,
        zoom: number,
        perspectiveAspect: number,
        nodeAspect: number,
        renderMode: RenderMode) => RenderCamera = (
        focal: number,
        zoom: number,
        perspectiveAspect: number,
        nodeAspect: number,
        renderMode: RenderMode): RenderCamera => {

        let renderCamera: RenderCamera = new RenderCamera(1, renderMode);

        renderCamera.zoom = zoom;
        renderCamera.alpha = 1;
        renderCamera.camera.focal = focal;

        renderCamera.currentPano = false;
        renderCamera.previousPano = false;

        renderCamera.perspective.aspect = perspectiveAspect;

        renderCamera.currentAspect = nodeAspect;
        renderCamera.previousAspect = nodeAspect;

        renderCamera.updateProjection();

        return renderCamera;
    };

    it("should be correct in letterbox for perspective aspect 1:1 and node aspect 1:1", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 1 / 1;
        let nodeAspect: number = 1 / 1;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 1;

        expect(renderCamera.perspective.fov).toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in letterbox for perspective aspect 1:1 and node aspect 1:2", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 1 / 1;
        let nodeAspect: number = 1 / 2;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 1;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in letterbox for perspective aspect 1:2 and node aspect 1:4", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 1 / 2;
        let nodeAspect: number = 1 / 4;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 1;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in letterbox for perspective aspect 1:1 and node aspect 1:4", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 1 / 1;
        let nodeAspect: number = 1 / 4;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 1;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in letterbox for perspective aspect 2:1 and node aspect 1:1", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 2 / 1;
        let nodeAspect: number = 1 / 1;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 1;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in letterbox for perspective aspect 4:1 and node aspect 2:1", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 4 / 1;
        let nodeAspect: number = 2 / 1;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 0.5;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in letterbox for perspective aspect 4:1 and node aspect 1:1", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 4 / 1;
        let nodeAspect: number = 1 / 1;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 1;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in letterbox for perspective aspect 1:1 and node aspect 2:1", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 1 / 1;
        let nodeAspect: number = 2 / 1;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 1;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in letterbox for perspective aspect 2:1 and node aspect 4:1", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 2 / 1;
        let nodeAspect: number = 4 / 1;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 0.5;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in letterbox for perspective aspect 1:1 and node aspect 4:1", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 1 / 1;
        let nodeAspect: number = 4 / 1;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 1;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in letterbox for perspective aspect 1:2 and node aspect 1:1", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 1 / 2;
        let nodeAspect: number = 1 / 1;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 2;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in letterbox for perspective aspect 1:4 and node aspect 1:2", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 1 / 4;
        let nodeAspect: number = 1 / 2;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 2;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in letterbox for perspective aspect 1:4 and node aspect 1:1", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 1 / 4;
        let nodeAspect: number = 1 / 1;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 4;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct for zoom level 1", () => {
        let focal: number = 1;
        let zoom: number = 1;
        let perspectiveAspect: number = 1 / 1;
        let nodeAspect: number = 1 / 1;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 0.5;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct for zoom level 2", () => {
        let focal: number = 1;
        let zoom: number = 2;
        let perspectiveAspect: number = 1 / 1;
        let nodeAspect: number = 1 / 1;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Letterbox
        );

        let d: number = 0.25;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });


    it("should be correct in fill for perspective aspect 1:1 and node aspect 1:1", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 1 / 1;
        let nodeAspect: number = 1 / 1;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Fill
        );

        let d: number = 1;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in fill for perspective aspect 1:2 and node aspect 1:4", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 1 / 2;
        let nodeAspect: number = 1 / 4;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Fill
        );

        let d: number = 0.5;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in fill for perspective aspect 4:1 and node aspect 2:1", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 4 / 1;
        let nodeAspect: number = 2 / 1;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Fill
        );

        let d: number = 0.25;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in fill for perspective aspect 2:1 and node aspect 4:1", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 2 / 1;
        let nodeAspect: number = 4 / 1;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Fill
        );

        let d: number = 0.25;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });

    it("should be correct in letterbox for perspective aspect 1:4 and node aspect 1:2", () => {
        let focal: number = 1;
        let zoom: number = 0;
        let perspectiveAspect: number = 1 / 4;
        let nodeAspect: number = 1 / 2;

        let renderCamera: RenderCamera = createRenderCamera(
            focal,
            zoom,
            perspectiveAspect,
            nodeAspect,
            RenderMode.Fill
        );

        let d: number = 1;

        expect(renderCamera.perspective.fov)
            .toBeCloseTo(getVerticalFov(d, focal), precision);
    });
});
