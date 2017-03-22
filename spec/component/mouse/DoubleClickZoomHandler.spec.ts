/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {MockCreator} from "../../helper/MockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";
import {TransformHelper} from "../../helper/TransformHelper.spec";

import {
    Component,
    DoubleClickZoomHandler,
    IComponentConfiguration,
} from "../../../src/Component";
import {
    Transform,
    ViewportCoords,
} from "../../../src/Geo";
import {
    RenderCamera,
    RenderMode,
} from "../../../src/Render";
import {
    Container,
    Navigator,
} from "../../../src/Viewer";

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

const createMouseEvent: (eventType: string, params: MouseEventInit) => MouseEvent =
    (eventType: string, params: MouseEventInit): MouseEvent => {
    const mouseEvent: MouseEvent = document.createEvent("MouseEvent");
    mouseEvent.initMouseEvent(
        eventType,
        params.bubbles !== undefined ? params.bubbles : false,
        params.cancelable !== undefined ? params.cancelable : false,
        window,
        params.detail !== undefined ? params.detail : 0,
        params.screenX !== undefined ? params.screenX : 0,
        params.screenY !== undefined ? params.screenY : 0,
        params.clientX !== undefined ? params.clientX : 0,
        params.clientY !== undefined ? params.clientY : 0,
        !!params.ctrlKey,
        !!params.altKey,
        !!params.shiftKey,
        !!params.metaKey,
        params.button !== undefined ? params.button : 0,
        null);

    return mouseEvent;
};

const createTouchEvent: (eventType: string, shiftKey: boolean) => TouchEvent =
    (eventType: string, shiftKey: boolean): TouchEvent => {
    const event: UIEvent = document.createEvent("UIEvent");

    Object.defineProperty(
        event,
        "touches",
        {
            get: (): Touch[] => { return [<Touch>{ clientX: 0, clientY: 0 }]; },
        });

    Object.defineProperty(
        event,
        "shiftKey",
        {
            get: (): boolean => { return shiftKey; },
        });

    return <TouchEvent>event;
};

describe("DoubleClickZoomHandler.ctor", () => {
    it("should be defined", () => {
        let mockCreator: MockCreator = new MockCreator();
        let containerMock: Container = mockCreator.createMock(Container, "Container");
        let navigatorMock: Navigator = mockCreator.createMock(Navigator, "Navigator");
        let viewportCoordsMock: ViewportCoords =
            mockCreator.createMock(ViewportCoords, "ViewportCoords");

        let handler: DoubleClickZoomHandler = new DoubleClickZoomHandler(
            new TestComponent("test", containerMock, navigatorMock),
            containerMock,
            navigatorMock,
            viewportCoordsMock);

        expect(handler).toBeDefined();
    });
});

describe("DoubleClickZoomHandler.enable", () => {
    let containerMock: Container;
    let navigatorMock: Navigator;
    let viewportCoordsMock: ViewportCoords;
    let testComponent: TestComponent;

    beforeEach(() => {
        containerMock = new ContainerMockCreator().createMock();
        navigatorMock = new NavigatorMockCreator().createMock();
        viewportCoordsMock = new MockCreator().createMock(ViewportCoords, "ViewportCoords");
        testComponent = new TestComponent("test", containerMock, navigatorMock);
    });

    it("should zoom in on mouse double click", () => {
        (<jasmine.Spy>viewportCoordsMock.canvasPosition).and.returnValue([[0, 0]]);
        (<jasmine.Spy>viewportCoordsMock.unprojectFromCanvas).and.returnValue(new THREE.Vector3());

        const filteredSubject$: Subject<MouseEvent> = new Subject<MouseEvent>();
        (<jasmine.Spy>containerMock.mouseService.filtered$)
            .and.returnValue(filteredSubject$);

        let handler: DoubleClickZoomHandler = new DoubleClickZoomHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock);

        testComponent.activate();
        handler.enable();

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$)
            .next(new RenderCamera(1, RenderMode.Fill));

        let transform: Transform = new TransformHelper().createTransform();
        spyOn(transform, "projectBasic").and.returnValue([1, 1]);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(transform);

        const mouseEvent: MouseEvent =
            createMouseEvent("dblclick", { clientX: 0, clientY: 0, shiftKey: false });
        filteredSubject$.next(mouseEvent);

        const zoomInSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.stateService.zoomIn;

        expect(zoomInSpy.calls.count()).toBe(1);
        expect(zoomInSpy.calls.first().args[0]).toBe(1);
    });

    it("should zoom out on mouse double click with shift", () => {
        (<jasmine.Spy>viewportCoordsMock.canvasPosition).and.returnValue([[0, 0]]);
        (<jasmine.Spy>viewportCoordsMock.unprojectFromCanvas).and.returnValue(new THREE.Vector3());

        const filteredSubject$: Subject<MouseEvent> = new Subject<MouseEvent>();
        (<jasmine.Spy>containerMock.mouseService.filtered$)
            .and.returnValue(filteredSubject$);

        let handler: DoubleClickZoomHandler = new DoubleClickZoomHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock);

        testComponent.activate();
        handler.enable();

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$)
            .next(new RenderCamera(1, RenderMode.Fill));

        let transform: Transform = new TransformHelper().createTransform();
        spyOn(transform, "projectBasic").and.returnValue([1, 1]);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(transform);

        const mouseEvent: MouseEvent =
            createMouseEvent("dblclick", { clientX: 0, clientY: 0, shiftKey: true });
        filteredSubject$.next(mouseEvent);

        const zoomInSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.stateService.zoomIn;

        expect(zoomInSpy.calls.count()).toBe(1);
        expect(zoomInSpy.calls.first().args[0]).toBe(-1);
    });

    it("should zoom in on double tap", () => {
        (<jasmine.Spy>viewportCoordsMock.canvasPosition).and.returnValue([[0, 0]]);
        (<jasmine.Spy>viewportCoordsMock.unprojectFromCanvas).and.returnValue(new THREE.Vector3());

        (<jasmine.Spy>containerMock.mouseService.filtered$)
            .and.returnValue(Observable.empty<MouseEvent>());

        let handler: DoubleClickZoomHandler = new DoubleClickZoomHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock);

        testComponent.activate();
        handler.enable();

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$)
            .next(new RenderCamera(1, RenderMode.Fill));

        let transform: Transform = new TransformHelper().createTransform();
        spyOn(transform, "projectBasic").and.returnValue([1, 1]);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(transform);

        const touchEvent: TouchEvent = createTouchEvent("touchstart", false);
        (<Subject<TouchEvent>>containerMock.touchService.doubleTap$).next(touchEvent);

        const zoomInSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.stateService.zoomIn;

        expect(zoomInSpy.calls.count()).toBe(1);
        expect(zoomInSpy.calls.first().args[0]).toBe(1);
    });

    it("should zoom out on double tap with shift", () => {
        (<jasmine.Spy>viewportCoordsMock.canvasPosition).and.returnValue([[0, 0]]);
        (<jasmine.Spy>viewportCoordsMock.unprojectFromCanvas).and.returnValue(new THREE.Vector3());

        (<jasmine.Spy>containerMock.mouseService.filtered$)
            .and.returnValue(Observable.empty<MouseEvent>());

        let handler: DoubleClickZoomHandler = new DoubleClickZoomHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock);

        testComponent.activate();
        handler.enable();

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$)
            .next(new RenderCamera(1, RenderMode.Fill));

        let transform: Transform = new TransformHelper().createTransform();
        spyOn(transform, "projectBasic").and.returnValue([1, 1]);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(transform);

        const touchEvent: TouchEvent = createTouchEvent("touchstart", true);
        (<Subject<TouchEvent>>containerMock.touchService.doubleTap$).next(touchEvent);

        const zoomInSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.stateService.zoomIn;

        expect(zoomInSpy.calls.count()).toBe(1);
        expect(zoomInSpy.calls.first().args[0]).toBe(-1);
    });
});
