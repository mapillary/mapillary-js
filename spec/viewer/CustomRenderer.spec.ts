import { Subject } from "rxjs";
import { WebGLRenderer } from "three";

import * as Viewer from "../../src/viewer/Viewer";
import * as Container from "../../src/viewer/Container";
import * as Navigator from "../../src/viewer/Navigator";

import { CustomRenderer } from "../../src/viewer/CustomRenderer";
import { ContainerMockCreator } from "../helper/ContainerMockCreator.spec";
import { MockCreator } from "../helper/MockCreator.spec";
import { NavigatorMockCreator } from "../helper/NavigatorMockCreator.spec";
import { RendererMock } from "../helper/WebGLRenderer.spec";
import { ILatLonAlt } from "../../src/geo/interfaces/ILatLonAlt";
import { RenderCamera } from "../../src/render/RenderCamera";
import { RenderMode } from "../../src/Mapillary";

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
        spyOn(Viewer, "Viewer").and.stub();

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        const viewer = new Viewer.Viewer({ apiClient: "", container: "" });
        const id = "id";

        expect(customRenderer.has(id)).toBeFalse();

        customRenderer.add(
            {
                id,
                onAdd: () => { /* noop */ },
                onReferenceChanged: () => { /* noop */ },
                onRemove: () => { /* noop */ },
                render: () => { /* noop */ },
            },
            viewer);

        expect(customRenderer.has(id)).toBeTrue();
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

        const viewerMock = new Viewer.Viewer({ apiClient: "", container: "" });
        const referenceMock = { alt: 1, lat: 2, lon: 2 };
        const rendererId = "id";

        customRenderer.add(
            {
                id: rendererId,
                onAdd: (viewer, reference, context) => {
                    expect(viewer).toBe(viewerMock);
                    expect(reference).toBe(referenceMock);
                    expect(context).toBe(contextMock);
                    expect(customRenderer.has(rendererId)).toBeTrue();
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

        const viewerMock = new Viewer.Viewer({ apiClient: "", container: "" });
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

        const viewerMock = new Viewer.Viewer({ apiClient: "", container: "" });
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

        const viewerMock = new Viewer.Viewer({ apiClient: "", container: "" });
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
        spyOn(Viewer, "Viewer").and.stub();

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        const viewer = new Viewer.Viewer({ apiClient: "", container: "" });
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

        expect(customRenderer.has(id)).toBeFalse();
    });

    it("should invoke onRemove after dispose", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        const viewerMock = new Viewer.Viewer({ apiClient: "", container: "" });
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
                    expect(customRenderer.has(rendererId)).toBeFalse();
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
        spyOn(Viewer, "Viewer").and.stub();

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        const viewer = new Viewer.Viewer({ apiClient: "", container: "" });
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

        expect(customRenderer.has(id)).toBeFalse();
    });

    it("should invoke onRemove after dispose", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const customRenderer = new CustomRenderer(
            container,
            navigator);

        const viewerMock = new Viewer.Viewer({ apiClient: "", container: "" });
        const rendererId = "id";

        customRenderer.add(
            {
                id: rendererId,
                onAdd: () => { /* noop */ },
                onReferenceChanged: () => { /* noop */ },
                onRemove: (viewer, context) => {
                    expect(viewer).toBe(viewerMock);
                    expect(context).toBe(contextMock);
                    expect(customRenderer.has(rendererId)).toBeFalse();
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
