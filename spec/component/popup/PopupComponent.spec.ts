/// <reference path="../../../typings/index.d.ts" />

import {
    Popup,
    PopupComponent,
} from "../../../src/Component";
import {Container} from "../../../src/Viewer";

import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";

describe("PopupComponent.ctor", () => {
    it("should be defined", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().createMock(),
                new NavigatorMockCreator().createMock());

        expect(popupComponent).toBeDefined();
    });
});

describe("PopupComponent.deactivate", () => {
    it("should deactivate properly", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().createMock(),
                new NavigatorMockCreator().createMock());

        popupComponent.activate();
        popupComponent.deactivate();
    });
});

describe("PopupComponent.add", () => {
    it("should add a single popup", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().createMock(),
                new NavigatorMockCreator().createMock());

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
                new ContainerMockCreator().createMock(),
                new NavigatorMockCreator().createMock());

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
                new ContainerMockCreator().createMock(),
                new NavigatorMockCreator().createMock());

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
});

describe("PopupComponent.remove", () => {
    it("should remove a single popup", () => {
        const popupComponent: PopupComponent =
            new PopupComponent(
                PopupComponent.componentName,
                new ContainerMockCreator().createMock(),
                new NavigatorMockCreator().createMock());

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
                new ContainerMockCreator().createMock(),
                new NavigatorMockCreator().createMock());

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
                new ContainerMockCreator().createMock(),
                new NavigatorMockCreator().createMock());

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
                new ContainerMockCreator().createMock(),
                new NavigatorMockCreator().createMock());

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
                new ContainerMockCreator().createMock(),
                new NavigatorMockCreator().createMock());

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
                new ContainerMockCreator().createMock(),
                new NavigatorMockCreator().createMock());

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
