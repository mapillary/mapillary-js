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
import { AnimationFrame } from "../../src/state/interfaces/AnimationFrame";

global.WebGL2RenderingContext = <any>jest.fn();

type WebGLMocks = {
    context: WebGL2RenderingContext;
    renderer: WebGLRenderer;
};

function createWebGLMocks(): WebGLMocks {
    const renderer = <WebGLRenderer><unknown>new RendererMock();
    const context = new MockCreator()
        .create(WebGL2RenderingContext, "WebGL2RenderingContext");
    spyOn(renderer, "getContext").and.returnValue(context);
    return { context, renderer };
}

describe("CustomCameraControls.ctor", () => {
    test("should be definded", () => {
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
    test("should invoke onAttach after gl initialization", done => {
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

        const webGLMocks = createWebGLMocks();
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(webGLMocks.renderer);

        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(referenceMock);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Traversing);

        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(new RenderCamera(1, 1, RenderMode.Fill));
    });

    test("should invoke onActivate if custom state is set", done => {
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
                onActivate: (v, vm, pm, ref) => {
                    expect(v).toBe(viewer);
                    expect(vm).toEqual(
                        camera.perspective.matrixWorldInverse.toArray());
                    expect(pm).toEqual(
                        camera.perspective.projectionMatrix.toArray());
                    expect(pm).not.toEqual(vm);
                    expect(ref).toBe(reference);
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

        const webGLMocks = createWebGLMocks();
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(webGLMocks.renderer);

        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(reference);

        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);

        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(camera);

        // Replay
        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);
    });

    test("should invoke onReference after skipping replay", done => {
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
        const camera = new RenderCamera(1, 1, RenderMode.Fill);

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

        // Attach
        const webGLMocks = createWebGLMocks();
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(webGLMocks.renderer);
        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);
        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(camera);
        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(initialReference);

        // Replay
        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);
        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(initialReference);

        // Change
        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(changedReference);
    });

    test("should invoke onResize after skipping replay", done => {
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
                onReference: () => { /* noop */ },
                onResize: (v) => {
                    expect(v).toBe(viewer);
                    done();
                },
            },
            viewer);

        // Attach
        const webGLMocks = createWebGLMocks();
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(webGLMocks.renderer);
        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);
        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(camera);
        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(reference);

        // Replay
        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);
        (<Subject<ViewportSize>>container.renderService.size$)
            .next(initialSize);

        // Change
        (<Subject<ViewportSize>>container.renderService.size$)
            .next(changedSize);
    });

    test("should invoke onAnimationFrame after skipping replay", done => {
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
        const initialFrame: AnimationFrame = { id: 1, fps: 120, state: null };
        const changedFrame: AnimationFrame = { id: 2, fps: 120, state: null };

        controls.attach(
            {
                onActivate: () => { /* noop*/ },
                onAnimationFrame: (v, frameId) => {
                    expect(v).toBe(viewer);
                    expect(frameId).toBe(changedFrame.id);
                    done();
                },
                onAttach: () => { /* noop*/ },
                onDeactivate: () => {
                    fail();
                },
                onDetach: () => {
                    fail();
                },
                onReference: () => { /* noop */ },
                onResize: (v) => { /* noop */ },
            },
            viewer);

        // Attach
        const webGLMocks = createWebGLMocks();
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(webGLMocks.renderer);
        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);
        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(camera);
        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(reference);

        // Replay
        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);
        (<Subject<AnimationFrame>>navigator.stateService.currentState$)
            .next(initialFrame);

        // Change
        (<Subject<AnimationFrame>>navigator.stateService.currentState$)
            .next(changedFrame);
    });

    test("should invoke onActivate when custom state is set", done => {
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

        // Attach
        const webGLMocks = createWebGLMocks();
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(webGLMocks.renderer);
        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(initialReference);
        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(initialCamera);
        (<Subject<State>>navigator.stateService.state$)
            .next(State.Earth);

        // Replay
        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(changedReference);
        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(changedCamera);
        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);
    });

    test("should invoke onDeactivate when non custom state is set", done => {
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

        // Attach
        const webGLMocks = createWebGLMocks();
        (<Subject<WebGLRenderer>>container.glRenderer.webGLRenderer$)
            .next(webGLMocks.renderer);
        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(reference);
        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(camera);
        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);

        // Replay
        (<Subject<LngLatAlt>>navigator.stateService.reference$)
            .next(reference);
        (<Subject<RenderCamera>>container.renderService.renderCamera$)
            .next(camera);
        (<Subject<State>>navigator.stateService.state$)
            .next(State.Custom);

        // Emit
        (<Subject<State>>navigator.stateService.state$)
            .next(State.Earth);
    });

    test("should callback view matrix in custom state", done => {
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

    test("should callback projection matrix in custom state", done => {
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

    test("should not callback in non custom state", done => {
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
    test("should invoke onDetach when detatching", done => {
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

    test("should only invoke onDetach once", () => {
        const navigator = new NavigatorMockCreator().create();
        const container = new ContainerMockCreator().create();
        spyOn(Navigator, "Navigator").and.returnValue(navigator);
        spyOn(Container, "Container").and.returnValue(container);

        const controls = new CustomCameraControls(
            container,
            navigator);

        const viewer = <any>{};

        let detachCount = 0;
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
                    detachCount++;
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
        (<Subject<State>>navigator.stateService.state$)
            .next(State.Traversing);

        expect(detachCount).toBe(1);
    });

    test("should invoke onDeactive when detatching if in custom state", done => {
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
