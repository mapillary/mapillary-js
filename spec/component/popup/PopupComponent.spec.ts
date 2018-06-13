import {Subject} from "rxjs";

import {
    Popup,
    PopupComponent,
} from "../../../src/Component";
import {Transform} from "../../../src/Geo";
import {
    ISize,
    RenderCamera,
} from "../../../src/Render";
import {
    Container,
    Navigator,
} from "../../../src/Viewer";

import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";

describe("PopupComponent.ctor", () => {
    it("should be defined", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        expect(popupComponent).toBeDefined();
    });
});

describe("PopupComponent.deactivate", () => {
    it("should deactivate properly", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        popupComponent.activate();
        popupComponent.deactivate();
    });
});

describe("PopupComponent.add", () => {
    it("should add a single popup", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const popup: Popup = new Popup();
        popup.setDOMContent(document.createElement("div"));

        popupComponent.add([popup]);
        const result: Popup[] = popupComponent.getAll();

        expect(result.length).toBe(1);
        expect(result[0]).toEqual(popup);
    });

    it("should add a single popup multiple times", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const popup1: Popup = new Popup();
        popup1.setDOMContent(document.createElement("div"));
        popupComponent.add([popup1]);

        const popup2: Popup = new Popup();
        popup2.setDOMContent(document.createElement("div"));
        popupComponent.add([popup2]);

        const result: Popup[] = popupComponent.getAll();

        expect(result.length).toBe(2);
        expect(result.indexOf(popup1)).not.toBe(-1);
        expect(result.indexOf(popup2)).not.toBe(-1);
    });

    it("should be able to add multiple popups at the same time", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const popup1: Popup = new Popup();
        popup1.setDOMContent(document.createElement("div"));

        const popup2: Popup = new Popup();
        popup2.setDOMContent(document.createElement("div"));

        popupComponent.add([popup1, popup2]);

        const result: Popup[] = popupComponent.getAll();

        expect(result.length).toBe(2);
        expect(result.indexOf(popup1)).not.toBe(-1);
        expect(result.indexOf(popup2)).not.toBe(-1);
    });

    it("should not add popup if already existing", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const popup: Popup = new Popup();
        popup.setDOMContent(document.createElement("div"));

        popupComponent.add([popup]);
        popupComponent.add([popup]);

        const result: Popup[] = popupComponent.getAll();

        expect(result.length).toBe(1);
        expect(result[0]).toEqual(popup);
    });

    it("should not add the same popup twice", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const popup: Popup = new Popup();
        popup.setDOMContent(document.createElement("div"));

        popupComponent.add([popup, popup]);

        const result: Popup[] = popupComponent.getAll();

        expect(result.length).toBe(1);
        expect(result[0]).toEqual(popup);
    });
});

describe("PopupComponent.remove", () => {
    it("should remove a single popup", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const popup: Popup = new Popup();
        popup.setDOMContent(document.createElement("div"));

        popupComponent.add([popup]);
        popupComponent.remove([popup]);

        const result: Popup[] = popupComponent.getAll();

        expect(result.length).toBe(0);
    });

    it("should remove one of multiple popups", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const popup1: Popup = new Popup();
        popup1.setDOMContent(document.createElement("div"));

        const popup2: Popup = new Popup();
        popup2.setDOMContent(document.createElement("div"));

        popupComponent.add([popup1, popup2]);
        popupComponent.remove([popup1]);

        const result: Popup[] = popupComponent.getAll();

        expect(result.length).toBe(1);
        expect(result.indexOf(popup1)).toBe(-1);
        expect(result.indexOf(popup2)).not.toBe(-1);
    });

    it("should remove multiple popups", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const popup1: Popup = new Popup();
        popup1.setDOMContent(document.createElement("div"));

        const popup2: Popup = new Popup();
        popup2.setDOMContent(document.createElement("div"));

        popupComponent.add([popup1, popup2]);
        popupComponent.remove([popup1, popup2]);

        const result: Popup[] = popupComponent.getAll();

        expect(result.length).toBe(0);
    });

    it("should remove multiple popups from multiple popups", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const popup1: Popup = new Popup();
        popup1.setDOMContent(document.createElement("div"));

        const popup2: Popup = new Popup();
        popup2.setDOMContent(document.createElement("div"));

        const popup3: Popup = new Popup();
        popup3.setDOMContent(document.createElement("div"));

        popupComponent.add([popup1, popup2, popup3]);
        popupComponent.remove([popup1, popup2]);

        const result: Popup[] = popupComponent.getAll();

        expect(result.length).toBe(1);
        expect(result.indexOf(popup1)).toBe(-1);
        expect(result.indexOf(popup2)).toBe(-1);
        expect(result.indexOf(popup3)).not.toBe(-1);
    });
});

describe("PopupComponent.removeAll", () => {
    it("should remove a single popup", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const popup: Popup = new Popup();
        popup.setDOMContent(document.createElement("div"));

        popupComponent.add([popup]);
        popupComponent.removeAll();

        const result: Popup[] = popupComponent.getAll();

        expect(result.length).toBe(0);
    });

    it("should remove multiple popups", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        const popup1: Popup = new Popup();
        popup1.setDOMContent(document.createElement("div"));

        const popup2: Popup = new Popup();
        popup2.setDOMContent(document.createElement("div"));

        popupComponent.add([popup1, popup2]);
        popupComponent.removeAll();

        const result: Popup[] = popupComponent.getAll();

        expect(result.length).toBe(0);
    });
});

describe("PopupComponent.updateAdded", () => {
    it("should update a popup once when added", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                containerMock,
                navigatorMock);

        const popup: Popup = new Popup();
        popup.setDOMContent(document.createElement("div"));

        const updateSpy: jasmine.Spy = spyOn(popup, "update").and.stub();

        popupComponent.activate();

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$).next(null);
        (<Subject<ISize>>containerMock.renderService.size$).next(null);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$).next(null);

        popupComponent.add([popup]);

        expect(updateSpy.calls.count()).toBe(1);
    });

    it("should update a popup when changed", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                containerMock,
                navigatorMock);

        const popup: Popup = new Popup();
        popup.setDOMContent(document.createElement("div"));

        const updateSpy: jasmine.Spy = spyOn(popup, "update").and.stub();

        popupComponent.activate();

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$).next(null);
        (<Subject<ISize>>containerMock.renderService.size$).next(null);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$).next(null);

        popupComponent.add([popup]);

        popup.setBasicPoint([0.5, 0.5]);

        expect(updateSpy.calls.count()).toBe(2);
    });
});

describe("PopupComponent.updateAll", () => {
    it("should update a popup once when activated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                containerMock,
                navigatorMock);

        const popup: Popup = new Popup();
        popup.setDOMContent(document.createElement("div"));

        const updateSpy: jasmine.Spy = spyOn(popup, "update").and.stub();

        popupComponent.add([popup]);

        popupComponent.activate();

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$).next(null);
        (<Subject<ISize>>containerMock.renderService.size$).next(null);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$).next(null);

        expect(updateSpy.calls.count()).toBe(1);
    });

    it("should not update a popup  when deactivated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                containerMock,
                navigatorMock);

        const popup: Popup = new Popup();
        popup.setDOMContent(document.createElement("div"));

        const updateSpy: jasmine.Spy = spyOn(popup, "update").and.stub();
        spyOn(popup, "remove").and.stub();

        popupComponent.add([popup]);

        popupComponent.activate();
        popupComponent.deactivate();

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$).next(null);
        (<Subject<ISize>>containerMock.renderService.size$).next(null);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$).next(null);

        expect(updateSpy.calls.count()).toBe(0);
    });
});

describe("PopupComponent.deactivate", () => {
    it("should remove a popup once when deactivated", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                containerMock,
                navigatorMock);

        const popup: Popup = new Popup();
        popup.setDOMContent(document.createElement("div"));

        const removeSpy: jasmine.Spy = spyOn(popup, "remove").and.stub();

        popupComponent.add([popup]);

        popupComponent.activate();
        popupComponent.deactivate();

        expect(removeSpy.calls.count()).toBe(1);
    });
});
