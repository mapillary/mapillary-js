import { bootstrap } from "../Bootstrap";
bootstrap();

import { Subject } from "rxjs";
import { WebGLRenderer } from "three";

import * as Container from "../../src/viewer/Container";
import * as Navigator from "../../src/viewer/Navigator";

import { ContainerMockCreator } from "../helper/ContainerMockCreator";
import { MockCreator } from "../helper/MockCreator";
import { NavigatorMockCreator } from "../helper/NavigatorMockCreator";
import { RendererMock } from "../helper/WebGLRenderer";
import { LngLatAlt } from "../../src/api/interfaces/LngLatAlt";
import { RenderCamera } from "../../src/render/RenderCamera";
import { RenderMode } from "../../src/render/RenderMode";
import { CustomCameraControls } from "../../src/viewer/CustomCameraControls";
import { State } from "../../src/state/State";
import { ViewportSize } from "../../src/render/interfaces/ViewportSize";

global.WebGL2RenderingContext = <any>jest.fn();

describe("CustomCameraControls.ctor", () => {
    it("should be definded", () => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const controls = new CustomCameraControls(
            container,
            navigator);

        expect(controls).toBeDefined();
    });
});

describe("CustomRenderer.attach", () => {
    it("should invoke onAttach after gl intialization", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const controls = new CustomCameraControls(
            container,
            navigator);

        const viewer = <any>{};
        const referenceMock: LngLatAlt = { alt: 1, lat: 2, lng: 3 };

        controls.attach(
            {
                onActivate: () => {
                    fail();
                },
                onAnimationFrame: () => { /* noop*/ },
                onAttach: (v, vmCallback, pmCallback) => {
                    expect(v).toBe(viewer);
                    expect(vmCallback).toBeDefined();
                    expect(pmCallback).toBeDefined();
                    done();
                },
                onDeactivate: () => {
                    fail();
                },
                onDetach: () => {
                    fail();
                },
                onReference: () => { /* noop */ },
                onResize: () => { /* noop */ },
            },
            viewer);

        const rendererMock = <WebGLRenderer><unknown>new RendererMock();
        const contextMock = new MockCreator()
            .create(WebGL2RenderingContext, "WebGL2RenderingContext");
        spyOn(rendererMock, "getContext").and.returnValue(contextMock);
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(rendererMock);

        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(referenceMock);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Traversing);

        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(new RenderCamera(1, 1, RenderMode.Fill));
    });

    it("should invoke onActivate if custom state is set", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const controls = new CustomCameraControls(
            container,
            navigator);

        const viewer = <any>{};
        const referenceMock: LngLatAlt = { alt: 1, lat: 2, lng: 3 };
        const camera = new RenderCamera(1, 1, RenderMode.Fill);

        controls.attach(
            {
                onActivate: (v, vm, pm, ref) => {
                    expect(v).toBe(viewer);
                    expect(vm).toEqual(
                        camera.perspective.matrixWorldInverse.toArray());
                    expect(pm).toEqual(
                        camera.perspective.projectionMatrix.toArray());
                    expect(pm).not.toEqual(vm);
                    expect(ref).toBe(referenceMock);
                    done();
                },
                onAnimationFrame: () => { /* noop*/ },
                onAttach: () => { /* noop*/ },
                onDeactivate: () => {
                    fail();
                },
                onDetach: () => {
                    fail();
                },
                onReference: () => { /* noop */ },
                onResize: () => { /* noop */ },
            },
            viewer);

        const rendererMock = <WebGLRenderer><unknown>new RendererMock();
        const contextMock = new MockCreator()
            .create(WebGL2RenderingContext, "WebGL2RenderingContext");
        spyOn(rendererMock, "getContext").and.returnValue(contextMock);
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(rendererMock);

        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(referenceMock);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);

        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(camera);
    });

    it("should invoke onReference after skipping replayed reference", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const controls = new CustomCameraControls(
            container,
            navigator);

        const viewer = <any>{};
        const initialReference: LngLatAlt = { alt: 1, lat: 2, lng: 3 };
        const changedReference: LngLatAlt = { alt: 4, lat: 4, lng: 6 };

        controls.attach(
            {
                onActivate: () => { /* noop*/ },
                onAnimationFrame: () => { /* noop*/ },
                onAttach: () => { /* noop*/ },
                onDeactivate: () => {
                    fail();
                },
                onDetach: () => {
                    fail();
                },
                onReference: (v, ref) => {
                    expect(v).toBe(viewer);
                    expect(ref).not.toBe(initialReference);
                    expect(ref).toBe(changedReference);
                    expect(ref.alt).toBe(changedReference.alt);
                    done();
                },
                onResize: () => { /* noop */ },
            },
            viewer);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);

        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(initialReference);

        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(changedReference);
    });

    it("should invoke onResize after skipping replayed size", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const controls = new CustomCameraControls(
            container,
            navigator);

        const viewer = <any>{};
        const initialSize: ViewportSize = { height: 1, width: 2 };
        const changedSize: ViewportSize = { height: 3, width: 4 };

        controls.attach(
            {
                onActivate: () => { /* noop*/ },
                onAnimationFrame: () => { /* noop*/ },
                onAttach: () => { /* noop*/ },
                onDeactivate: () => {
                    fail();
                },
                onDetach: () => {
                    fail();
                },
                onReference: (v, ref) => { /* noop */ },
                onResize: (v) => {
                    expect(v).toBe(viewer);
                    done();
                },
            },
            viewer);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);

        (<Subject<ViewportSize>>container.renderService.size$)
            .next(initialSize);

        (<Subject<ViewportSize>>container.renderService.size$)
            .next(changedSize);
    });

    it("should invoke onActivate when custom state is set", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const controls = new CustomCameraControls(
            container,
            navigator);

        const viewer = <any>{};
        const initialReference: LngLatAlt = { alt: 1, lat: 2, lng: 3 };
        const changedReference: LngLatAlt = { alt: 4, lat: 5, lng: 5 };
        const initialCamera = new RenderCamera(1, 1, RenderMode.Fill);
        const changedCamera = new RenderCamera(4, 1, RenderMode.Fill);

        controls.attach(
            {
                onActivate: (v, vm, pm, ref) => {
                    expect(v).toBe(viewer);
                    expect(vm).toEqual(
                        changedCamera.perspective.matrixWorldInverse.toArray());
                    expect(pm).toEqual(
                        changedCamera.perspective.projectionMatrix.toArray());
                    expect(pm).not.toEqual(vm);
                    expect(ref).toBe(changedReference);
                    done();
                },
                onAnimationFrame: () => { /* noop*/ },
                onAttach: () => { /* noop*/ },
                onDeactivate: () => {
                    fail();
                },
                onDetach: () => {
                    fail();
                },
                onReference: () => { /* noop */ },
                onResize: () => { /* noop */ },
            },
            viewer);

        const rendererMock = <WebGLRenderer><unknown>new RendererMock();
        const contextMock = new MockCreator()
            .create(WebGL2RenderingContext, "WebGL2RenderingContext");
        spyOn(rendererMock, "getContext").and.returnValue(contextMock);
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(rendererMock);

        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(initialReference);

        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(initialCamera);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Earth);

        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(changedReference);

        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(changedCamera);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);
    });

    it("should invoke onDeactivate when non custom state is set", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const controls = new CustomCameraControls(
            container,
            navigator);

        const viewer = <any>{};
        const reference: LngLatAlt = { alt: 1, lat: 2, lng: 3 };
        const camera = new RenderCamera(1, 1, RenderMode.Fill);

        controls.attach(
            {
                onActivate: () => { /* noop*/ },
                onAnimationFrame: () => { /* noop*/ },
                onAttach: () => { /* noop*/ },
                onDeactivate: (v) => {
                    expect(v).toBe(viewer);
                    done();
                },
                onDetach: () => {
                    fail();
                },
                onReference: () => { /* noop */ },
                onResize: () => { /* noop */ },
            },
            viewer);

        const rendererMock = <WebGLRenderer><unknown>new RendererMock();
        const contextMock = new MockCreator()
            .create(WebGL2RenderingContext, "WebGL2RenderingContext");
        spyOn(rendererMock, "getContext").and.returnValue(contextMock);
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(rendererMock);

        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(reference);

        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(camera);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Earth);
    });

    it("should callback view matrix in custom state", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const controls = new CustomCameraControls(
            container,
            navigator);

        const viewer = <any>{};
        const referenceMock: LngLatAlt = { alt: 1, lat: 2, lng: 3 };

        controls.attach(
            {
                onActivate: () => { /* noop */ },
                onAnimationFrame: () => { /* noop*/ },
                onAttach: (_, vmCallback) => {
                    vmCallback([0, 1]);

                    (<Subject<State>>navigator.stateService.state$)
                        .next(State.Custom);

                    expect(
                        (<jasmine.Spy>navigator.stateService.setViewMatrix)
                            .calls.count())
                        .toBe(1);
                    expect(
                        (<jasmine.Spy>navigator.stateService.setViewMatrix)
                            .calls.first().args[0])
                        .toEqual([0, 1]);

                    done();
                },
                onDeactivate: () => {
                    fail();
                },
                onDetach: () => {
                    fail();
                },
                onReference: () => { /* noop */ },
                onResize: () => { /* noop */ },
            },
            viewer);

        const rendererMock = <WebGLRenderer><unknown>new RendererMock();
        const contextMock = new MockCreator()
            .create(WebGL2RenderingContext, "WebGL2RenderingContext");
        spyOn(rendererMock, "getContext").and.returnValue(contextMock);
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(rendererMock);

        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(referenceMock);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);

        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(new RenderCamera(1, 1, RenderMode.Fill));
    });

    it("should callback projection matrix in custom state", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const controls = new CustomCameraControls(
            container,
            navigator);

        const viewer = <any>{};
        const referenceMock: LngLatAlt = { alt: 1, lat: 2, lng: 3 };

        controls.attach(
            {
                onActivate: () => { /* noop */ },
                onAnimationFrame: () => { /* noop*/ },
                onAttach: (_, __, pmCallback) => {
                    pmCallback([2, 3]);

                    (<Subject<number[]>>container
                        .renderService.projectionMatrix$)
                        .subscribe(
                            pm => {
                                expect(pm).toEqual([2, 3]);
                                done();
                            });

                    (<Subject<State>>navigator.stateService.state$)
                        .next(State.Custom);
                },
                onDeactivate: () => {
                    fail();
                },
                onDetach: () => {
                    fail();
                },
                onReference: () => { /* noop */ },
                onResize: () => { /* noop */ },
            },
            viewer);

        const rendererMock = <WebGLRenderer><unknown>new RendererMock();
        const contextMock = new MockCreator()
            .create(WebGL2RenderingContext, "WebGL2RenderingContext");
        spyOn(rendererMock, "getContext").and.returnValue(contextMock);
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(rendererMock);

        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(referenceMock);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);

        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(new RenderCamera(1, 1, RenderMode.Fill));
    });

    it("should not callback in non custom state", done => {
        spyOn(console, "warn").and.stub();

        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const controls = new CustomCameraControls(
            container,
            navigator);

        const viewer = <any>{};
        const referenceMock: LngLatAlt = { alt: 1, lat: 2, lng: 3 };

        controls.attach(
            {
                onActivate: () => { /* noop */ },
                onAnimationFrame: () => { /* noop*/ },
                onAttach: (_, vmCallback, pmCallback) => {
                    vmCallback([0, 1]);
                    pmCallback([2, 3]);

                    (<Subject<number[]>>container
                        .renderService.projectionMatrix$)
                        .subscribe(
                            () => {
                                fail();
                            });

                    (<Subject<State>>navigator.stateService.state$)
                        .next(State.Earth);

                    expect(
                        (<jasmine.Spy>navigator.stateService.setViewMatrix)
                            .calls.count())
                        .toBe(0);

                    done();
                },
                onDeactivate: () => {
                    fail();
                },
                onDetach: () => {
                    fail();
                },
                onReference: () => { /* noop */ },
                onResize: () => { /* noop */ },
            },
            viewer);

        const rendererMock = <WebGLRenderer><unknown>new RendererMock();
        const contextMock = new MockCreator()
            .create(WebGL2RenderingContext, "WebGL2RenderingContext");
        spyOn(rendererMock, "getContext").and.returnValue(contextMock);
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(rendererMock);

        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(referenceMock);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Earth);

        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(new RenderCamera(1, 1, RenderMode.Fill));
    });
});

describe("CustomRenderer.detach", () => {
    it("should invoke onDetach when detatching", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const controls = new CustomCameraControls(
            container,
            navigator);

        const viewer = <any>{};

        controls.attach(
            {
                onActivate: () => {
                    fail();
                },
                onAnimationFrame: () => {
                    fail();
                },
                onAttach: () => {
                    fail();
                },
                onDeactivate: (v) => {
                    fail();
                },
                onDetach: (v) => {
                    expect(v).toBe(viewer);
                    done();
                },
                onReference: () => {
                    fail();
                },
                onResize: () => {
                    fail();
                },
            },
            viewer);

        controls.detach(viewer);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Earth);
    });

    it("should invoke onDeactive when detatching if in custom state", done => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const controls = new CustomCameraControls(
            container,
            navigator);

        const viewer = <any>{};

        let deactivateCount = 0;
        controls.attach(
            {
                onActivate: () => {
                    fail();
                },
                onAnimationFrame: () => {
                    fail();
                },
                onAttach: () => {
                    fail();
                },
                onDeactivate: (v) => {
                    expect(v).toBe(viewer);
                    deactivateCount++;
                },
                onDetach: (v) => {
                    expect(v).toBe(viewer);
                    expect(deactivateCount).toBe(1);
                    done();
                },
                onReference: () => {
                    fail();
                },
                onResize: () => {
                    fail();
                },
            },
            viewer);

        controls.detach(viewer);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);
    });
});
