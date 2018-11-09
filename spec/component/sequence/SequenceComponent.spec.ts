
import {of as observableOf, Observable, ReplaySubject, Subject, VirtualTimeScheduler} from "rxjs";

import {
    SequenceComponent,
    SequenceDOMRenderer,
} from "../../../src/Component";
import {
    GraphMode,
    IEdgeStatus,
    Node,
    Sequence,
} from "../../../src/Graph";
import {ISize} from "../../../src/Render";
import {
    Container,
    Navigator,
} from "../../../src/Viewer";

import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {MockCreator} from "../../helper/MockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";
import {NodeHelper} from "../../helper/NodeHelper.spec";

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
    let nodeHelper: NodeHelper;

    let renderer: SequenceDOMRenderer;

    beforeEach((): void => {
        mockCreator = new MockCreator();
        containerMock = new ContainerMockCreator().create();
        navigatorMock = new NavigatorMockCreator().create();
        nodeHelper = new NodeHelper();

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

    it("should cache two nodes when graph mode changes to spatial if not spatial edges cached", () => {
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceNodes$).and.returnValue(new Subject<Sequence>());

        const cacheNodeSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.graphService.cacheNode$;
        cacheNodeSpy.and.returnValue(new Subject<Node>());

        const component: SequenceComponent = createComponent();
        component.activate();

        const graphModeSubject$: Subject<GraphMode> = <Subject<GraphMode>>navigatorMock.graphService.graphMode$;
        graphModeSubject$.next(GraphMode.Spatial);

        const node1: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node1, "sequenceEdges$", new Subject<IEdgeStatus>());
        mockCreator.mockProperty(node1, "key", "nodeKey1");
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node1);

        expect(cacheNodeSpy.calls.count()).toBe(1);
        expect(cacheNodeSpy.calls.argsFor(0)[0]).toBe(node1.key);

        const node2: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node2, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node2, "sequenceEdges$", new Subject<IEdgeStatus>());
        mockCreator.mockProperty(node2, "key", "nodeKey2");
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node2);

        expect(cacheNodeSpy.calls.count()).toBe(2);
        expect(cacheNodeSpy.calls.argsFor(1)[0]).toBe(node2.key);

        const node3: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node3, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node3, "sequenceEdges$", new Subject<IEdgeStatus>());
        mockCreator.mockProperty(node3, "key", "nodeKey2");
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node3);

        expect(cacheNodeSpy.calls.count()).toBe(2);
    });

    it("should cache sequence when sequence key of current node changes", () => {
        const cacheSequenceSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.graphService.cacheSequence$;
        cacheSequenceSpy.and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceNodes$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheNode$).and.returnValue(new Subject<Node>());

        const component: SequenceComponent = createComponent();
        component.activate();

        const graphModeSubject$: Subject<GraphMode> = <Subject<GraphMode>>navigatorMock.graphService.graphMode$;
        graphModeSubject$.next(GraphMode.Spatial);

        const node1: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node1, "sequenceEdges$", new Subject<IEdgeStatus>());
        mockCreator.mockProperty(node1, "key", "nodeKey1");
        mockCreator.mockProperty(node1, "sequenceKey", "sequenceKey1");
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node1);

        expect(cacheSequenceSpy.calls.count()).toBe(1);
        expect(cacheSequenceSpy.calls.argsFor(0)[0]).toBe("sequenceKey1");

        const node2: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node2, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node2, "sequenceEdges$", new Subject<IEdgeStatus>());
        mockCreator.mockProperty(node2, "key", "nodeKey2");
        mockCreator.mockProperty(node2, "sequenceKey", "sequenceKey1");
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node2);

        expect(cacheSequenceSpy.calls.count()).toBe(1);

        const node3: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node3, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node3, "sequenceEdges$", new Subject<IEdgeStatus>());
        mockCreator.mockProperty(node3, "key", "nodeKey3");
        mockCreator.mockProperty(node3, "sequenceKey", "sequenceKey2");
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node3);

        expect(cacheSequenceSpy.calls.count()).toBe(2);
        expect(cacheSequenceSpy.calls.argsFor(1)[0]).toBe("sequenceKey2");
    });

    it("should cache sequence nodes when changing and in sequence graph mode", () => {
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(new Subject<Sequence>());
        const cacheSequenceNodesSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.graphService.cacheSequenceNodes$;
        cacheSequenceNodesSpy.and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheNode$).and.returnValue(new Subject<Node>());

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        const changingPositionChangedSubject$: Subject<boolean> = new Subject<boolean>();
        mockCreator.mockProperty(renderer, "changingPositionChanged$", changingPositionChangedSubject$);

        const component: SequenceComponent = createComponent();
        component.activate();

        const node1: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node1, "sequenceEdges$", new Subject<IEdgeStatus>());
        mockCreator.mockProperty(node1, "key", "nodeKey1");
        mockCreator.mockProperty(node1, "sequenceKey", "sequenceKey1");
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node1);

        const graphModeSubject$: Subject<GraphMode> = <Subject<GraphMode>>navigatorMock.graphService.graphMode$;
        graphModeSubject$.next(GraphMode.Sequence);

        changingPositionChangedSubject$.next(true);
        changedSubject$.next(renderer);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(1);
        expect(cacheSequenceNodesSpy.calls.argsFor(0)[0]).toBe("sequenceKey1");
        expect(cacheSequenceNodesSpy.calls.argsFor(0)[1]).toBe("nodeKey1");

        changedSubject$.next(renderer);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(1);

        changingPositionChangedSubject$.next(false);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(1);

        graphModeSubject$.next(GraphMode.Spatial);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(1);

        graphModeSubject$.next(GraphMode.Sequence);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(1);

        changingPositionChangedSubject$.next(true);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(2);
        expect(cacheSequenceNodesSpy.calls.argsFor(1)[0]).toBe("sequenceKey1");
        expect(cacheSequenceNodesSpy.calls.argsFor(1)[1]).toBe("nodeKey1");
    });

    it("should render null index and null max when sequence is not cached", () => {
        const cacheSequenceSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.graphService.cacheSequence$;
        cacheSequenceSpy.and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceNodes$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheNode$).and.returnValue(new Subject<Node>());

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        spyOn(renderer, "getContainerWidth").and.returnValue(100);

        const renderSpy: jasmine.Spy = spyOn(renderer, "render").and.stub();

        const component: SequenceComponent = createComponent();
        component.activate();

        (<Subject<number>>navigatorMock.playService.speed$).next(1);
        (<Subject<ISize>>containerMock.renderService.size$).next({ height: 1, width: 1 });

        const node1: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(node1, "key", "nodeKey1");
        mockCreator.mockProperty(node1, "sequenceKey", "sequenceKey1");
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node1);

        expect(renderSpy.calls.count()).toBe(1);
        expect(renderSpy.calls.argsFor(0)[4]).toBe(null);
        expect(renderSpy.calls.argsFor(0)[5]).toBe(null);
    });

    it("should render 0 index and 0 max when sequence is cached with single node", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceNodes$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheNode$).and.returnValue(new Subject<Node>());

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        spyOn(renderer, "getContainerWidth").and.returnValue(100);

        const renderSpy: jasmine.Spy = spyOn(renderer, "render").and.stub();

        (<Subject<Node>>navigatorMock.stateService.currentNode$) = new ReplaySubject<Node>(1);

        const component: SequenceComponent = createComponent();
        component.activate();

        (<Subject<number>>navigatorMock.playService.speed$).next(1);
        (<Subject<ISize>>containerMock.renderService.size$).next({ height: 1, width: 1 });

        const sequenceKey1: string = "sequenceKey1";
        const nodeKey1: string = "nodeKey1";

        const node1: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(node1, "key", nodeKey1);
        mockCreator.mockProperty(node1, "sequenceKey", sequenceKey1);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node1);

        expect(renderSpy.calls.count()).toBe(1);

        sequenceSubject$.next(new Sequence({ key: sequenceKey1, keys: [nodeKey1] }));

        expect(renderSpy.calls.count()).toBe(2);
        expect(renderSpy.calls.argsFor(1)[4]).toBe(0);
        expect(renderSpy.calls.argsFor(1)[5]).toBe(0);
    });

    it("should render correct index on new node emit", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceNodes$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheNode$).and.returnValue(new Subject<Node>());

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        spyOn(renderer, "getContainerWidth").and.returnValue(100);

        const renderSpy: jasmine.Spy = spyOn(renderer, "render").and.stub();

        (<Subject<Node>>navigatorMock.stateService.currentNode$) = new ReplaySubject<Node>(1);

        const component: SequenceComponent = createComponent();
        component.activate();

        (<Subject<number>>navigatorMock.playService.speed$).next(1);
        (<Subject<ISize>>containerMock.renderService.size$).next({ height: 1, width: 1 });

        const sequenceKey1: string = "sequenceKey1";
        const nodeKey1: string = "nodeKey1";
        const nodeKey2: string = "nodeKey2";

        const node1: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(node1, "key", nodeKey1);
        mockCreator.mockProperty(node1, "sequenceKey", sequenceKey1);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node1);

        expect(renderSpy.calls.count()).toBe(1);

        sequenceSubject$.next(new Sequence({ key: sequenceKey1, keys: [nodeKey1, nodeKey2] }));

        expect(renderSpy.calls.count()).toBe(2);
        expect(renderSpy.calls.argsFor(1)[4]).toBe(0);
        expect(renderSpy.calls.argsFor(1)[5]).toBe(1);

        const node2: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node2, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node2, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(node2, "key", nodeKey2);
        mockCreator.mockProperty(node2, "sequenceKey", sequenceKey1);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node2);

        expect(renderSpy.calls.count()).toBe(4);
        expect(renderSpy.calls.mostRecent().args[4]).toBe(1);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(1);
    });

    it("should render correct index on sequence change when changing position simultaneously", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceNodes$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheNode$).and.returnValue(new Subject<Node>());

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        const changingPositionChangedSubject$: Subject<boolean> = new Subject<boolean>();
        mockCreator.mockProperty(renderer, "changingPositionChanged$", changingPositionChangedSubject$);
        spyOn(renderer, "getContainerWidth").and.returnValue(100);

        const renderSpy: jasmine.Spy = spyOn(renderer, "render").and.stub();

        (<Subject<Node>>navigatorMock.stateService.currentNode$) = new ReplaySubject<Node>(1);

        const component: SequenceComponent = createComponent();
        component.activate();

        (<Subject<number>>navigatorMock.playService.speed$).next(1);
        (<Subject<ISize>>containerMock.renderService.size$).next({ height: 1, width: 1 });

        const sequenceKey1: string = "sequenceKey1";
        const sequenceKey2: string = "sequenceKey2";
        const nodeKey1: string = "nodeKey1";
        const nodeKey2: string = "nodeKey2";

        const node1: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(node1, "key", nodeKey1);
        mockCreator.mockProperty(node1, "sequenceKey", sequenceKey1);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node1);

        expect(renderSpy.calls.count()).toBe(1);

        sequenceSubject$.next(new Sequence({ key: sequenceKey1, keys: [nodeKey1] }));

        expect(renderSpy.calls.count()).toBe(2);
        expect(renderSpy.calls.mostRecent().args[4]).toBe(0);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(0);

        changingPositionChangedSubject$.next(true);

        const node2: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node2, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node2, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(node2, "key", nodeKey2);
        mockCreator.mockProperty(node2, "sequenceKey", sequenceKey2);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node2);

        changingPositionChangedSubject$.next(false);

        sequenceSubject$.next(new Sequence({ key: sequenceKey2, keys: [nodeKey2] }));

        expect(renderSpy.calls.count()).toBeGreaterThan(2);
        expect(renderSpy.calls.mostRecent().args[4]).toBe(0);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(0);

    });

    it("should render correct index on input emit", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceNodes$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheNode$).and.returnValue(new Subject<Node>());

        (<jasmine.Spy>navigatorMock.moveToKey$).and.returnValue(new Subject<Node>());

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        const indexSubject$: Subject<number> = new Subject<number>();
        mockCreator.mockProperty(renderer, "index$", indexSubject$);
        const changingPositionChangedSubject$: Subject<boolean> = new Subject<boolean>();
        mockCreator.mockProperty(renderer, "changingPositionChanged$", changingPositionChangedSubject$);
        spyOn(renderer, "getContainerWidth").and.returnValue(100);

        const renderSpy: jasmine.Spy = spyOn(renderer, "render").and.stub();

        (<Subject<Node>>navigatorMock.stateService.currentNode$) = new ReplaySubject<Node>(1);

        const component: SequenceComponent = createComponent();
        component.activate();

        (<Subject<number>>navigatorMock.playService.speed$).next(1);
        (<Subject<ISize>>containerMock.renderService.size$).next({ height: 1, width: 1 });

        const sequenceKey1: string = "sequenceKey1";
        const nodeKey1: string = "nodeKey1";
        const nodeKey2: string = "nodeKey2";
        const nodeKey3: string = "nodeKey3";

        const node1: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(node1, "key", nodeKey2);
        mockCreator.mockProperty(node1, "sequenceKey", sequenceKey1);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node1);

        expect(renderSpy.calls.count()).toBe(1);

        sequenceSubject$.next(new Sequence({ key: sequenceKey1, keys: [nodeKey1, nodeKey2, nodeKey3] }));
        changingPositionChangedSubject$.next(true);
        indexSubject$.next(0);

        expect(renderSpy.calls.count()).toBeGreaterThan(1);
        expect(renderSpy.calls.mostRecent().args[4]).toBe(0);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(2);
    });

    it("should render on first node emit after sequence change and on second thereafter", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceNodes$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheNode$).and.returnValue(new Subject<Node>());

        (<jasmine.Spy>navigatorMock.moveToKey$).and.returnValue(new Subject<Node>());

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        const indexSubject$: Subject<number> = new Subject<number>();
        mockCreator.mockProperty(renderer, "index$", indexSubject$);
        const changingPositionChangedSubject$: Subject<boolean> = new Subject<boolean>();
        mockCreator.mockProperty(renderer, "changingPositionChanged$", changingPositionChangedSubject$);
        spyOn(renderer, "getContainerWidth").and.returnValue(100);

        const renderSpy: jasmine.Spy = spyOn(renderer, "render").and.stub();

        (<Subject<Node>>navigatorMock.stateService.currentNode$) = new ReplaySubject<Node>(1);

        const component: SequenceComponent = createComponent();
        component.activate();

        (<Subject<number>>navigatorMock.playService.speed$).next(1);
        (<Subject<ISize>>containerMock.renderService.size$).next({ height: 1, width: 1 });

        const sequenceKey1: string = "sequenceKey1";
        const nodeKey1: string = "nodeKey1";
        const nodeKey2: string = "nodeKey2";
        const nodeKey3: string = "nodeKey3";

        const node1: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(node1, "key", nodeKey1);
        mockCreator.mockProperty(node1, "sequenceKey", sequenceKey1);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node1);

        expect(renderSpy.calls.count()).toBe(1);
        expect(renderSpy.calls.mostRecent().args[4]).toBe(null);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(null);

        sequenceSubject$.next(new Sequence({ key: sequenceKey1, keys: [nodeKey1, nodeKey2, nodeKey3] }));

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

        const node3: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node3, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node3, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(node3, "key", nodeKey3);
        mockCreator.mockProperty(node3, "sequenceKey", sequenceKey1);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node3);

        expect(renderSpy.calls.mostRecent().args[4]).toBe(2);
        expect(renderSpy.calls.mostRecent().args[5]).toBe(2);
    });

    it("should not move to key before  debounce time", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceNodes$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheNode$).and.returnValue(new Subject<Node>());

        const moveToKeySpy: jasmine.Spy = <jasmine.Spy>navigatorMock.moveToKey$;
        moveToKeySpy.and.returnValue(new Subject<Node>());

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
        const nodeKey1: string = "nodeKey1";
        const nodeKey2: string = "nodeKey2";
        const nodeKey3: string = "nodeKey3";

        const node1: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(node1, "key", nodeKey2);
        mockCreator.mockProperty(node1, "sequenceKey", sequenceKey1);

        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node1);
        sequenceSubject$.next(new Sequence({ key: sequenceKey1, keys: [nodeKey1, nodeKey2, nodeKey3] }));
        indexSubject$.next(1);

        expect(moveToKeySpy.calls.count()).toBe(0);

        scheduler.maxFrames = 99;
        scheduler.flush();

        expect(moveToKeySpy.calls.count()).toBe(0);
    });

    it("should move to key on first index change after debounce time", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceNodes$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheNode$).and.returnValue(new Subject<Node>());

        const moveToKeySpy: jasmine.Spy = <jasmine.Spy>navigatorMock.moveToKey$;
        moveToKeySpy.and.returnValue(new Subject<Node>());

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
        const nodeKey1: string = "nodeKey1";
        const nodeKey2: string = "nodeKey2";
        const nodeKey3: string = "nodeKey3";

        const node1: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(node1, "key", nodeKey2);
        mockCreator.mockProperty(node1, "sequenceKey", sequenceKey1);

        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node1);
        sequenceSubject$.next(new Sequence({ key: sequenceKey1, keys: [nodeKey1, nodeKey2, nodeKey3] }));
        indexSubject$.next(1);

        expect(moveToKeySpy.calls.count()).toBe(0);

        scheduler.maxFrames = 101;
        scheduler.flush();

        expect(moveToKeySpy.calls.count()).toBe(1);
        expect(moveToKeySpy.calls.argsFor(0)[0]).toBe(nodeKey2);
    });

    it("should not move to same key if audit time expires", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceNodes$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheNode$).and.returnValue(new Subject<Node>());

        const moveToKeySpy: jasmine.Spy = <jasmine.Spy>navigatorMock.moveToKey$;
        moveToKeySpy.and.returnValue(new Subject<Node>());

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
        const nodeKey1: string = "nodeKey1";
        const nodeKey2: string = "nodeKey2";
        const nodeKey3: string = "nodeKey3";

        const node1: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(node1, "key", nodeKey2);
        mockCreator.mockProperty(node1, "sequenceKey", sequenceKey1);

        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node1);
        sequenceSubject$.next(new Sequence({ key: sequenceKey1, keys: [nodeKey1, nodeKey2, nodeKey3] }));
        indexSubject$.next(1);

        expect(moveToKeySpy.calls.count()).toBe(0);

        scheduler.maxFrames = 401;
        scheduler.flush();

        expect(moveToKeySpy.calls.count()).toBe(1);
    });

    it("should move to key on second index change if debounce time is reached", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceNodes$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheNode$).and.returnValue(new Subject<Node>());

        const moveToKeySpy: jasmine.Spy = <jasmine.Spy>navigatorMock.moveToKey$;
        moveToKeySpy.and.returnValue(new Subject<Node>());

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
        const nodeKey1: string = "nodeKey1";
        const nodeKey2: string = "nodeKey2";
        const nodeKey3: string = "nodeKey3";

        const node1: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(node1, "key", nodeKey2);
        mockCreator.mockProperty(node1, "sequenceKey", sequenceKey1);

        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node1);
        sequenceSubject$.next(new Sequence({ key: sequenceKey1, keys: [nodeKey1, nodeKey2, nodeKey3] }));
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
        expect(moveToKeySpy.calls.mostRecent().args[0]).toBe(nodeKey3);
    });

    it("should move to key after multiple index emits with less than 100 ms in between if 400 ms has passed", () => {
        const sequenceSubject$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(sequenceSubject$);
        (<jasmine.Spy>navigatorMock.graphService.cacheSequenceNodes$).and.returnValue(new Subject<Sequence>());
        (<jasmine.Spy>navigatorMock.graphService.cacheNode$).and.returnValue(new Subject<Node>());

        const moveToKeySpy: jasmine.Spy = <jasmine.Spy>navigatorMock.moveToKey$;
        moveToKeySpy.and.returnValue(new Subject<Node>());

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
        const nodeKey1: string = "nodeKey1";
        const nodeKey2: string = "nodeKey2";
        const nodeKey3: string = "nodeKey3";

        const node1: Node = nodeHelper.createNode();
        mockCreator.mockProperty(node1, "spatialEdges", { cached: false, edges: [] });
        mockCreator.mockProperty(node1, "sequenceEdges$", observableOf({ cached: false, edges: [] }));
        mockCreator.mockProperty(node1, "key", nodeKey2);
        mockCreator.mockProperty(node1, "sequenceKey", sequenceKey1);

        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node1);
        sequenceSubject$.next(new Sequence({ key: sequenceKey1, keys: [nodeKey1, nodeKey2, nodeKey3] }));
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
        expect(moveToKeySpy.calls.mostRecent().args[0]).toBe(nodeKey3);
    });
});
