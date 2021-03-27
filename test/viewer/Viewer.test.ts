import * as ComponentController from "../../src/viewer/ComponentController";
import * as Container from "../../src/viewer/Container";
import * as CustomRenderer from "../../src/viewer/CustomRenderer";
import { RenderPass } from "../../src/viewer/enums/RenderPass";
import { ViewerEvent } from "../../src/viewer/events/ViewerEvent";
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
        const remove: ViewerEvent = "remove";
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
            onReferenceChanged: () => { /* noop */ },
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
