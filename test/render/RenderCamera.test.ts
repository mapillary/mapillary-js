import { PerspectiveCamera } from "three";
import { RenderCamera } from "../../src/render/RenderCamera";
import { RenderMode } from "../../src/render/RenderMode";
import { AnimationFrame } from "../../src/state/interfaces/AnimationFrame";
import { FrameHelper } from "../helper/FrameHelper";

describe("RenderCamera.ctor", () => {
    it("should be defined", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        expect(renderCamera).toBeDefined();
    });

    it("should initialize view matrix", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        const perspective = renderCamera.perspective;
        const camera = renderCamera.camera;

        expect(perspective.position.x).toBe(camera.position.x);
        expect(perspective.position.y).toBe(camera.position.y);
        expect(perspective.position.z).toBe(camera.position.z);
        expect(perspective.up.x).toBe(camera.up.x);
        expect(perspective.up.y).toBe(camera.up.y);
        expect(perspective.up.z).toBe(camera.up.z);
    });

    it("should be changed", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        expect(renderCamera.changed).toBe(true);
    });

    it("should handle zero width and height", () => {
        const renderCamera = new RenderCamera(0, 0, RenderMode.Letterbox);

        expect(renderCamera).toBeDefined();
        expect(renderCamera.perspective.aspect).toBe(0);
    });

    it("should handle zero height", () => {
        const renderCamera = new RenderCamera(1, 0, RenderMode.Letterbox);

        expect(renderCamera).toBeDefined();
        expect(renderCamera.perspective.aspect).toBe(Number.POSITIVE_INFINITY);
    });
});

describe("RenderCamera.setSize", () => {
    it("should always be changed", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        renderCamera.setSize({ width: 1, height: 1 });

        expect(renderCamera.changed).toBe(true);
    });

    it("should handle zero width and height", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        renderCamera.setSize({ width: 0, height: 0 });

        expect(renderCamera.perspective.aspect).toBe(0);
    });

    it("should handle zero height", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        renderCamera.setSize({ width: 1, height: 0 });

        expect(renderCamera.perspective.aspect).toBe(Number.POSITIVE_INFINITY);
    });
});

describe("RenderCamera.setRenderMode", () => {
    it("should always be changed", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        renderCamera.setRenderMode(RenderMode.Fill);

        const frame: AnimationFrame = new FrameHelper().createFrame();
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
        const renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        const frame: AnimationFrame = new FrameHelper().createFrame();
        renderCamera.setFrame(frame);

        expect(renderCamera.changed).toBe(true);

        frame.id = 1;
        renderCamera.setFrame(frame);

        expect(renderCamera.changed).toBe(false);
    });

    it("should be changed when size has been updated", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        renderCamera.setSize({ width: 1, height: 1 });
        renderCamera.setFrame(new FrameHelper().createFrame());

        expect(renderCamera.changed).toBe(true);
    });

    it("should not be changed when multiple frame ids are set after size has been updated", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        renderCamera.setSize({ width: 1, height: 1 });

        const frame: AnimationFrame = new FrameHelper().createFrame();
        frame.id = 0;
        renderCamera.setFrame(frame);
        frame.id = 1;
        renderCamera.setFrame(frame);

        expect(renderCamera.changed).toBe(false);
    });
});

describe("RenderCamera.perspective.fov", () => {
    it("should be set initially", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        expect(renderCamera.perspective.fov).toBeDefined();
        expect(renderCamera.perspective.fov).toBeGreaterThan(0);
    });

    it("should be updated when setting frame", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);
        const initialFov = renderCamera.perspective.fov;

        renderCamera.setFrame(new FrameHelper().createFrame());

        expect(renderCamera.perspective.fov).not.toBe(initialFov);
    });

    it("should increase when changing from fill to letterbox", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Fill);
        console.error(renderCamera.perspective.fov);
        const frame = new FrameHelper().createFrame();
        console.error(frame);
        renderCamera.setFrame(new FrameHelper().createFrame());
        const fov = renderCamera.perspective.fov;

        renderCamera.setRenderMode(RenderMode.Letterbox);

        expect(renderCamera.perspective.fov).toBeGreaterThanOrEqual(fov);
    });

    it("should decrease when increasing aspect", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Fill);
        renderCamera.setFrame(new FrameHelper().createFrame());
        const fov = renderCamera.perspective.fov;

        renderCamera.setSize({ width: 5, height: 1 });

        expect(renderCamera.perspective.fov).toBeLessThanOrEqual(fov);
    });

    it("should be constant when decreasing aspect", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Fill);
        renderCamera.setFrame(new FrameHelper().createFrame());
        renderCamera.setSize({ width: 0.5, height: 1 });
        const fov = renderCamera.perspective.fov;

        renderCamera.setSize({ width: 0.1, height: 1 });

        expect(renderCamera.perspective.fov).toBe(fov);
    });

    it("should decrease when increasing zoom", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Fill);
        renderCamera.setFrame(new FrameHelper().createFrame());
        const fov = renderCamera.perspective.fov;

        const frame: AnimationFrame = new FrameHelper().createFrame();
        frame.state.zoom = 1;
        renderCamera.setFrame(frame);

        expect(renderCamera.perspective.fov).toBeLessThan(fov);
    });
});

describe("RenderCamera.setProjectionMatrix", () => {
    it("should update perspective projection matrix", () => {
        const renderCamera = new RenderCamera(1, 1, RenderMode.Letterbox);

        const initial = renderCamera.perspective.projectionMatrix.toArray();

        const updated = new PerspectiveCamera(30, 3, 0.1, 1000)
            .projectionMatrix
            .toArray();

        renderCamera.setProjectionMatrix(updated);

        expect(renderCamera.perspective.projectionMatrix.toArray())
            .not.toEqual(initial);
        expect(renderCamera.perspective.projectionMatrix.toArray())
            .toEqual(updated);
    });
});
