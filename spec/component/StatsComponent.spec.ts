import {
    BehaviorSubject,
    Subject,
    VirtualTimeScheduler,
} from "rxjs";

import {ContainerMockCreator} from "../helper/ContainerMockCreator.spec";
import {MockCreator} from "../helper/MockCreator.spec";
import {NavigatorMockCreator} from "../helper/NavigatorMockCreator.spec";
import {NodeHelper} from "../helper/NodeHelper.spec";

import {StatsComponent} from "../../src/Component";
import {Node} from "../../src/Graph";
import {
    Container,
    Navigator,
} from "../../src/Viewer";
import { Observable } from "falcor";

describe("StatsComponent", () => {
    it("should be defined", () => {
        let mockCreator: MockCreator = new MockCreator();
        let containerMock: Container = mockCreator.create(Container, "Container");
        let navigatorMock: Navigator = mockCreator.create(Navigator, "Navigator");

        let statsComponent: StatsComponent =
            new StatsComponent(
                StatsComponent.componentName,
                containerMock,
                navigatorMock);

        expect(statsComponent).toBeDefined();
    });
});

describe("StatsComponent.activate", () => {
    it("should activate properly", () => {
        let mockCreator: MockCreator = new MockCreator();
        let containerMock: Container = mockCreator.create(Container, "Container");
        let navigatorMockCreator: NavigatorMockCreator = new NavigatorMockCreator();
        let navigatorMock: Navigator = navigatorMockCreator.create();

        let statsComponent: StatsComponent =
            new StatsComponent(
                StatsComponent.componentName,
                containerMock,
                navigatorMock);

        statsComponent.activate();
    });

    it("should send sequence stats for current node", () => {
        let containerMockCreator: ContainerMockCreator = new ContainerMockCreator();
        let containerMock: Container = containerMockCreator.create();
        let navigatorMockCreator: NavigatorMockCreator = new NavigatorMockCreator();
        let navigatorMock: Navigator = navigatorMockCreator.create();

        let statsComponent: StatsComponent =
            new StatsComponent(
                StatsComponent.componentName,
                containerMock,
                navigatorMock);

        statsComponent.activate();

        let sequenceViewAdd$: Subject<void> = new Subject<void>();
        let sequenceViewAddSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.apiV3.sequenceViewAdd$;
        sequenceViewAddSpy.and.returnValue(sequenceViewAdd$);

        let currentNode$: Subject<Node> = <any>navigatorMock.stateService.currentNode$;

        let nodeHelper: NodeHelper = new NodeHelper();
        let node: Node = nodeHelper.createNode();

        currentNode$.next(node);

        sequenceViewAdd$.next(null);

        expect(sequenceViewAddSpy.calls.count()).toBe(1);
        expect(sequenceViewAddSpy.calls.first().args.length).toBe(1);
        expect(sequenceViewAddSpy.calls.first().args[0].length).toBe(1);
        expect(sequenceViewAddSpy.calls.first().args[0][0]).toBe(node.sequenceKey);

        statsComponent.deactivate();
    });

    it("should only send the same sequence key once", () => {
        let containerMockCreator: ContainerMockCreator = new ContainerMockCreator();
        let containerMock: Container = containerMockCreator.create();
        let navigatorMockCreator: NavigatorMockCreator = new NavigatorMockCreator();
        let navigatorMock: Navigator = navigatorMockCreator.create();

        let statsComponent: StatsComponent =
            new StatsComponent(
                StatsComponent.componentName,
                containerMock,
                navigatorMock);

        statsComponent.activate();

        let sequenceViewAdd$: Subject<void> = new Subject<void>();
        let sequenceViewAddSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.apiV3.sequenceViewAdd$;
        sequenceViewAddSpy.and.returnValue(sequenceViewAdd$);

        let currentNode$: Subject<Node> = <any>navigatorMock.stateService.currentNode$;

        let nodeHelper: NodeHelper = new NodeHelper();
        let node: Node = nodeHelper.createNode();

        currentNode$.next(node);

        sequenceViewAdd$.next(null);

        currentNode$.next(node);

        expect(sequenceViewAddSpy.calls.count()).toBe(1);

        statsComponent.deactivate();
    });

    it("should send node stats for current node", () => {
        let containerMockCreator: ContainerMockCreator = new ContainerMockCreator();
        let containerMock: Container = containerMockCreator.create();
        let navigatorMockCreator: NavigatorMockCreator = new NavigatorMockCreator();
        let navigatorMock: Navigator = navigatorMockCreator.create();

        const scheduler: VirtualTimeScheduler = new VirtualTimeScheduler();
        let statsComponent: StatsComponent =
            new StatsComponent(
                StatsComponent.componentName,
                containerMock,
                navigatorMock,
                scheduler);

        let sequenceViewAdd$: Subject<void> = new Subject<void>();
        let sequenceViewAddSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.apiV3.sequenceViewAdd$;
        sequenceViewAddSpy.and.returnValue(sequenceViewAdd$);

        let imageViewAdd$: Subject<void> = new Subject<void>();
        let imageViewAddSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.apiV3.imageViewAdd$;
        imageViewAddSpy.and.returnValue(imageViewAdd$);

        let currentNode$: Subject<Node> = <any>navigatorMock.stateService.currentNode$;

        statsComponent.activate();

        let nodeHelper: NodeHelper = new NodeHelper();
        let node: Node = nodeHelper.createNode();

        currentNode$.next(node);

        scheduler.maxFrames = 5001;
        scheduler.flush();

        imageViewAdd$.next(null);

        expect(imageViewAddSpy.calls.count()).toBe(1);

        statsComponent.deactivate();
    });
});

describe("StatsComponent.deactivate", () => {
    it("should deactivate properly", () => {
        let containerMockCreator: ContainerMockCreator = new ContainerMockCreator();
        let containerMock: Container = containerMockCreator.create();
        let navigatorMockCreator: NavigatorMockCreator = new NavigatorMockCreator();
        let navigatorMock: Navigator = navigatorMockCreator.create();

        let statsComponent: StatsComponent =
            new StatsComponent(
                StatsComponent.componentName,
                containerMock,
                navigatorMock);

        statsComponent.activate();
        statsComponent.deactivate();
    });
});
