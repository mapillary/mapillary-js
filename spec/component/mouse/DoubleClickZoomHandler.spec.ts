import { empty as observableEmpty, Subject } from "rxjs";
import * as THREE from "three";

import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { EventHelper } from "../../helper/EventHelper";
import { MockCreator } from "../../helper/MockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";
import { TestComponent } from "../../helper/TestComponent";
import { TransformHelper } from "../../helper/TransformHelper";

import { Navigator } from "../../../src/viewer/Navigator";
import { Transform } from "../../../src/geo/Transform";
import { DoubleClickZoomHandler } from "../../../src/component/mouse/DoubleClickZoomHandler";
import { ViewportCoords } from "../../../src/geo/ViewportCoords";
import { RenderCamera } from "../../../src/render/RenderCamera";
import { Container } from "../../../src/viewer/Container";
import { RenderMode } from "../../../src/render/RenderMode";

describe("DoubleClickZoomHandler.ctor", () => {
    it("should be defined", () => {
        let mockCreator: MockCreator = new MockCreator();
        let containerMock: Container = mockCreator.create(Container, "Container");
        let navigatorMock: Navigator = mockCreator.create(Navigator, "Navigator");
        let viewportCoordsMock: ViewportCoords =
            mockCreator.create(ViewportCoords, "ViewportCoords");

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
        containerMock = new ContainerMockCreator().create();
        navigatorMock = new NavigatorMockCreator().create();
        viewportCoordsMock = new MockCreator().create(ViewportCoords, "ViewportCoords");
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
            .next(new RenderCamera(1, 1, RenderMode.Fill));

        let transform: Transform = new TransformHelper().createTransform();
        spyOn(transform, "projectBasic").and.returnValue([1, 1]);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(transform);

        const mouseEvent: MouseEvent =
            EventHelper.createMouseEvent("dblclick", { clientX: 0, clientY: 0, shiftKey: false });
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
            .next(new RenderCamera(1, 1, RenderMode.Fill));

        let transform: Transform = new TransformHelper().createTransform();
        spyOn(transform, "projectBasic").and.returnValue([1, 1]);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(transform);

        const mouseEvent: MouseEvent =
            EventHelper.createMouseEvent("dblclick", { clientX: 0, clientY: 0, shiftKey: true });
        filteredSubject$.next(mouseEvent);

        const zoomInSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.stateService.zoomIn;

        expect(zoomInSpy.calls.count()).toBe(1);
        expect(zoomInSpy.calls.first().args[0]).toBe(-1);
    });

    it("should zoom in on double tap", () => {
        (<jasmine.Spy>viewportCoordsMock.canvasPosition).and.returnValue([[0, 0]]);
        (<jasmine.Spy>viewportCoordsMock.unprojectFromCanvas).and.returnValue(new THREE.Vector3());

        (<jasmine.Spy>containerMock.mouseService.filtered$)
            .and.returnValue(observableEmpty());

        let handler: DoubleClickZoomHandler = new DoubleClickZoomHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock);

        testComponent.activate();
        handler.enable();

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$)
            .next(new RenderCamera(1, 1, RenderMode.Fill));

        let transform: Transform = new TransformHelper().createTransform();
        spyOn(transform, "projectBasic").and.returnValue([1, 1]);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(transform);

        const touchEvent: TouchEvent = EventHelper.createTouchEvent("touchstart", false);
        (<Subject<TouchEvent>>containerMock.touchService.doubleTap$).next(touchEvent);

        const zoomInSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.stateService.zoomIn;

        expect(zoomInSpy.calls.count()).toBe(1);
        expect(zoomInSpy.calls.first().args[0]).toBe(1);
    });

    it("should zoom out on double tap with shift", () => {
        (<jasmine.Spy>viewportCoordsMock.canvasPosition).and.returnValue([[0, 0]]);
        (<jasmine.Spy>viewportCoordsMock.unprojectFromCanvas).and.returnValue(new THREE.Vector3());

        (<jasmine.Spy>containerMock.mouseService.filtered$)
            .and.returnValue(observableEmpty());

        let handler: DoubleClickZoomHandler = new DoubleClickZoomHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock);

        testComponent.activate();
        handler.enable();

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$)
            .next(new RenderCamera(1, 1, RenderMode.Fill));

        let transform: Transform = new TransformHelper().createTransform();
        spyOn(transform, "projectBasic").and.returnValue([1, 1]);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(transform);

        const touchEvent: TouchEvent = EventHelper.createTouchEvent("touchstart", true);
        (<Subject<TouchEvent>>containerMock.touchService.doubleTap$).next(touchEvent);

        const zoomInSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.stateService.zoomIn;

        expect(zoomInSpy.calls.count()).toBe(1);
        expect(zoomInSpy.calls.first().args[0]).toBe(-1);
    });
});

describe("DoubleClickZoomHandler.disable", () => {
    it("should disable properly", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();
        const viewportCoordsMock: ViewportCoords = new MockCreator().create(ViewportCoords, "ViewportCoords");
        const testComponent: TestComponent = new TestComponent("test", containerMock, navigatorMock);

        (<jasmine.Spy>containerMock.mouseService.filtered$)
            .and.returnValue(new Subject<MouseEvent>());

        const handler: DoubleClickZoomHandler = new DoubleClickZoomHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock);

        expect(handler.isEnabled).toBe(false);

        testComponent.activate();
        handler.enable();

        expect(handler.isEnabled).toBe(true);

        handler.disable();

        expect(handler.isEnabled).toBe(false);
    });
});
