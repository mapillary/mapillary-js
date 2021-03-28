
import { of as observableOf, ReplaySubject, Subject, VirtualTimeScheduler } from "rxjs";

import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { MockCreator } from "../../helper/MockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";
import { ImageHelper } from "../../helper/ImageHelper";

import { Navigator } from "../../../src/viewer/Navigator";
import { Image } from "../../../src/graph/Image";
import { SequenceComponent } from "../../../src/component/sequence/SequenceComponent";
import { SequenceDOMRenderer } from "../../../src/component/sequence/SequenceDOMRenderer";
import { GraphMode } from "../../../src/graph/GraphMode";
import { NavigationEdgeStatus } from "../../../src/graph/interfaces/NavigationEdgeStatus";
import { Sequence } from "../../../src/graph/Sequence";
import { ViewportSize } from "../../../src/render/interfaces/ViewportSize";
import { State } from "../../../src/state/State";
import { Container } from "../../../src/viewer/Container";

describe("SequenceComponent.ctor", () => {
    it("should be defined", () => {
        const sequenceComponent: SequenceComponent =
            new SequenceComponent(
                SequenceComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        expect(sequenceComponent).toBeDefined();
    });
});

describe("SequenceComponent.deactivate", () => {
    it("should deactivate properly", () => {
        const component: SequenceComponent =
            new SequenceComponent(
                SequenceComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        component.activate();
        component.deactivate();
    });
});

describe("SequenceComponent.activate", () => {
    let mockCreator: MockCreator;
    let containerMock: Container;
    let navigatorMock: Navigator;
    let imageHelper: ImageHelper;

    let renderer: SequenceDOMRenderer;

    beforeEach((): void => {
        mockCreator = new MockCreator();
        containerMock = new ContainerMockCreator().create();
        navigatorMock = new NavigatorMockCreator().create();
        imageHelper = new ImageHelper();

        renderer = new SequenceDOMRenderer(containerMock);
    });

    const createComponent: () => SequenceComponent = (): SequenceComponent => {
        const component: SequenceComponent = new SequenceComponent(
            SequenceComponent.componentName,
            containerMock,
            navigatorMock,
            renderer);

        return component;
    };

    it("should set graph mode to sequence when changing position", () => {
        const setGraphModeSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.graphService.setGraphMode;

        const changingPositionChangedSubject$: Subject<boolean> = new Subject<boolean>();
        mockCreator.mockProperty(renderer, "changingPositionChanged$", changingPositionChangedSubject$);

        const component: SequenceComponent = createComponent();
        component.activate();

        changingPositionChangedSubject$.next(true);

        expect(setGraphModeSpy.calls.count()).toBe(1);
        expect(setGraphModeSpy.calls.argsFor(0)[0]).toBe(GraphMode.Sequence);
    });

    it("should set graph mode to spatial when not changing position", () => {
        const setGraphModeSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.graphService.setGraphMode;

        const changingPositionChangedSubject$: Subject<boolean> = new Subject<boolean>();
        mockCreator.mockProperty(renderer, "changingPositionChanged$", changingPositionChangedSubject$);

        const component: SequenceComponent = createComponent();
        component.activate();

        changingPositionChangedSubject$.next(false);

        expect(setGraphModeSpy.calls.count()).toBe(1);
        expect(setGraphModeSpy.calls.argsFor(0)[0]).toBe(GraphMode.Spatial);
    });

    it("should stop play when changing position", () => {
        const stopSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.playService.stop;

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        const changingPositionChangedSubject$: Subject<boolean> = new Subject<boolean>();
        mockCreator.mockProperty(renderer, "changingPositionChanged$", changingPositionChangedSubject$);

        const component: SequenceComponent = createComponent();
        component.activate();

        const count: number = stopSpy.calls.count();

        changingPositionChangedSubject$.next(true);

        expect(stopSpy.calls.count() - count).toBe(1);
    });

    it("should cache two images when graph mode changes to spatial if not spatial edges cached", () => {
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceImages$).and.returnValue(new Subject<Sequence>());

        const cacheImageSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.graphService.cacheImage$;
        cacheImageSpy.and.returnValue(new Subject<Image>());

        const component: SequenceComponent = createComponent();
        component.activate();

        const graphModeSubject$: Subject<GraphMode> = <Subject<GraphMode>>navigatorMock.graphService.graphMode$;
        graphModeSubject$.next(GraphMode.Spatial);

        const image1: Image = imageHelper.createImage();
        mockCreator.mockProperty(image1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image1, "sequenceEdges$", new Subject<NavigationEdgeStatus>());
        mockCreator.mockProperty(image1, "id", "imageKey1");
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image1);

        expect(cacheImageSpy.calls.count()).toBe(1);
        expect(cacheImageSpy.calls.argsFor(0)[0]).toBe(image1.id);

        const image2: Image = imageHelper.createImage();
        mockCreator.mockProperty(image2, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image2, "sequenceEdges$", new Subject<NavigationEdgeStatus>());
        mockCreator.mockProperty(image2, "id", "imageKey2");
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image2);

        expect(cacheImageSpy.calls.count()).toBe(2);
        expect(cacheImageSpy.calls.argsFor(1)[0]).toBe(image2.id);

        const image3: Image = imageHelper.createImage();
        mockCreator.mockProperty(image3, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image3, "sequenceEdges$", new Subject<NavigationEdgeStatus>());
        mockCreator.mockProperty(image3, "id", "imageKey2");
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image3);

        expect(cacheImageSpy.calls.count()).toBe(2);
    });

    it("should cache sequence when sequence key of current image changes", () => {
        const cacheSequenceSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.graphService.cacheSequence$;
        cacheSequenceSpy.and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceImages$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheImage$).and.returnValue(new Subject<Image>());

        const component: SequenceComponent = createComponent();
        component.activate();

        const graphModeSubject$: Subject<GraphMode> = <Subject<GraphMode>>navigatorMock.graphService.graphMode$;
        graphModeSubject$.next(GraphMode.Spatial);

        const image1: Image = imageHelper.createImage();
        mockCreator.mockProperty(image1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image1, "sequenceEdges$", new Subject<NavigationEdgeStatus>());
        mockCreator.mockProperty(image1, "id", "imageKey1");
        mockCreator.mockProperty(image1, "sequenceId", "sequenceKey1");
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image1);

        expect(cacheSequenceSpy.calls.count()).toBe(1);
        expect(cacheSequenceSpy.calls.argsFor(0)[0]).toBe("sequenceKey1");

        const image2: Image = imageHelper.createImage();
        mockCreator.mockProperty(image2, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image2, "sequenceEdges$", new Subject<NavigationEdgeStatus>());
        mockCreator.mockProperty(image2, "id", "imageKey2");
        mockCreator.mockProperty(image2, "sequenceId", "sequenceKey1");
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image2);

        expect(cacheSequenceSpy.calls.count()).toBe(1);

        const image3: Image = imageHelper.createImage();
        mockCreator.mockProperty(image3, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image3, "sequenceEdges$", new Subject<NavigationEdgeStatus>());
        mockCreator.mockProperty(image3, "id", "imageKey3");
        mockCreator.mockProperty(image3, "sequenceId", "sequenceKey2");
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image3);

        expect(cacheSequenceSpy.calls.count()).toBe(2);
        expect(cacheSequenceSpy.calls.argsFor(1)[0]).toBe("sequenceKey2");
    });

    it("should cache sequence images when changing and in sequence graph mode", () => {
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(new Subject<Sequence>());
        const cacheSequenceImagesSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.graphService.cacheSequenceImages$;
        cacheSequenceImagesSpy.and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheImage$).and.returnValue(new Subject<Image>());

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        const changingPositionChangedSubject$: Subject<boolean> = new Subject<boolean>();
        mockCreator.mockProperty(renderer, "changingPositionChanged$", changingPositionChangedSubject$);

        const component: SequenceComponent = createComponent();
        component.activate();

        const image1: Image = imageHelper.createImage();
        mockCreator.mockProperty(image1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image1, "sequenceEdges$", new Subject<NavigationEdgeStatus>());
        mockCreator.mockProperty(image1, "id", "imageKey1");
        mockCreator.mockProperty(image1, "sequenceId", "sequenceKey1");
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image1);

        const graphModeSubject$: Subject<GraphMode> = <Subject<GraphMode>>navigatorMock.graphService.graphMode$;
        graphModeSubject$.next(GraphMode.Sequence);

        changingPositionChangedSubject$.next(true);
        changedSubject$.next(renderer);

        expect(cacheSequenceImagesSpy.calls.count()).toBe(1);
        expect(cacheSequenceImagesSpy.calls.argsFor(0)[0]).toBe("sequenceKey1");
        expect(cacheSequenceImagesSpy.calls.argsFor(0)[1]).toBe("imageKey1");

        changedSubject$.next(renderer);

        expect(cacheSequenceImagesSpy.calls.count()).toBe(1);

        changingPositionChangedSubject$.next(false);

        expect(cacheSequenceImagesSpy.calls.count()).toBe(1);

        graphModeSubject$.next(GraphMode.Spatial);

        expect(cacheSequenceImagesSpy.calls.count()).toBe(1);

        graphModeSubject$.next(GraphMode.Sequence);

        expect(cacheSequenceImagesSpy.calls.count()).toBe(1);

        changingPositionChangedSubject$.next(true);

        expect(cacheSequenceImagesSpy.calls.count()).toBe(2);
        expect(cacheSequenceImagesSpy.calls.argsFor(1)[0]).toBe("sequenceKey1");
        expect(cacheSequenceImagesSpy.calls.argsFor(1)[1]).toBe("imageKey1");
    });

    it("should render null index and null max when sequence is not cached", () => {
        const cacheSequenceSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.graphService.cacheSequence$;
        cacheSequenceSpy.and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceImages$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheImage$).and.returnValue(new Subject<Image>());

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        spyOn(renderer, "getContainerWidth").and.returnValue(100);

        const renderSpy: jasmine.Spy = spyOn(renderer, "render").and.stub();

        const component: SequenceComponent = createComponent();
        component.activate();

        (<Subject<State>>navigatorMock.stateService.state$).next(State.Traversing);
        (<Subject<number>>navigatorMock.playService.speed$).next(1);
        (<Subject<ViewportSize>>containerMock.renderService.size$).next({ height: 1, width: 1 });

        const image1: Image = imageHelper.createImage();
        mockCreator.mockProperty(image1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(image1, "id", "imageKey1");
        mockCreator.mockProperty(image1, "sequenceId", "sequenceKey1");
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image1);

        expect(renderSpy.calls.count()).toBe(1);
        expect(renderSpy.calls.argsFor(0)[4]).toBe(null);
        expect(renderSpy.calls.argsFor(0)[5]).toBe(null);
    });

    it("should render 0 index and 0 max when sequence is cached with single image", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceImages$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheImage$).and.returnValue(new Subject<Image>());

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        spyOn(renderer, "getContainerWidth").and.returnValue(100);

        const renderSpy: jasmine.Spy = spyOn(renderer, "render").and.stub();

        (<Subject<Image>>navigatorMock.stateService.currentImage$) = new ReplaySubject<Image>(1);

        const component: SequenceComponent = createComponent();
        component.activate();

        (<Subject<State>>navigatorMock.stateService.state$).next(State.Traversing);
        (<Subject<number>>navigatorMock.playService.speed$).next(1);
        (<Subject<ViewportSize>>containerMock.renderService.size$).next({ height: 1, width: 1 });

        const sequenceKey1: string = "sequenceKey1";
        const imageKey1: string = "imageKey1";

        const image1: Image = imageHelper.createImage();
        mockCreator.mockProperty(image1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(image1, "id", imageKey1);
        mockCreator.mockProperty(image1, "sequenceId", sequenceKey1);
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image1);

        expect(renderSpy.calls.count()).toBe(1);

        sequenceSubject$.next(new Sequence({ id: sequenceKey1, image_ids: [imageKey1] }));

        expect(renderSpy.calls.count()).toBe(2);
        expect(renderSpy.calls.argsFor(1)[4]).toBe(0);
        expect(renderSpy.calls.argsFor(1)[5]).toBe(0);
    });

    it("should render correct index on new image emit", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceImages$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheImage$).and.returnValue(new Subject<Image>());

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        spyOn(renderer, "getContainerWidth").and.returnValue(100);

        const renderSpy: jasmine.Spy = spyOn(renderer, "render").and.stub();

        (<Subject<Image>>navigatorMock.stateService.currentImage$) = new ReplaySubject<Image>(1);

        const component: SequenceComponent = createComponent();
        component.activate();

        (<Subject<State>>navigatorMock.stateService.state$).next(State.Traversing);
        (<Subject<number>>navigatorMock.playService.speed$).next(1);
        (<Subject<ViewportSize>>containerMock.renderService.size$).next({ height: 1, width: 1 });

        const sequenceKey1: string = "sequenceKey1";
        const imageKey1: string = "imageKey1";
        const imageKey2: string = "imageKey2";

        const image1: Image = imageHelper.createImage();
        mockCreator.mockProperty(image1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(image1, "id", imageKey1);
        mockCreator.mockProperty(image1, "sequenceId", sequenceKey1);
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image1);

        expect(renderSpy.calls.count()).toBe(1);

        sequenceSubject$.next(new Sequence({ id: sequenceKey1, image_ids: [imageKey1, imageKey2] }));

        expect(renderSpy.calls.count()).toBe(2);
        expect(renderSpy.calls.argsFor(1)[4]).toBe(0);
        expect(renderSpy.calls.argsFor(1)[5]).toBe(1);

        const image2: Image = imageHelper.createImage();
        mockCreator.mockProperty(image2, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image2, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(image2, "id", imageKey2);
        mockCreator.mockProperty(image2, "sequenceId", sequenceKey1);
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image2);

        expect(renderSpy.calls.count()).toBe(4);
        expect(renderSpy.calls.mostRecent().args[4]).toBe(1);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(1);
    });

    it("should render correct index on sequence change when changing position simultaneously", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceImages$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheImage$).and.returnValue(new Subject<Image>());

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        const changingPositionChangedSubject$: Subject<boolean> = new Subject<boolean>();
        mockCreator.mockProperty(renderer, "changingPositionChanged$", changingPositionChangedSubject$);
        spyOn(renderer, "getContainerWidth").and.returnValue(100);

        const renderSpy: jasmine.Spy = spyOn(renderer, "render").and.stub();

        (<Subject<Image>>navigatorMock.stateService.currentImage$) = new ReplaySubject<Image>(1);

        const component: SequenceComponent = createComponent();
        component.activate();

        (<Subject<State>>navigatorMock.stateService.state$).next(State.Traversing);
        (<Subject<number>>navigatorMock.playService.speed$).next(1);
        (<Subject<ViewportSize>>containerMock.renderService.size$).next({ height: 1, width: 1 });

        const sequenceKey1: string = "sequenceKey1";
        const sequenceKey2: string = "sequenceKey2";
        const imageKey1: string = "imageKey1";
        const imageKey2: string = "imageKey2";

        const image1: Image = imageHelper.createImage();
        mockCreator.mockProperty(image1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(image1, "id", imageKey1);
        mockCreator.mockProperty(image1, "sequenceId", sequenceKey1);
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image1);

        expect(renderSpy.calls.count()).toBe(1);

        sequenceSubject$.next(new Sequence({ id: sequenceKey1, image_ids: [imageKey1] }));

        expect(renderSpy.calls.count()).toBe(2);
        expect(renderSpy.calls.mostRecent().args[4]).toBe(0);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(0);

        changingPositionChangedSubject$.next(true);

        const image2: Image = imageHelper.createImage();
        mockCreator.mockProperty(image2, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image2, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(image2, "id", imageKey2);
        mockCreator.mockProperty(image2, "sequenceId", sequenceKey2);
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image2);

        changingPositionChangedSubject$.next(false);

        sequenceSubject$.next(new Sequence({ id: sequenceKey2, image_ids: [imageKey2] }));

        expect(renderSpy.calls.count()).toBeGreaterThan(2);
        expect(renderSpy.calls.mostRecent().args[4]).toBe(0);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(0);

    });

    it("should render correct index on input emit", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceImages$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheImage$).and.returnValue(new Subject<Image>());

        (<jasmine.Spy>navigatorMock.moveTo$).and.returnValue(new Subject<Image>());

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        const indexSubject$: Subject<number> = new Subject<number>();
        mockCreator.mockProperty(renderer, "index$", indexSubject$);
        const changingPositionChangedSubject$: Subject<boolean> = new Subject<boolean>();
        mockCreator.mockProperty(renderer, "changingPositionChanged$", changingPositionChangedSubject$);
        spyOn(renderer, "getContainerWidth").and.returnValue(100);

        const renderSpy: jasmine.Spy = spyOn(renderer, "render").and.stub();

        (<Subject<Image>>navigatorMock.stateService.currentImage$) = new ReplaySubject<Image>(1);

        const component: SequenceComponent = createComponent();
        component.activate();

        (<Subject<State>>navigatorMock.stateService.state$).next(State.Traversing);
        (<Subject<number>>navigatorMock.playService.speed$).next(1);
        (<Subject<ViewportSize>>containerMock.renderService.size$).next({ height: 1, width: 1 });

        const sequenceKey1: string = "sequenceKey1";
        const imageKey1: string = "imageKey1";
        const imageKey2: string = "imageKey2";
        const imageKey3: string = "imageKey3";

        const image1: Image = imageHelper.createImage();
        mockCreator.mockProperty(image1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(image1, "id", imageKey2);
        mockCreator.mockProperty(image1, "sequenceId", sequenceKey1);
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image1);

        expect(renderSpy.calls.count()).toBe(1);

        sequenceSubject$.next(new Sequence({ id: sequenceKey1, image_ids: [imageKey1, imageKey2, imageKey3] }));
        changingPositionChangedSubject$.next(true);
        indexSubject$.next(0);

        expect(renderSpy.calls.count()).toBeGreaterThan(1);
        expect(renderSpy.calls.mostRecent().args[4]).toBe(0);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(2);
    });

    it("should render on first image emit after sequence change and on second thereafter", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceImages$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheImage$).and.returnValue(new Subject<Image>());

        (<jasmine.Spy>navigatorMock.moveTo$).and.returnValue(new Subject<Image>());

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        const indexSubject$: Subject<number> = new Subject<number>();
        mockCreator.mockProperty(renderer, "index$", indexSubject$);
        const changingPositionChangedSubject$: Subject<boolean> = new Subject<boolean>();
        mockCreator.mockProperty(renderer, "changingPositionChanged$", changingPositionChangedSubject$);
        spyOn(renderer, "getContainerWidth").and.returnValue(100);

        const renderSpy: jasmine.Spy = spyOn(renderer, "render").and.stub();

        (<Subject<Image>>navigatorMock.stateService.currentImage$) = new ReplaySubject<Image>(1);

        const component: SequenceComponent = createComponent();
        component.activate();

        (<Subject<State>>navigatorMock.stateService.state$).next(State.Traversing);
        (<Subject<number>>navigatorMock.playService.speed$).next(1);
        (<Subject<ViewportSize>>containerMock.renderService.size$).next({ height: 1, width: 1 });

        const sequenceKey1: string = "sequenceKey1";
        const imageKey1: string = "imageKey1";
        const imageKey2: string = "imageKey2";
        const imageKey3: string = "imageKey3";

        const image1: Image = imageHelper.createImage();
        mockCreator.mockProperty(image1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(image1, "id", imageKey1);
        mockCreator.mockProperty(image1, "sequenceId", sequenceKey1);
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image1);

        expect(renderSpy.calls.count()).toBe(1);
        expect(renderSpy.calls.mostRecent().args[4]).toBe(null);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(null);

        sequenceSubject$.next(new Sequence({ id: sequenceKey1, image_ids: [imageKey1, imageKey2, imageKey3] }));

        expect(renderSpy.calls.count()).toBe(2);
        expect(renderSpy.calls.mostRecent().args[4]).toBe(0);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(2);

        changingPositionChangedSubject$.next(true);
        changedSubject$.next(renderer);

        let callCount: number = renderSpy.calls.count();

        expect(callCount).toBeGreaterThan(2);
        expect(renderSpy.calls.mostRecent().args[4]).toBe(0);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(2);

        indexSubject$.next(1);

        expect(renderSpy.calls.count()).toBeGreaterThan(callCount);
        callCount = renderSpy.calls.count();

        expect(renderSpy.calls.mostRecent().args[4]).toBe(1);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(2);

        changingPositionChangedSubject$.next(false);
        changedSubject$.next(renderer);

        expect(renderSpy.calls.mostRecent().args[4]).toBe(1);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(2);

        const image3: Image = imageHelper.createImage();
        mockCreator.mockProperty(image3, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image3, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(image3, "id", imageKey3);
        mockCreator.mockProperty(image3, "sequenceId", sequenceKey1);
        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image3);

        expect(renderSpy.calls.mostRecent().args[4]).toBe(2);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(2);
    });

    it("should not move to key before  debounce time", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceImages$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheImage$).and.returnValue(new Subject<Image>());

        const moveToKeySpy: jasmine.Spy = <jasmine.Spy>navigatorMock.moveTo$;
        moveToKeySpy.and.returnValue(new Subject<Image>());

        const indexSubject$: Subject<number> = new Subject<number>();
        mockCreator.mockProperty(renderer, "index$", indexSubject$);

        const scheduler: VirtualTimeScheduler = new VirtualTimeScheduler();
        const component: SequenceComponent = new SequenceComponent(
            SequenceComponent.componentName,
            containerMock,
            navigatorMock,
            renderer,
            scheduler);

        component.activate();

        const sequenceKey1: string = "sequenceKey1";
        const imageKey1: string = "imageKey1";
        const imageKey2: string = "imageKey2";
        const imageKey3: string = "imageKey3";

        const image1: Image = imageHelper.createImage();
        mockCreator.mockProperty(image1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(image1, "id", imageKey2);
        mockCreator.mockProperty(image1, "sequenceId", sequenceKey1);

        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image1);
        sequenceSubject$.next(new Sequence({ id: sequenceKey1, image_ids: [imageKey1, imageKey2, imageKey3] }));
        indexSubject$.next(1);

        expect(moveToKeySpy.calls.count()).toBe(0);

        scheduler.maxFrames = 99;
        scheduler.flush();

        expect(moveToKeySpy.calls.count()).toBe(0);
    });

    it("should move to key on first index change after debounce time", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceImages$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheImage$).and.returnValue(new Subject<Image>());

        const moveToKeySpy: jasmine.Spy = <jasmine.Spy>navigatorMock.moveTo$;
        moveToKeySpy.and.returnValue(new Subject<Image>());

        const indexSubject$: Subject<number> = new Subject<number>();
        mockCreator.mockProperty(renderer, "index$", indexSubject$);

        const scheduler: VirtualTimeScheduler = new VirtualTimeScheduler();
        const component: SequenceComponent = new SequenceComponent(
            SequenceComponent.componentName,
            containerMock,
            navigatorMock,
            renderer,
            scheduler);

        component.activate();

        const sequenceKey1: string = "sequenceKey1";
        const imageKey1: string = "imageKey1";
        const imageKey2: string = "imageKey2";
        const imageKey3: string = "imageKey3";

        const image1: Image = imageHelper.createImage();
        mockCreator.mockProperty(image1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(image1, "id", imageKey2);
        mockCreator.mockProperty(image1, "sequenceId", sequenceKey1);

        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image1);
        sequenceSubject$.next(new Sequence({ id: sequenceKey1, image_ids: [imageKey1, imageKey2, imageKey3] }));
        indexSubject$.next(1);

        expect(moveToKeySpy.calls.count()).toBe(0);

        scheduler.maxFrames = 101;
        scheduler.flush();

        expect(moveToKeySpy.calls.count()).toBe(1);
        expect(moveToKeySpy.calls.argsFor(0)[0]).toBe(imageKey2);
    });

    it("should not move to same key if audit time expires", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceImages$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheImage$).and.returnValue(new Subject<Image>());

        const moveToKeySpy: jasmine.Spy = <jasmine.Spy>navigatorMock.moveTo$;
        moveToKeySpy.and.returnValue(new Subject<Image>());

        const indexSubject$: Subject<number> = new Subject<number>();
        mockCreator.mockProperty(renderer, "index$", indexSubject$);

        const scheduler: VirtualTimeScheduler = new VirtualTimeScheduler();
        const component: SequenceComponent = new SequenceComponent(
            SequenceComponent.componentName,
            containerMock,
            navigatorMock,
            renderer,
            scheduler);

        component.activate();

        const sequenceKey1: string = "sequenceKey1";
        const imageKey1: string = "imageKey1";
        const imageKey2: string = "imageKey2";
        const imageKey3: string = "imageKey3";

        const image1: Image = imageHelper.createImage();
        mockCreator.mockProperty(image1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(image1, "id", imageKey2);
        mockCreator.mockProperty(image1, "sequenceId", sequenceKey1);

        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image1);
        sequenceSubject$.next(new Sequence({ id: sequenceKey1, image_ids: [imageKey1, imageKey2, imageKey3] }));
        indexSubject$.next(1);

        expect(moveToKeySpy.calls.count()).toBe(0);

        scheduler.maxFrames = 401;
        scheduler.flush();

        expect(moveToKeySpy.calls.count()).toBe(1);
    });

    it("should move to key on second index change if debounce time is reached", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceImages$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheImage$).and.returnValue(new Subject<Image>());

        const moveToKeySpy: jasmine.Spy = <jasmine.Spy>navigatorMock.moveTo$;
        moveToKeySpy.and.returnValue(new Subject<Image>());

        const indexSubject$: Subject<number> = new Subject<number>();
        mockCreator.mockProperty(renderer, "index$", indexSubject$);

        const scheduler: VirtualTimeScheduler = new VirtualTimeScheduler();
        const component: SequenceComponent = new SequenceComponent(
            SequenceComponent.componentName,
            containerMock,
            navigatorMock,
            renderer,
            scheduler);

        component.activate();

        const sequenceKey1: string = "sequenceKey1";
        const imageKey1: string = "imageKey1";
        const imageKey2: string = "imageKey2";
        const imageKey3: string = "imageKey3";

        const image1: Image = imageHelper.createImage();
        mockCreator.mockProperty(image1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(image1, "id", imageKey2);
        mockCreator.mockProperty(image1, "sequenceId", sequenceKey1);

        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image1);
        sequenceSubject$.next(new Sequence({ id: sequenceKey1, image_ids: [imageKey1, imageKey2, imageKey3] }));
        indexSubject$.next(1);

        expect(moveToKeySpy.calls.count()).toBe(0);

        scheduler.maxFrames = 99;
        scheduler.flush();
        scheduler.frame = 99;

        indexSubject$.next(2);

        expect(moveToKeySpy.calls.count()).toBe(0);

        scheduler.maxFrames = 200;
        scheduler.flush();

        expect(moveToKeySpy.calls.count()).toBe(1);
        expect(moveToKeySpy.calls.mostRecent().args[0]).toBe(imageKey3);
    });

    it("should move to key after multiple index emits with less than 100 ms in between if 400 ms has passed", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceImages$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheImage$).and.returnValue(new Subject<Image>());

        const moveToKeySpy: jasmine.Spy = <jasmine.Spy>navigatorMock.moveTo$;
        moveToKeySpy.and.returnValue(new Subject<Image>());

        const indexSubject$: Subject<number> = new Subject<number>();
        mockCreator.mockProperty(renderer, "index$", indexSubject$);

        const scheduler: VirtualTimeScheduler = new VirtualTimeScheduler();
        const component: SequenceComponent = new SequenceComponent(
            SequenceComponent.componentName,
            containerMock,
            navigatorMock,
            renderer,
            scheduler);

        component.activate();

        const sequenceKey1: string = "sequenceKey1";
        const imageKey1: string = "imageKey1";
        const imageKey2: string = "imageKey2";
        const imageKey3: string = "imageKey3";

        const image1: Image = imageHelper.createImage();
        mockCreator.mockProperty(image1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(image1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(image1, "id", imageKey2);
        mockCreator.mockProperty(image1, "sequenceId", sequenceKey1);

        (<Subject<Image>>navigatorMock.stateService.currentImage$).next(image1);
        sequenceSubject$.next(new Sequence({ id: sequenceKey1, image_ids: [imageKey1, imageKey2, imageKey3] }));
        indexSubject$.next(1);

        expect(moveToKeySpy.calls.count()).toBe(0);

        scheduler.maxFrames = 90;
        scheduler.flush();
        scheduler.frame = 90;

        indexSubject$.next(0);
        expect(moveToKeySpy.calls.count()).toBe(0);

        scheduler.maxFrames = 180;
        scheduler.flush();
        scheduler.frame = 180;

        indexSubject$.next(1);
        expect(moveToKeySpy.calls.count()).toBe(0);

        scheduler.maxFrames = 270;
        scheduler.flush();
        scheduler.frame = 270;

        indexSubject$.next(0);
        expect(moveToKeySpy.calls.count()).toBe(0);

        scheduler.maxFrames = 360;
        scheduler.flush();
        scheduler.frame = 360;

        indexSubject$.next(2);
        expect(moveToKeySpy.calls.count()).toBe(0);

        scheduler.maxFrames = 450;
        scheduler.flush();
        scheduler.frame = 450;

        expect(moveToKeySpy.calls.count()).toBe(1);
        expect(moveToKeySpy.calls.mostRecent().args[0]).toBe(imageKey3);
    });
});
