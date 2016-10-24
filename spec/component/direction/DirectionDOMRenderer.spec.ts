/// <reference path="../../../typings/index.d.ts" />

import {ICoreNode, IFillNode} from "../../../src/API";
import {
    DirectionDOMRenderer,
    IDirectionConfiguration,
} from "../../../src/Component";
import {Node} from "../../../src/Graph";
import {RenderCamera, RenderMode} from "../../../src/Render";
import {Navigator} from "../../../src/Viewer";

let createCoreNode: () => ICoreNode = (): ICoreNode => {
    return {
        cl: { lat: 0, lon: 0},
        key: "key",
        l: { lat: 0, lon: 0 },
        sequence: { key: "skey" },
    };
};

let createFillNode: () => IFillNode = (): IFillNode => {
    return {
        atomic_scale: 0,
        c_rotation: [0, 0, 0],
        ca: 0,
        calt: 0,
        captured_at: 0,
        cca: 0,
        cfocal: 0,
        gpano: null,
        height: 0,
        merge_cc: 0,
        merge_version: 0,
        orientation: 0,
        user: { key: "key", username: "username"},
        width: 0,
    };
};

describe("DirectionDOMRenderer.ctor", () => {
    it("should be defined", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let element: HTMLElement = document.createElement("div");
        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, element);

        expect(renderer).toBeDefined();
    });
});

describe("DirectionDOMRenderer.needsRender", () => {
    it("should not need render when constructed", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let element: HTMLElement = document.createElement("div");
        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, element);

        expect(renderer.needsRender).toBe(false);
    });

    it("should need render when node is set", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let element: HTMLElement = document.createElement("div");
        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, element);

        let node: Node = new Node(createCoreNode());
        node.makeFull(createFillNode());

        renderer.setNode(node);

        expect(renderer.needsRender).toBe(true);
    });

    it("should not need render after rendering", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let element: HTMLElement = document.createElement("div");
        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, element);

        let node: Node = new Node(createCoreNode());
        node.makeFull(createFillNode());

        renderer.setNode(node);

        expect(renderer.needsRender).toBe(true);

        let navigator: Navigator = new Navigator("");

        renderer.render(navigator);

        expect(renderer.needsRender).toBe(false);
    });

    it("should not need render when setting render camera without node set", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let element: HTMLElement = document.createElement("div");

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, element);

        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Fill);
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

        let element: HTMLElement = document.createElement("div");

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, element);

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

        let element: HTMLElement = document.createElement("div");

        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, element);

        renderer.resize(element);

        expect(renderer.needsRender).toBe(false);
    });

    it("should need render when setting changed render camera if node is set", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let element: HTMLElement = document.createElement("div");
        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, element);

        let node: Node = new Node(createCoreNode());
        node.makeFull(createFillNode());

        renderer.setNode(node);

        expect(renderer.needsRender).toBe(true);

        let navigator: Navigator = new Navigator("");

        renderer.render(navigator);

        expect(renderer.needsRender).toBe(false);

        let renderCamera: RenderCamera = new RenderCamera(1, RenderMode.Fill);
        renderCamera.camera.up.fromArray([0, 0, 1]);
        renderCamera.camera.lookat.fromArray([1, 1, 0]);
        renderer.setRenderCamera(renderCamera);

        expect(renderer.needsRender).toBe(true);
    });

    it("should need render when setting changed configuration if node is set", () => {
        let configuration: IDirectionConfiguration = {
            distinguishSequence: false,
            maxWidth: 200,
            minWidth: 100,
        };

        let element: HTMLElement = document.createElement("div");
        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, element);

        let node: Node = new Node(createCoreNode());
        node.makeFull(createFillNode());

        renderer.setNode(node);

        expect(renderer.needsRender).toBe(true);

        let navigator: Navigator = new Navigator("");

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

        let element: HTMLElement = document.createElement("div");
        let renderer: DirectionDOMRenderer = new DirectionDOMRenderer(configuration, element);

        let node: Node = new Node(createCoreNode());
        node.makeFull(createFillNode());

        renderer.setNode(node);

        expect(renderer.needsRender).toBe(true);

        let navigator: Navigator = new Navigator("");

        renderer.render(navigator);

        expect(renderer.needsRender).toBe(false);

        renderer.resize(element);

        expect(renderer.needsRender).toBe(true);
    });
});
