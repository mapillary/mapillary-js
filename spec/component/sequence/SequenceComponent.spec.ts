/// <reference path="../../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

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

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        mockCreator.mockProperty(renderer, "changingPosition", true);

        const component: SequenceComponent = createComponent();
        component.activate();

        changedSubject$.next(renderer);

        expect(setGraphModeSpy.calls.count()).toBe(1);
        expect(setGraphModeSpy.calls.argsFor(0)[0]).toBe(GraphMode.Sequence);
    });

    it("should set graph mode to spatial when not changing position", () => {
        const setGraphModeSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.graphService.setGraphMode;

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        mockCreator.mockProperty(renderer, "changingPosition", false);

        const component: SequenceComponent = createComponent();
        component.activate();

        changedSubject$.next(renderer);

        expect(setGraphModeSpy.calls.count()).toBe(1);
        expect(setGraphModeSpy.calls.argsFor(0)[0]).toBe(GraphMode.Spatial);
    });

    it("should stop play when changing position", () => {
        const stopSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.playService.stop;

        const changedSubject$: Subject<SequenceDOMRenderer> = new Subject<SequenceDOMRenderer>();
        mockCreator.mockProperty(renderer, "changed$", changedSubject$);
        mockCreator.mockProperty(renderer, "changingPosition", true);

        const component: SequenceComponent = createComponent();
        component.activate();

        const count: number = stopSpy.calls.count();

        changedSubject$.next(renderer);

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
        mockCreator.mockProperty(renderer, "changingPosition", true);

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

        changedSubject$.next(renderer);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(1);
        expect(cacheSequenceNodesSpy.calls.argsFor(0)[0]).toBe("sequenceKey1");
        expect(cacheSequenceNodesSpy.calls.argsFor(0)[1]).toBe("nodeKey1");

        changedSubject$.next(renderer);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(1);

        (<boolean>renderer.changingPosition) = false;
        changedSubject$.next(renderer);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(1);

        graphModeSubject$.next(GraphMode.Spatial);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(1);

        graphModeSubject$.next(GraphMode.Sequence);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(1);

        (<boolean>renderer.changingPosition) = true;
        changedSubject$.next(renderer);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(2);
        expect(cacheSequenceNodesSpy.calls.argsFor(1)[0]).toBe("sequenceKey1");
        expect(cacheSequenceNodesSpy.calls.argsFor(1)[1]).toBe("nodeKey1");
    });
});
