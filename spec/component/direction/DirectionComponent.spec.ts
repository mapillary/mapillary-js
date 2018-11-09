import {throwError as observableThrowError, of as observableOf, Subject} from "rxjs";

import {
    DirectionComponent,
    DirectionDOMRenderer,
} from "../../../src/Component";
import {
    Node,
    NodeCache,
    Sequence,
} from "../../../src/Graph";
import {
    Container,
    Navigator,
} from "../../../src/Viewer";

import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";
import {NodeHelper} from "../../helper/NodeHelper.spec";

describe("DirectionComponent.ctor", () => {
    it("should be defined", () => {
        const directionComponent: DirectionComponent =
            new DirectionComponent(
                DirectionComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        expect(directionComponent).toBeDefined();
    });
});

describe("DirectionComponent.deactivate", () => {
    it("should deactivate properly", () => {
        const directionComponent: DirectionComponent =
            new DirectionComponent(
                DirectionComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        directionComponent.activate();
        directionComponent.deactivate();
    });
});

describe("DirectionComponent.activate", () => {
    it("should set edges when node spatial edges emits", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();
        const renderer: DirectionDOMRenderer = new DirectionDOMRenderer({}, { height: 1, width: 1 });
        const setEdgesSpy: jasmine.Spy = spyOn(renderer, "setEdges").and.stub();

        const directionComponent: DirectionComponent =
            new DirectionComponent(
                DirectionComponent.componentName,
                containerMock,
                navigatorMock,
                renderer);

        directionComponent.activate();

        const node: Node = new NodeHelper().createNode();
        node.initializeCache(new NodeCache());
        node.cacheSpatialEdges([]);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node);

        expect(setEdgesSpy.calls.count()).toBe(1);
        expect(setEdgesSpy.calls.argsFor(0)[1]).toBe(null);
    });

    it("should set edges when distinguishing sequence with cached sequence", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();
        const renderer: DirectionDOMRenderer = new DirectionDOMRenderer({ distinguishSequence: true }, { height: 1, width: 1 });
        const setEdgesSpy: jasmine.Spy = spyOn(renderer, "setEdges").and.stub();

        const directionComponent: DirectionComponent =
            new DirectionComponent(
                DirectionComponent.componentName,
                containerMock,
                navigatorMock,
                renderer);

        directionComponent.configure({ distinguishSequence: true });
        directionComponent.activate();

        const sequence: Sequence = new Sequence({ key: "skey", keys: [] });
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(observableOf<Sequence>(sequence));

        const node: Node = new NodeHelper().createNode();
        node.initializeCache(new NodeCache());
        node.cacheSpatialEdges([]);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node);

        expect(setEdgesSpy.calls.count()).toBe(1);
        expect(setEdgesSpy.calls.argsFor(0)[1]).toBe(sequence);
    });

    it("should set edges when distinguishing sequence with uncached sequence", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();
        const renderer: DirectionDOMRenderer = new DirectionDOMRenderer({ distinguishSequence: true }, { height: 1, width: 1 });
        const setEdgesSpy: jasmine.Spy = spyOn(renderer, "setEdges").and.stub();

        const directionComponent: DirectionComponent =
            new DirectionComponent(
                DirectionComponent.componentName,
                containerMock,
                navigatorMock,
                renderer);

        directionComponent.configure({ distinguishSequence: true });
        directionComponent.activate();

        const sequence: Sequence = new Sequence({ key: "skey", keys: [] });
        const cacheSequence$: Subject<Sequence> = new Subject<Sequence>();
        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(cacheSequence$);

        const node: Node = new NodeHelper().createNode();
        node.initializeCache(new NodeCache());
        node.cacheSpatialEdges([]);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node);

        cacheSequence$.next(sequence);
        cacheSequence$.complete();

        expect(setEdgesSpy.calls.count()).toBe(1);
        expect(setEdgesSpy.calls.argsFor(0)[1]).toBe(sequence);
    });

    it("should set edges when distinguishing sequence and cache sequence throws", () => {
        spyOn(console, "error").and.stub();

        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();
        const renderer: DirectionDOMRenderer = new DirectionDOMRenderer({ distinguishSequence: true }, { height: 1, width: 1 });
        const setEdgesSpy: jasmine.Spy = spyOn(renderer, "setEdges").and.stub();

        const directionComponent: DirectionComponent =
            new DirectionComponent(
                DirectionComponent.componentName,
                containerMock,
                navigatorMock,
                renderer);

        directionComponent.configure({ distinguishSequence: true });
        directionComponent.activate();

        (<jasmine.Spy>navigatorMock.graphService.cacheSequence$).and.returnValue(observableThrowError(new Error("Failed to cache seq.")));

        const node: Node = new NodeHelper().createNode();
        node.initializeCache(new NodeCache());
        node.cacheSpatialEdges([]);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node);

        expect(setEdgesSpy.calls.count()).toBe(1);
        expect(setEdgesSpy.calls.argsFor(0)[1]).toBe(null);
    });
});
