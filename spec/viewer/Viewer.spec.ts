import * as ComponentController from "../../src/viewer/ComponentController";
import * as Container from "../../src/viewer/Container";
import * as Navigator from "../../src/viewer/Navigator";
import * as Observer from "../../src/viewer/Observer";

import { Viewer } from "../../src/viewer/Viewer";

import ContainerMockCreator from "../helper/ContainerMockCreator.spec";
import MockCreator from "../helper/MockCreator.spec";
import NavigatorMockCreator from "../helper/NavigatorMockCreator.spec";

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

describe("Viewer.remove", () => {
    it("should dispose internals", () => {
        const navigatorMock = new NavigatorMockCreator().create();
        const containerMock = new ContainerMockCreator().create();

        const observerMock = new MockCreator()
            .create(Observer.Observer, "Observer");

        const controllerMock = new MockCreator()
            .create(
                ComponentController.ComponentController,
                "ComponentController");

        spyOn(Navigator, "Navigator").and.returnValue(navigatorMock);
        spyOn(Container, "Container").and.returnValue(containerMock);
        spyOn(Observer, "Observer").and.returnValue(observerMock);
        spyOn(ComponentController, "ComponentController").and.returnValue(controllerMock);

        const viewer = new Viewer({ apiClient: "", container: "" });

        viewer.remove();

        expect((<jasmine.Spy>navigatorMock.dispose).calls.count()).toBe(1);
        expect((<jasmine.Spy>containerMock.remove).calls.count()).toBe(1);
        expect((<jasmine.Spy>observerMock.dispose).calls.count()).toBe(1);
        expect((<jasmine.Spy>controllerMock.remove).calls.count()).toBe(1);
    });

    it("should emit removed event", (done: Function) => {
        const navigatorMock = new NavigatorMockCreator().create();
        const containerMock = new ContainerMockCreator().create();

        const observerMock = new MockCreator()
            .create(Observer.Observer, "Observer");

        const controllerMock = new MockCreator()
            .create(
                ComponentController.ComponentController,
                "ComponentController");

        spyOn(Navigator, "Navigator").and.returnValue(navigatorMock);
        spyOn(Container, "Container").and.returnValue(containerMock);
        spyOn(Observer, "Observer").and.returnValue(observerMock);
        spyOn(ComponentController, "ComponentController").and.returnValue(controllerMock);

        const viewer = new Viewer({ apiClient: "", container: "" });

        viewer.on(
            Viewer.removed,
            (event: { type: string }): void => {
                expect(event).toBeDefined();
                expect(event.type).toBe(Viewer.removed);

                done();
            });

        viewer.remove();
    });
});
