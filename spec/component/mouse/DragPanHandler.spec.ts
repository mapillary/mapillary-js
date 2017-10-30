/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {EventHelper} from "../../helper/EventHelper.spec";
import {FrameHelper} from "../../helper/FrameHelper.spec";
import {MockCreator} from "../../helper/MockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";
import {TestComponent} from "../../helper/TestComponent.spec";
import {TransformHelper} from "../../helper/TransformHelper.spec";

import {
    DragPanHandler,
} from "../../../src/Component";
import {
    Camera,
    Spatial,
    Transform,
    ViewportCoords,
} from "../../../src/Geo";
import {
    RenderCamera,
    RenderMode,
} from "../../../src/Render";
import {IFrame} from "../../../src/State";
import {
    Container,
    Navigator,
} from "../../../src/Viewer";

describe("DragPanHandler.ctor", () => {
    it("should be defined", () => {
        let mockCreator: MockCreator = new MockCreator();
        let containerMock: Container = mockCreator.create(Container, "Container");
        let navigatorMock: Navigator = mockCreator.create(Navigator, "Navigator");
        let viewportCoordsMock: ViewportCoords =
            mockCreator.create(ViewportCoords, "ViewportCoords");
        let spatialMock: Spatial = mockCreator.create(Spatial, "Spatial");

        let handler: DragPanHandler = new DragPanHandler(
            new TestComponent("test", containerMock, navigatorMock),
            containerMock,
            navigatorMock,
            viewportCoordsMock,
            spatialMock);

        expect(handler).toBeDefined();
    });
});

describe("DragPanHandler.disable", () => {
    it("should disable properly", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();
        const testComponent: TestComponent = new TestComponent("test", containerMock, navigatorMock);
        const viewportCoordsMock: ViewportCoords = new MockCreator().create(ViewportCoords, "ViewportCoords");
        let spatialMock: Spatial = new MockCreator().create(Spatial, "Spatial");

        (<jasmine.Spy>containerMock.mouseService.filtered$)
            .and.returnValue(new Subject<MouseEvent>());

        const handler: DragPanHandler = new DragPanHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock,
            spatialMock);

        expect(handler.isEnabled).toBe(false);

        testComponent.activate();
        handler.enable();

        expect(handler.isEnabled).toBe(true);

        handler.disable();

        expect(handler.isEnabled).toBe(false);
    });
});

describe("DragPanHandler.enable", () => {
    let containerMock: Container;
    let navigatorMock: Navigator;
    let spatialMock: Spatial;
    let viewportCoordsMock: ViewportCoords;
    let testComponent: TestComponent;

    let filteredMouseDragStart$: Subject<MouseEvent>;
    let filteredMouseDrag$: Subject<MouseEvent>;
    let filteredMouseDragEnd$: Subject<MouseEvent>;

    beforeEach(() => {
        containerMock = new ContainerMockCreator().create();
        navigatorMock = new NavigatorMockCreator().create();
        testComponent = new TestComponent("test", containerMock, navigatorMock);
        viewportCoordsMock = new MockCreator().create(ViewportCoords, "ViewportCoords");
        spatialMock = new MockCreator().create(Spatial, "Spatial");

        filteredMouseDragStart$ = new Subject<MouseEvent>();
        filteredMouseDrag$ = new Subject<MouseEvent>();
        filteredMouseDragEnd$ = new Subject<MouseEvent>();

        (<jasmine.Spy>containerMock.mouseService.filtered$)
            .and.callFake(
                (name: string, observable: Observable<MouseEvent>): Subject<MouseEvent> => {
                    if (observable == null) {
                        throw Error("Observable is not defined");
                    }

                    if (observable === containerMock.mouseService.mouseDragStart$) {
                        return filteredMouseDragStart$;
                    } else if (observable === containerMock.mouseService.mouseDrag$) {
                        return filteredMouseDrag$;
                    } else if (observable === containerMock.mouseService.mouseDragEnd$) {
                        return filteredMouseDragEnd$;
                    }

                    throw Error("Filtered observable not supported.");
                });
    });

    it("should activate mouse", (done: Function) => {
        const handler: DragPanHandler = new DragPanHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock,
            spatialMock);

        testComponent.activate();
        handler.enable();

        containerMock.mouseService.activate$
            .subscribe(
                (activate: boolean): void => {
                    expect(activate).toBe(true);

                    done();
                });

        filteredMouseDragStart$.next(EventHelper.createMouseEvent("mousedown", {}));
    });

    it("should deactivate mouse", (done: Function) => {
        const handler: DragPanHandler = new DragPanHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock,
            spatialMock);

        testComponent.activate();
        handler.enable();

        containerMock.mouseService.activate$
            .subscribe(
                (activate: boolean): void => {
                    expect(activate).toBe(false);

                    done();
                });

        filteredMouseDragEnd$.next(EventHelper.createMouseEvent("mouseup", {}));
    });

    it("should activate touch", (done: Function) => {
        const handler: DragPanHandler = new DragPanHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock,
            spatialMock);

        testComponent.activate();
        handler.enable();

        containerMock.touchService.activate$
            .subscribe(
                (activate: boolean): void => {
                    expect(activate).toBe(true);

                    done();
                });

        (<Subject<TouchEvent>>containerMock.touchService.singleTouchDragStart$)
            .next(EventHelper.createTouchEvent("tap", false));
    });

    it("should deactivate touch", (done: Function) => {
        const handler: DragPanHandler = new DragPanHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock,
            spatialMock);

        testComponent.activate();
        handler.enable();

        containerMock.touchService.activate$
            .subscribe(
                (activate: boolean): void => {
                    expect(activate).toBe(false);

                    done();
                });

        (<Subject<TouchEvent>>containerMock.touchService.singleTouchDragEnd$)
            .next(EventHelper.createTouchEvent("tap", false));
    });

    it("should rotate basic without inertia on mouse drag", () => {
        (<jasmine.Spy>viewportCoordsMock.canvasPosition).and.returnValue([[0, 0]]);
        (<jasmine.Spy>viewportCoordsMock.unprojectFromCanvas).and.returnValue(new THREE.Vector3());
        (<jasmine.Spy>viewportCoordsMock.getPixelDistances).and.returnValue([0, 0, 0, 0]);
        (<jasmine.Spy>spatialMock.clamp).and.returnValue(0);

        const handler: DragPanHandler = new DragPanHandler(
            testComponent,
            containerMock,
            navigatorMock,
            viewportCoordsMock,
            spatialMock);

        testComponent.activate();
        handler.enable();

        const frame: IFrame = new FrameHelper().createFrame();
        (<Subject<IFrame>>navigatorMock.stateService.currentState$).next(frame);

        (<Subject<RenderCamera>>containerMock.renderService.renderCamera$)
        .next(new RenderCamera(1, 1, RenderMode.Fill));

        const transform: Transform = new TransformHelper().createTransform();
        spyOn(transform, "projectBasic").and.returnValue([1, 1]);
        (<Subject<Transform>>navigatorMock.stateService.currentTransform$)
            .next(transform);

        (<Subject<Camera>>navigatorMock.stateService.currentCamera$)
            .next(new Camera());

        filteredMouseDragStart$.next(EventHelper.createMouseEvent("mousedown", {}));
        filteredMouseDrag$.next(EventHelper.createMouseEvent("mousemove", {}));

        expect((<jasmine.Spy>navigatorMock.stateService.rotateBasicWithoutInertia).calls.count()).toBe(1);
    });
});
