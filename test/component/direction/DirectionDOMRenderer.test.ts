import { bootstrap } from "../../Bootstrap";
bootstrap();

import { ImageHelper } from "../../helper/ImageHelper";

import { Navigator } from "../../../src/viewer/Navigator";
import { Image } from "../../../src/graph/Image";
import { DirectionDOMRenderer } from "../../../src/component/direction/DirectionDOMRenderer";
import { DirectionConfiguration } from "../../../src/component/interfaces/DirectionConfiguration";
import { RenderCamera } from "../../../src/render/RenderCamera";
import { AnimationFrame } from "../../../src/state/interfaces/AnimationFrame";
import { FrameHelper } from "../../helper/FrameHelper";
import { RenderMode } from "../../../src/render/RenderMode";

describe("DirectionDOMRenderer.ctor", () => {
    it("should be defined", () => {
        let configuration: DirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        expect(renderer).toBeDefined();
    });
});

describe("DirectionDOMRenderer.needsRender", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should not need render when constructed", () => {
        let configuration: DirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        expect(renderer.needsRender).toBe(false);
    });

    it("should need render when image is set", () => {
        let configuration: DirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        let image: Image = new Image(helper.createCoreImageEnt());
        image.makeComplete(helper.createSpatialImageEnt());

        renderer.setImage(image);

        expect(renderer.needsRender).toBe(true);
    });

    it("should not need render after rendering", () => {
        let configuration: DirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        let image: Image = new Image(helper.createCoreImageEnt());
        image.makeComplete(helper.createSpatialImageEnt());

        renderer.setImage(image);

        expect(renderer.needsRender).toBe(true);

        let navigator: Navigator = new Navigator({
            apiClient: "clientid", container: "containerid",
        });

        renderer.render(navigator);

        expect(renderer.needsRender).toBe(false);
    });

    it("should not need render when setting render camera without image set", () => {
        let configuration: DirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Fill);
        renderCamera.camera.up.fromArray([0, 0, 1]);
        renderCamera.camera.lookat.fromArray([1, 1, 0]);
        renderer.setRenderCamera(renderCamera);

        expect(renderer.needsRender).toBe(false);
    });

    it("should not need render when setting configuration without image set", () => {
        let configuration: DirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        configuration.maxWidth = 300;
        renderer.setConfiguration(configuration);

        expect(renderer.needsRender).toBe(false);
    });

    it("should not need render when resizing without image set", () => {
        let configuration: DirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        renderer.resize({ height: 1, width: 1 });

        expect(renderer.needsRender).toBe(false);
    });

    it("should need render when setting changed render camera if image is set", () => {
        let configuration: DirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        let image: Image = new Image(helper.createCoreImageEnt());
        image.makeComplete(helper.createSpatialImageEnt());

        renderer.setImage(image);

        expect(renderer.needsRender).toBe(true);

        let navigator: Navigator = new Navigator({
            apiClient: "clientid", container: "containerid",
        });

        renderer.render(navigator);

        expect(renderer.needsRender).toBe(false);

        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Fill);
        const frame: AnimationFrame = new FrameHelper().createFrame();
        frame.state.camera.up.fromArray([0, 0, 1]);
        frame.state.camera.lookat.fromArray([1, 1, 0]);
        renderCamera.setFrame(frame);
        renderer.setRenderCamera(renderCamera);

        expect(renderer.needsRender).toBe(true);
    });

    it("should need render when setting changed configuration if image is set", () => {
        let configuration: DirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        let image: Image = new Image(helper.createCoreImageEnt());
        image.makeComplete(helper.createSpatialImageEnt());

        renderer.setImage(image);

        expect(renderer.needsRender).toBe(true);

        let navigator: Navigator = new Navigator({
            apiClient: "clientid", container: "containerid",
        });

        renderer.render(navigator);

        expect(renderer.needsRender).toBe(false);

        configuration.maxWidth = 300;
        renderer.setConfiguration(configuration);

        expect(renderer.needsRender).toBe(true);
    });

    it("should need render when resizing if image is set", () => {
        let configuration: DirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        let image: Image = new Image(helper.createCoreImageEnt());
        image.makeComplete(helper.createSpatialImageEnt());

        renderer.setImage(image);

        expect(renderer.needsRender).toBe(true);

        let navigator: Navigator = new Navigator({
            apiClient: "clientid", container: "containerid",
        });

        renderer.render(navigator);

        expect(renderer.needsRender).toBe(false);

        renderer.resize({ height: 1, width: 1 });

        expect(renderer.needsRender).toBe(true);
    });
});
