import { NodeHelper } from "../../helper/NodeHelper.spec";

import {
    DirectionDOMRenderer,
    IDirectionConfiguration,
} from "../../../src/Component";
import { Node } from "../../../src/Graph";
import {
    RenderCamera,
    RenderMode,
} from "../../../src/Render";
import { Navigator } from "../../../src/Viewer";
import { IFrame } from "../../../src/State";
import { FrameHelper } from "../../helper/FrameHelper.spec";

describe("DirectionDOMRenderer.ctor", () => {
    it("should be defined", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        expect(renderer).toBeDefined();
    });
});

describe("DirectionDOMRenderer.needsRender", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should not need render when constructed", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        expect(renderer.needsRender).toBe(false);
    });

    it("should need render when node is set", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        let node: Node = new Node(helper.createCoreNode());
        node.makeFull(helper.createFillNode());

        renderer.setNode(node);

        expect(renderer.needsRender).toBe(true);
    });

    it("should not need render after rendering", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        let node: Node = new Node(helper.createCoreNode());
        node.makeFull(helper.createFillNode());

        renderer.setNode(node);

        expect(renderer.needsRender).toBe(true);

        let navigator: Navigator = new Navigator({
            apiClient: "clientid", container: "containerid",
        });

        renderer.render(navigator);

        expect(renderer.needsRender).toBe(false);
    });

    it("should not need render when setting render camera without node set", () => {
        let configuration: IDirectionConfiguration = {
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

    it("should not need render when setting configuration without node set", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        configuration.maxWidth = 300;
        renderer.setConfiguration(configuration);

        expect(renderer.needsRender).toBe(false);
    });

    it("should not need render when resizing without node set", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        renderer.resize({ height: 1, width: 1 });

        expect(renderer.needsRender).toBe(false);
    });

    it("should need render when setting changed render camera if node is set", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        let node: Node = new Node(helper.createCoreNode());
        node.makeFull(helper.createFillNode());

        renderer.setNode(node);

        expect(renderer.needsRender).toBe(true);

        let navigator: Navigator = new Navigator({
            apiClient: "clientid", container: "containerid",
        });

        renderer.render(navigator);

        expect(renderer.needsRender).toBe(false);

        let renderCamera: RenderCamera = new RenderCamera(1, 1, RenderMode.Fill);
        const frame: IFrame = new FrameHelper().createFrame();
        frame.state.camera.up.fromArray([0, 0, 1]);
        frame.state.camera.lookat.fromArray([1, 1, 0]);
        renderCamera.setFrame(frame);
        renderer.setRenderCamera(renderCamera);

        expect(renderer.needsRender).toBe(true);
    });

    it("should need render when setting changed configuration if node is set", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        let node: Node = new Node(helper.createCoreNode());
        node.makeFull(helper.createFillNode());

        renderer.setNode(node);

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

    it("should need render when resizing if node is set", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, { height: 1, width: 1 });

        let node: Node = new Node(helper.createCoreNode());
        node.makeFull(helper.createFillNode());

        renderer.setNode(node);

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
