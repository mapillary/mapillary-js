import {Camera, Spatial} from "../../src/Geo";
import {RenderCamera, RenderMode} from "../../src/Render";
import {FrameHelper} from "../helper/FrameHelper.spec";
import {IFrame} from "../../src/State";

describe("RenderCamera.ctor", () => {
    it("should be defined", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        expect(renderCamera).toBeDefined();
    });

    it("should be changed", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        expect(renderCamera.changed).toBe(true);
    });

    it("should handle zero width and height", () => {
        let renderCamera: RenderCamera = new RenderCamera(0, 0, RenderMode.Letterbox);

        expect(renderCamera).toBeDefined();
        expect(renderCamera.perspective.aspect).toBe(0);
    });

    it("should handle zero height", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, 0, RenderMode.Letterbox);

        expect(renderCamera).toBeDefined();
        expect(renderCamera.perspective.aspect).toBe(Number.POSITIVE_INFINITY);
    });
});

describe("RenderCamera.setSize", () => {
    it("should always be changed", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        renderCamera.setSize({ width: 1, height: 1 });

        expect(renderCamera.changed).toBe(true);
    });

    it("should handle zero width and height", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        renderCamera.setSize({ width: 0, height: 0});

        expect(renderCamera.perspective.aspect).toBe(0);
    });

    it("should handle zero height", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        renderCamera.setSize({ width: 1, height: 0 });

        expect(renderCamera.perspective.aspect).toBe(Number.POSITIVE_INFINITY);
    });
});

describe("RenderCamera.setRenderMode", () => {
    it("should always be changed", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        renderCamera.setRenderMode(RenderMode.Fill);

        const frame: IFrame = new FrameHelper().createFrame();
        renderCamera.setFrame(frame);

        expect(renderCamera.changed).toBe(true);

        frame.id = 1;
        renderCamera.setFrame(frame);

        expect(renderCamera.changed).toBe(false);

        renderCamera.setRenderMode(RenderMode.Fill);

        expect(renderCamera.changed).toBe(false);

        frame.id = 2;
        renderCamera.setFrame(frame);

        expect(renderCamera.changed).toBe(true);
    });
});

describe("RenderCamera.setFrame", () => {
    it("should not be changed when not updated", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        const frame: IFrame = new FrameHelper().createFrame();
        renderCamera.setFrame(frame);

        expect(renderCamera.changed).toBe(true);

        frame.id = 1;
        renderCamera.setFrame(frame);

        expect(renderCamera.changed).toBe(false);
    });

    it("should be changed when size has been updated", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        renderCamera.setSize({ width: 1, height: 1 });
        renderCamera.setFrame(new FrameHelper().createFrame());

        expect(renderCamera.changed).toBe(true);
    });

    it("should not be changed when multiple frame ids are set after size has been updated", () => {
        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        renderCamera.setSize({ width: 1, height: 1 });

        const frame: IFrame = new FrameHelper().createFrame();
        frame.id = 0;
        renderCamera.setFrame(frame);
        frame.id = 1;
        renderCamera.setFrame(frame);

        expect(renderCamera.changed).toBe(false);
    });
});

describe("RenderCamera.perspective.fov", () => {
    it("should be set initially", () => {
        const renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        expect(renderCamera.perspective.fov).toBeDefined();
        expect(renderCamera.perspective.fov).toBeGreaterThan(0);
    });

    it("should be updated when setting frame", () => {
        const renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        const initialFov: number = renderCamera.perspective.fov;

        renderCamera.setFrame(new FrameHelper().createFrame());

        expect(renderCamera.perspective.fov).not.toBe(initialFov);
    });

    it("should increase when changing from fill to letterbox", () => {
        const renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Fill);

        renderCamera.setFrame(new FrameHelper().createFrame());

        const fov: number = renderCamera.perspective.fov;

        renderCamera.setRenderMode(RenderMode.Letterbox);

        expect(renderCamera.perspective.fov).toBeGreaterThan(fov);
    });

    it("should decrease when increasing aspect", () => {
        const renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Fill);

        renderCamera.setFrame(new FrameHelper().createFrame());

        const fov: number = renderCamera.perspective.fov;

        renderCamera.setSize({ width: 5, height: 1 });

        expect(renderCamera.perspective.fov).toBeLessThan(fov);
    });

    it("should be constant when decreasing aspect", () => {
        const renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Fill);

        renderCamera.setFrame(new FrameHelper().createFrame());

        renderCamera.setSize({ width: 0.5, height: 1 });

        const fov: number = renderCamera.perspective.fov;

        renderCamera.setSize({ width: 0.1, height: 1 });

        expect(renderCamera.perspective.fov).toBe(fov);
    });

    it("should decrease when increasing zoom", () => {
        const renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Fill);

        renderCamera.setFrame(new FrameHelper().createFrame());

        const fov: number = renderCamera.perspective.fov;

        const frame: IFrame = new FrameHelper().createFrame();
        frame.state.zoom = 1;
        renderCamera.setFrame(frame);

        expect(renderCamera.perspective.fov).toBeLessThan(fov);
    });
});
