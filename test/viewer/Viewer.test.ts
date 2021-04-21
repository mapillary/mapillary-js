import { Subject } from "rxjs";
import { State } from "../../src/state/State";
import * as ComponentController from "../../src/viewer/ComponentController";
import * as Container from "../../src/viewer/Container";
import * as CustomRenderer from "../../src/viewer/CustomRenderer";
import { CameraControls } from "../../src/viewer/enums/CameraControls";
import { RenderPass } from "../../src/viewer/enums/RenderPass";
import { ViewerEventType } from "../../src/viewer/events/ViewerEventType";
import * as Navigator from "../../src/viewer/Navigator";
import * as Observer from "../../src/viewer/Observer";

import { Viewer } from "../../src/viewer/Viewer";
import { ContainerMockCreator } from "../helper/ContainerMockCreator";
import { MockCreator } from "../helper/MockCreator";
import { NavigatorMockCreator } from "../helper/NavigatorMockCreator";

describe("Viewer.ctor", () => {
    it("should be definded", () => {
        spyOn(Navigator, "Navigator").and.stub();
        spyOn(Container, "Container").and.stub();
        spyOn(Observer, "Observer").and.stub();
        spyOn(ComponentController, "ComponentController").and.stub();

        const viewer = new Viewer({ apiClient: "", container: "" });

        expect(viewer).toBeDefined();
    });
});

type Mocks = {
    container: Container.Container,
    controller: ComponentController.ComponentController,
    customRenderer: CustomRenderer.CustomRenderer,
    navigator: Navigator.Navigator,
    observer: Observer.Observer,
}

const createMocks = (): Mocks => {
    const navigator = new NavigatorMockCreator().create();
    const container = new ContainerMockCreator().create();

    const mockCreator = new MockCreator();
    const observer = mockCreator
        .create(Observer.Observer, "Observer");
    const controller = mockCreator
        .create(
            ComponentController.ComponentController,
            "ComponentController");
    const customRenderer = mockCreator
        .create(CustomRenderer.CustomRenderer, "CustomRenderer");

    spyOn(Navigator, "Navigator").and.returnValue(navigator);
    spyOn(Container, "Container").and.returnValue(container);
    spyOn(Observer, "Observer").and.returnValue(observer);
    spyOn(ComponentController, "ComponentController")
        .and.returnValue(controller);
    spyOn(CustomRenderer, "CustomRenderer")
        .and.returnValue(customRenderer);

    return {
        container,
        controller,
        customRenderer,
        navigator,
        observer,
    };
}

describe("Viewer.remove", () => {
    it("should dispose internals", () => {
        const mocks = createMocks();
        const viewer = new Viewer({ apiClient: "", container: "" });

        viewer.remove();

        expect((<jasmine.Spy>mocks.navigator.dispose).calls.count())
            .toBe(1);
        expect((<jasmine.Spy>mocks.container.remove).calls.count())
            .toBe(1);
        expect((<jasmine.Spy>mocks.observer.dispose).calls.count())
            .toBe(1);
        expect((<jasmine.Spy>mocks.controller.remove).calls.count())
            .toBe(1);
        expect((<jasmine.Spy>mocks.customRenderer.dispose).calls.count())
            .toBe(1);
    });

    it("should emit removed event", (done: Function) => {
        createMocks();
        const viewer = new Viewer({ apiClient: "", container: "" });
        const remove: ViewerEventType = "remove";
        viewer.on(
            remove,
            (event: { type: string }): void => {
                expect(event).toBeDefined();
                expect(event.type).toBe(remove);

                done();
            });

        viewer.remove();
    });
});

describe("Viewer.addCustomRenderer", () => {
    it("should call custom renderer", () => {
        const mocks = createMocks();
        const viewer = new Viewer({ apiClient: "", container: "" });

        viewer.addCustomRenderer({
            id: "1",
            renderPass: RenderPass.Opaque,
            onAdd: () => { /* noop */ },
            onReference: () => { /* noop */ },
            onRemove: () => { /* noop */ },
            render: () => { /* noop */ },
        });

        const spy = (<jasmine.Spy>mocks.customRenderer.add);
        expect(spy.calls.count()).toBe(1);
    });
});

describe("Viewer.hasCustomRenderer", () => {
    it("should call custom renderer", () => {
        const mocks = createMocks();
        const viewer = new Viewer({ apiClient: "", container: "" });

        viewer.hasCustomRenderer("1");

        const spy = (<jasmine.Spy>mocks.customRenderer.has);
        expect(spy.calls.count()).toBe(1);
    });
});

describe("Viewer.removeCustomRenderer", () => {
    it("should call custom renderer", () => {
        const mocks = createMocks();
        const viewer = new Viewer({ apiClient: "", container: "" });

        viewer.removeCustomRenderer("1");

        const spy = (<jasmine.Spy>mocks.customRenderer.remove);
        expect(spy.calls.count()).toBe(1);
    });
});

describe("Viewer.triggerRerender", () => {
    it("should call gl renderer", () => {
        const mocks = createMocks();
        const viewer = new Viewer({ apiClient: "", container: "" });

        viewer.triggerRerender();

        const spy = (<jasmine.Spy>mocks.container.glRenderer.triggerRerender);
        expect(spy.calls.count()).toBe(1);
    });
});

describe("Viewer.setCameraControls", () => {
    beforeEach(() => {
        spyOn(console, "warn").and.stub();
    })

    it("should set different state", () => {
        const mocks = createMocks();
        const viewer = new Viewer({ apiClient: "", container: "" });

        const earthSpy = (<jasmine.Spy>mocks.navigator.stateService.earth);
        const traverseSpy = (<jasmine.Spy>mocks.navigator.stateService.traverse);

        const state$ = <Subject<State>>mocks.navigator.stateService.state$;

        viewer.setCameraControls(CameraControls.Earth);
        state$.next(State.Traversing);
        expect(earthSpy.calls.count()).toBe(1);
        expect(traverseSpy.calls.count()).toBe(0);

        viewer.setCameraControls(CameraControls.Street);
        state$.next(State.Earth);
        expect(earthSpy.calls.count()).toBe(1);
        expect(traverseSpy.calls.count()).toBe(1);
    });

    it("should not set same state", () => {
        const mocks = createMocks();
        const viewer = new Viewer({ apiClient: "", container: "" });

        const earthSpy = (<jasmine.Spy>mocks.navigator.stateService.earth);
        const traverseSpy = (<jasmine.Spy>mocks.navigator.stateService.traverse);

        const state$ = <Subject<State>>mocks.navigator.stateService.state$;

        viewer.setCameraControls(CameraControls.Earth);
        state$.next(State.Earth);
        expect(earthSpy.calls.count()).toBe(0);
        expect(traverseSpy.calls.count()).toBe(0);

        viewer.setCameraControls(CameraControls.Street);
        state$.next(State.Traversing);
        expect(earthSpy.calls.count()).toBe(0);
        expect(traverseSpy.calls.count()).toBe(0);
    });

    it("should not change state when waiting", () => {
        const mocks = createMocks();
        const viewer = new Viewer({ apiClient: "", container: "" });

        const earthSpy = (<jasmine.Spy>mocks.navigator.stateService.earth);
        const traverseSpy = (<jasmine.Spy>mocks.navigator.stateService.traverse);

        const state$ = <Subject<State>>mocks.navigator.stateService.state$;

        viewer.setCameraControls(CameraControls.Earth);
        state$.next(State.Waiting);
        viewer.setCameraControls(CameraControls.Street);
        state$.next(State.Waiting);
        expect(earthSpy.calls.count()).toBe(0);
        expect(traverseSpy.calls.count()).toBe(0);

        viewer.setCameraControls(CameraControls.Earth);
        state$.next(State.WaitingInteractively);
        viewer.setCameraControls(CameraControls.Street);
        state$.next(State.WaitingInteractively);
        expect(earthSpy.calls.count()).toBe(0);
        expect(traverseSpy.calls.count()).toBe(0);
    });
});

describe("Viewer.getCameraControls", () => {
    beforeEach(() => {
        spyOn(console, "warn").and.stub();
    })

    it("should subscribe state", done => {
        const mocks = createMocks();
        const viewer = new Viewer({ apiClient: "", container: "" });

        const state$ = <Subject<State>>mocks.navigator.stateService.state$;
        viewer.getCameraControls()
            .then(() => { done(); })
        state$.next(State.Earth);
    });

    it("should convert to earth controls", done => {
        const mocks = createMocks();
        const viewer = new Viewer({ apiClient: "", container: "" });

        const state$ = <Subject<State>>mocks.navigator.stateService.state$;

        viewer.getCameraControls()
            .then(
                controls => {
                    expect(controls).toBe(CameraControls.Earth);
                    done();
                })

        state$.next(State.Earth);
    });

    it("should convert traversing to street controls", done => {
        const mocks = createMocks();
        const viewer = new Viewer({ apiClient: "", container: "" });

        const state$ = <Subject<State>>mocks.navigator.stateService.state$;

        viewer.getCameraControls()
            .then(
                controls => {
                    expect(controls).toBe(CameraControls.Street);
                    done();
                })

        state$.next(State.Traversing);
    });

    it("should convert waiting to street controls", done => {
        const mocks = createMocks();
        const viewer = new Viewer({ apiClient: "", container: "" });

        const state$ = <Subject<State>>mocks.navigator.stateService.state$;

        viewer.getCameraControls()
            .then(
                controls => {
                    expect(controls).toBe(CameraControls.Street);
                    done();
                })

        state$.next(State.Waiting);
    });

    it("should convert waiting interactively to street controls", done => {
        const mocks = createMocks();
        const viewer = new Viewer({ apiClient: "", container: "" });

        const state$ = <Subject<State>>mocks.navigator.stateService.state$;

        viewer.getCameraControls()
            .then(
                controls => {
                    expect(controls).toBe(CameraControls.Street);
                    done();
                })

        state$.next(State.WaitingInteractively);
    });
});
