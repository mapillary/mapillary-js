import { bootstrap } from "../Bootstrap";
bootstrap();

import { Subject } from "rxjs";
import { WebGLRenderer } from "three";

import * as Container from "../../src/viewer/Container";
import * as Navigator from "../../src/viewer/Navigator";

import { CustomRenderer } from "../../src/viewer/CustomRenderer";
import { ContainerMockCreator } from "../helper/ContainerMockCreator";
import { MockCreator } from "../helper/MockCreator";
import { NavigatorMockCreator } from "../helper/NavigatorMockCreator";
import { RendererMock } from "../helper/WebGLRenderer";
import { ILatLonAlt } from "../../src/geo/interfaces/ILatLonAlt";
import { RenderCamera } from "../../src/render/RenderCamera";
import { RenderMode } from "../../src/render/RenderMode";

global.WebGL2RenderingContext = <any>jest.fn();

describe("CustomRenderer.ctor", () => {
    it("should be definded", () => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        expect(customRenderer).toBeDefined();
    });
});

describe("CustomRenderer.add", () => {
    it("should be added", () => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        const id = "id";

        expect(customRenderer.has(id)).toBe(false);

        customRenderer.add(
            {
                id,
                onAdd: () => { /* noop */ },
                onReferenceChanged: () => { /* noop */ },
                onRemove: () => { /* noop */ },
                render: () => { /* noop */ },
            },
            <any>{});

        expect(customRenderer.has(id)).toBe(true);
    });
});

describe("CustomRenderer.add", () => {
    it("should invoke onAdd after gl intialization", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        const viewerMock = <any>{};
        const referenceMock = { alt: 1, lat: 2, lon: 2 };
        const rendererId = "id";

        customRenderer.add(
            {
                id: rendererId,
                onAdd: (viewer, reference, context) => {
                    expect(viewer).toBe(viewerMock);
                    expect(reference).toBe(referenceMock);
                    expect(context).toBe(contextMock);
                    expect(customRenderer.has(rendererId)).toBe(true);
                    done();
                },
                onReferenceChanged: () => { /* noop */ },
                onRemove: () => { /* noop */ },
                render: () => { /* noop */ },
            },
            viewerMock);

        const rendererMock: WebGLRenderer = <WebGLRenderer>new RendererMock();
        const contextMock = new MockCreator()
            .create(WebGL2RenderingContext, "WebGL2RenderingContext");
        spyOn(rendererMock, "getContext").and.returnValue(contextMock);
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(rendererMock);
        (<Subject<ILatLonAlt>>navigator.stateService.reference$)
            .next(referenceMock);
    });

    it("should not invoke onReferenceChanged on gl intialization", () => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        const viewerMock = <any>{};
        const referenceMock = { alt: 1, lat: 2, lon: 2 };
        const rendererId = "id";

        let invokeCount = 0;
        customRenderer.add(
            {
                id: rendererId,
                onAdd: () => { /* noop */ },
                onReferenceChanged: () => { invokeCount++; },
                onRemove: () => { /* noop */ },
                render: () => { /* noop */ },
            },
            viewerMock);

        const rendererMock: WebGLRenderer = <WebGLRenderer>new RendererMock();
        const contextMock = new MockCreator()
            .create(WebGL2RenderingContext, "WebGL2RenderingContext");
        spyOn(rendererMock, "getContext").and.returnValue(contextMock);
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(rendererMock);
        (<Subject<ILatLonAlt>>navigator.stateService.reference$)
            .next(referenceMock);

        expect(invokeCount).toBe(0);
    });

    it("should invoke onReferenceChanged after gl intialization", () => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        const viewerMock = <any>{};
        const referenceMock = { alt: 1, lat: 2, lon: 2 };
        const rendererId = "id";

        let invokeCount = 0;
        customRenderer.add(
            {
                id: rendererId,
                onAdd: () => { /* noop */ },
                onReferenceChanged: () => { invokeCount++; },
                onRemove: () => { /* noop */ },
                render: () => { /* noop */ },
            },
            viewerMock);

        const rendererMock: WebGLRenderer = <WebGLRenderer>new RendererMock();
        const contextMock = new MockCreator()
            .create(WebGL2RenderingContext, "WebGL2RenderingContext");
        spyOn(rendererMock, "getContext").and.returnValue(contextMock);
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(rendererMock);

        (<Subject<ILatLonAlt>>navigator.stateService.reference$)
            .next(referenceMock);
        (<Subject<ILatLonAlt>>navigator.stateService.reference$)
            .next(referenceMock);

        expect(invokeCount).toBe(1);
    });

    it("should invoke render on postrender emit", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        const viewerMock = <any>{};
        const referenceMock = { alt: 1, lat: 2, lon: 2 };
        const rendererId = "id";

        customRenderer.add(
            {
                id: rendererId,
                onAdd: () => { /* noop */ },
                onReferenceChanged: () => { /* noop */ },
                onRemove: () => { /* noop */ },
                render: (context, viewMatrix, projectionMatrix) => {
                    expect(context).toBe(contextMock);
                    expect(viewMatrix).toEqual(viewMatrixMock);
                    expect(projectionMatrix).toEqual(projectionMatrixMock);
                    done();
                },
            },
            viewerMock);

        const rendererMock: WebGLRenderer = <WebGLRenderer>new RendererMock();
        const contextMock = new MockCreator()
            .create(WebGL2RenderingContext, "WebGL2RenderingContext");
        spyOn(rendererMock, "getContext").and.returnValue(contextMock);
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(rendererMock);
        (<Subject<ILatLonAlt>>navigator.stateService.reference$)
            .next(referenceMock);

        const renderCameraMock = new RenderCamera(1, 1, RenderMode.Fill);
        const viewMatrixMock = [
            2, 0, 0, 0,
            0, 2, 0, 0,
            0, 0, 2, 0,
            0, 0, 0, 2,
        ];
        renderCameraMock.perspective.matrixWorldInverse
            .fromArray(viewMatrixMock);
        const projectionMatrixMock = [
            3, 0, 0, 0,
            0, 3, 0, 0,
            0, 0, 3, 0,
            0, 0, 0, 3,
        ];
        renderCameraMock.perspective.projectionMatrix
            .fromArray(projectionMatrixMock);
        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(renderCameraMock);

        (<Subject<void>>container.glRenderer.postrender$).next();
    });
});

describe("CustomRenderer.remove", () => {
    it("should be removed", () => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        const viewer = <any>{};
        const id = "id";

        customRenderer.add(
            {
                id,
                onAdd: () => { /* noop */ },
                onReferenceChanged: () => { /* noop */ },
                onRemove: () => { /* noop */ },
                render: () => { /* noop */ },
            },
            viewer);
        customRenderer.remove(id, viewer);

        expect(customRenderer.has(id)).toBe(false);
    });

    it("should invoke onRemove after dispose", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        const viewerMock = <any>{};
        const referenceMock = { alt: 1, lat: 2, lon: 2 };
        const rendererId = "id";

        customRenderer.add(
            {
                id: rendererId,
                onAdd: () => { /* noop */ },
                onReferenceChanged: () => { /* noop */ },
                onRemove: (viewer, context) => {
                    expect(viewer).toBe(viewerMock);
                    expect(context).toBe(contextMock);
                    expect(customRenderer.has(rendererId)).toBe(false);
                    done();
                },
                render: () => { /* noop */ },
            },
            viewerMock);

        customRenderer.remove(rendererId, viewerMock);

        const rendererMock: WebGLRenderer = <WebGLRenderer>new RendererMock();
        const contextMock = new MockCreator()
            .create(WebGL2RenderingContext, "WebGL2RenderingContext");
        spyOn(rendererMock, "getContext").and.returnValue(contextMock);
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(rendererMock);
    });

});

describe("CustomRenderer.dispose", () => {
    it("should be removed", () => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        const viewer = <any>{}
        const id = "id";

        customRenderer.add(
            {
                id,
                onAdd: () => { /* noop */ },
                onReferenceChanged: () => { /* noop */ },
                onRemove: () => { /* noop */ },
                render: () => { /* noop */ },
            },
            viewer);
        customRenderer.dispose(viewer);

        expect(customRenderer.has(id)).toBe(false);
    });

    it("should invoke onRemove after dispose", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        const viewerMock = <any>{};
        const rendererId = "id";

        customRenderer.add(
            {
                id: rendererId,
                onAdd: () => { /* noop */ },
                onReferenceChanged: () => { /* noop */ },
                onRemove: (viewer, context) => {
                    expect(viewer).toBe(viewerMock);
                    expect(context).toBe(contextMock);
                    expect(customRenderer.has(rendererId)).toBe(false);
                    done();
                },
                render: () => { /* noop */ },
            },
            viewerMock);

        customRenderer.dispose(viewerMock);

        const rendererMock: WebGLRenderer = <WebGLRenderer>new RendererMock();
        const contextMock = new MockCreator()
            .create(WebGL2RenderingContext, "WebGL2RenderingContext");
        spyOn(rendererMock, "getContext").and.returnValue(contextMock);
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(rendererMock);
    });
});
