import * as THREE from "three";

import { Subject } from "rxjs";

import { ContainerMockCreator } from "../../helper/ContainerMockCreator.spec";
import { EventHelper } from "../../helper/EventHelper.spec";
import { MockCreator } from "../../helper/MockCreator.spec";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator.spec";
import { TransformHelper } from "../../helper/TransformHelper.spec";

import { Navigator } from "../../../src/viewer/Navigator";
import { Transform } from "../../../src/geo/Transform";
import { Component } from "../../../src/component/Component";
import { IComponentConfiguration } from "../../../src/component/interfaces/IComponentConfiguration";
import { KeyZoomHandler } from "../../../src/component/keyboard/KeyZoomHandler";
import { ViewportCoords } from "../../../src/geo/ViewportCoords";
import { RenderCamera } from "../../../src/render/RenderCamera";
import { Container } from "../../../src/viewer/Container";
import { RenderMode } from "../../../src/render/RenderMode";

interface ITestConfiguration extends IComponentConfiguration {
    test: boolean;
}

class TestComponent extends Component<ITestConfiguration> {
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }
    protected _activate(): void { /* noop */ }
    protected _deactivate(): void { /* noop */ }
    protected _getDefaultConfiguration(): ITestConfiguration { return { test: false }; }
}

describe("KeyZoomHandler.ctor", () => {
    it("should be defined", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();
        const viewportCoordsMock: ViewportCoords =
            new MockCreator().create(ViewportCoords, "ViewportCoords");

        const handler: KeyZoomHandler = new KeyZoomHandler(
            new TestComponent("test", containerMock, navigatorMock),
            containerMock,
            navigatorMock,
            viewportCoordsMock);

        expect(handler).toBeDefined();
    });
});

describe("KeyZoomHandler.disable", () => {
    it("should disable correctly", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();
        const viewportCoordsMock: ViewportCoords =
            new MockCreator().create(ViewportCoords, "ViewportCoords");

        const testComponent: TestComponent = new TestComponent("test", containerMock, navigatorMock);
        const handler: KeyZoomHandler = new KeyZoomHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock);

        testComponent.activate();
        handler.enable();

        expect(handler.isEnabled).toBe(true);

        handler.disable();

        expect(handler.isEnabled).toBe(false);
    });
});

describe("KeyZoomHandler.enable", () => {
    it("should not prevent default if modifier key is pressed", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();
        const viewportCoordsMock: ViewportCoords =
            new MockCreator().create(ViewportCoords, "ViewportCoords");

        const testComponent: TestComponent = new TestComponent("test", containerMock, navigatorMock);
        const handler: KeyZoomHandler = new KeyZoomHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock);

        testComponent.activate();
        handler.enable();

        (<jasmine.Spy>viewportCoordsMock.unprojectFromViewport).and.returnValue(new THREE.Vector3());

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$)
            .next(new RenderCamera(1, 1, RenderMode.Fill));

        const transform: Transform = new TransformHelper().createTransform();
        spyOn(transform, "projectBasic").and.returnValue([1, 1]);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(transform);

        let keyboardEvent: KeyboardEvent = EventHelper.createKeyboardEvent("keydown", { key: "+", ctrlKey: true });
        const preventDefaultSpyCtrl: jasmine.Spy = spyOn(keyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(keyboardEvent);
        expect(preventDefaultSpyCtrl.calls.count()).toBe(0);

        keyboardEvent = EventHelper.createKeyboardEvent("keydown", { key: "+", altKey: true });
        const preventDefaultSpyAlt: jasmine.Spy = spyOn(keyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(keyboardEvent);
        expect(preventDefaultSpyAlt.calls.count()).toBe(0);

        keyboardEvent = EventHelper.createKeyboardEvent("keydown", { key: "+", shiftKey: true });
        const preventDefaultSpyShift: jasmine.Spy = spyOn(keyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(keyboardEvent);
        expect(preventDefaultSpyShift.calls.count()).toBe(0);

        keyboardEvent = EventHelper.createKeyboardEvent("keydown", { key: "+", metaKey: true });
        const preventDefaultSpyMeta: jasmine.Spy = spyOn(keyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(keyboardEvent);
        expect(preventDefaultSpyMeta.calls.count()).toBe(0);

        const zoomInSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.stateService.zoomIn;
        expect(zoomInSpy.calls.count()).toBe(0);
    });

    it("should prevent default if no modifier key is pressed", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();
        const viewportCoordsMock: ViewportCoords =
            new MockCreator().create(ViewportCoords, "ViewportCoords");

        const testComponent: TestComponent = new TestComponent("test", containerMock, navigatorMock);
        const handler: KeyZoomHandler = new KeyZoomHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock);

        testComponent.activate();
        handler.enable();

        (<jasmine.Spy>viewportCoordsMock.unprojectFromViewport).and.returnValue(new THREE.Vector3());

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$)
            .next(new RenderCamera(1, 1, RenderMode.Fill));

        const transform: Transform = new TransformHelper().createTransform();
        spyOn(transform, "projectBasic").and.returnValue([1, 1]);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(transform);

        const keyboardEvent: KeyboardEvent = EventHelper.createKeyboardEvent("keydown", { key: "+" });
        const preventDefaultSpy: jasmine.Spy = spyOn(keyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(keyboardEvent);
        expect(preventDefaultSpy.calls.count()).toBe(1);
    });

    it("should zoom in if `+` is pressed", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();
        const viewportCoordsMock: ViewportCoords =
            new MockCreator().create(ViewportCoords, "ViewportCoords");

        const testComponent: TestComponent = new TestComponent("test", containerMock, navigatorMock);
        const handler: KeyZoomHandler = new KeyZoomHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock);

        testComponent.activate();
        handler.enable();

        (<jasmine.Spy>viewportCoordsMock.unprojectFromViewport).and.returnValue(new THREE.Vector3());

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$)
            .next(new RenderCamera(1, 1, RenderMode.Fill));

        const transform: Transform = new TransformHelper().createTransform();
        spyOn(transform, "projectBasic").and.returnValue([1, 1]);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(transform);

        const keyboardEvent: KeyboardEvent = EventHelper.createKeyboardEvent("keydown", { key: "+" });
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(keyboardEvent);

        const zoomInSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.stateService.zoomIn;
        expect(zoomInSpy.calls.count()).toBe(1);
        expect(zoomInSpy.calls.first().args[0]).toBe(1);
    });

    it("should zoom out if `-` is pressed", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();
        const viewportCoordsMock: ViewportCoords =
            new MockCreator().create(ViewportCoords, "ViewportCoords");

        const testComponent: TestComponent = new TestComponent("test", containerMock, navigatorMock);
        const handler: KeyZoomHandler = new KeyZoomHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock);

        testComponent.activate();
        handler.enable();

        (<jasmine.Spy>viewportCoordsMock.unprojectFromViewport).and.returnValue(new THREE.Vector3());

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$)
            .next(new RenderCamera(1, 1, RenderMode.Fill));

        const transform: Transform = new TransformHelper().createTransform();
        spyOn(transform, "projectBasic").and.returnValue([1, 1]);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(transform);

        const keyboardEvent: KeyboardEvent = EventHelper.createKeyboardEvent("keydown", { key: "-" });
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(keyboardEvent);

        const zoomInSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.stateService.zoomIn;
        expect(zoomInSpy.calls.count()).toBe(1);
        expect(zoomInSpy.calls.first().args[0]).toBe(-1);
    });
});
