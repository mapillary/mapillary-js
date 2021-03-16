import { Subject } from "rxjs";

import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { EventHelper } from "../../helper/EventHelper";
import { MockCreator } from "../../helper/MockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";
import { NodeHelper } from "../../helper/NodeHelper";

import { Navigator } from "../../../src/viewer/Navigator";
import { Node } from "../../../src/graph/Node";
import { Component } from "../../../src/component/Component";
import { ComponentConfiguration } from "../../../src/component/interfaces/ComponentConfiguration";
import { KeyPlayHandler } from "../../../src/component/keyboard/KeyPlayHandler";
import { NavigationEdgeStatus } from "../../../src/graph/interfaces/NavigationEdgeStatus";
import { State } from "../../../src/state/State";
import { Container } from "../../../src/viewer/Container";
import { NavigationDirection } from "../../../src/graph/edge/NavigationDirection";

interface TestConfiguration extends ComponentConfiguration {
    test: boolean;
}

class TestComponent extends Component<TestConfiguration> {
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }
    protected _activate(): void { /* noop */ }
    protected _deactivate(): void { /* noop */ }
    protected _getDefaultConfiguration(): TestConfiguration { return { test: false }; }
}

describe("KeyPlayHandler.ctor", () => {
    it("should be defined", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const handler: KeyPlayHandler = new KeyPlayHandler(
            new TestComponent("test", containerMock, navigatorMock),
            containerMock,
            navigatorMock);

        expect(handler).toBeDefined();
    });
});

describe("KeyPlayHandler.disable", () => {
    it("should disable correctly", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const testComponent: TestComponent = new TestComponent("test", containerMock, navigatorMock);
        const handler: KeyPlayHandler = new KeyPlayHandler(
            testComponent,
            containerMock,
            navigatorMock);

        testComponent.activate();
        handler.enable();

        expect(handler.isEnabled).toBe(true);

        handler.disable();

        expect(handler.isEnabled).toBe(false);
    });
});

describe("KeyPlayHandler.enable", () => {
    let nodeHelper: NodeHelper;

    let containerMock: Container;
    let navigatorMock: Navigator;
    let testComponent: TestComponent;

    let handler: KeyPlayHandler;

    beforeEach(() => {
        nodeHelper = new NodeHelper();

        containerMock = new ContainerMockCreator().create();
        navigatorMock = new NavigatorMockCreator().create();
        testComponent = new TestComponent("test", containerMock, navigatorMock);

        handler = new KeyPlayHandler(
            testComponent,
            containerMock,
            navigatorMock);

        testComponent.activate();
        handler.enable();
    });

    it("should not prevent default if modifier key is pressed", () => {
        (<Subject<boolean>>navigatorMock.playService.playing$).next(true);
        (<Subject<NavigationDirection>>navigatorMock.playService.direction$).next(NavigationDirection.Next);
        (<Subject<number>>navigatorMock.playService.speed$).next(0.5);
        (<Subject<State>>navigatorMock.stateService.state$).next(State.Traversing);

        const node: Node = nodeHelper.createNode();
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();
        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node);
        sequenceEdgesSubject.next({ cached: false, edges: [] });

        let keyboardEvent: KeyboardEvent = EventHelper.createKeyboardEvent("keyDown", { key: " ", ctrlKey: true });
        const preventDefaultSpyCtrl: jasmine.Spy = spyOn(keyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(keyboardEvent);
        expect(preventDefaultSpyCtrl.calls.count()).toBe(0);

        keyboardEvent = EventHelper.createKeyboardEvent("keyDown", { key: " ", altKey: true });
        const preventDefaultSpyAlt: jasmine.Spy = spyOn(keyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(keyboardEvent);
        expect(preventDefaultSpyAlt.calls.count()).toBe(0);

        keyboardEvent = EventHelper.createKeyboardEvent("keyDown", { key: " ", metaKey: true });
        const preventDefaultSpyMeta: jasmine.Spy = spyOn(keyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(keyboardEvent);
        expect(preventDefaultSpyMeta.calls.count()).toBe(0);

        keyboardEvent = EventHelper.createKeyboardEvent("keyDown", { key: " ", shiftKey: true });
        const preventDefaultSpyShift: jasmine.Spy = spyOn(keyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(keyboardEvent);
        expect(preventDefaultSpyShift.calls.count()).toBe(0);

        keyboardEvent = EventHelper.createKeyboardEvent("keyDown", { key: " " });
        const preventDefaultSpy: jasmine.Spy = spyOn(keyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(keyboardEvent);
        expect(preventDefaultSpy.calls.count()).toBe(1);
    });

    it("should change speed if `>` or `<` is pressed", () => {
        (<Subject<boolean>>navigatorMock.playService.playing$).next(true);
        (<Subject<NavigationDirection>>navigatorMock.playService.direction$).next(NavigationDirection.Next);
        (<Subject<number>>navigatorMock.playService.speed$).next(0.5);
        (<Subject<State>>navigatorMock.stateService.state$).next(State.Traversing);

        const node: Node = nodeHelper.createNode();
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();
        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node);
        sequenceEdgesSubject.next({ cached: false, edges: [] });

        const setSpeedSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.playService.setSpeed;

        const increaseKeyboardEvent: KeyboardEvent = EventHelper.createKeyboardEvent("keyDown", { key: ">" });
        const increasePreventDefaultSpy: jasmine.Spy = spyOn(increaseKeyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(increaseKeyboardEvent);

        expect(increasePreventDefaultSpy.calls.count()).toBe(1);

        expect(setSpeedSpy.calls.count()).toBe(1);
        expect(setSpeedSpy.calls.argsFor(0)[0]).toBeGreaterThan(0.5);

        const decreaseKeyboardEvent: KeyboardEvent = EventHelper.createKeyboardEvent("keyDown", { key: "<" });
        const decreasePreventDefaultSpy: jasmine.Spy = spyOn(decreaseKeyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(decreaseKeyboardEvent);
        expect(decreasePreventDefaultSpy.calls.count()).toBe(1);

        expect(setSpeedSpy.calls.count()).toBe(2);
        expect(setSpeedSpy.calls.argsFor(1)[0]).toBeLessThan(0.5);
    });

    it("should change direction when not playing", () => {
        (<Subject<boolean>>navigatorMock.playService.playing$).next(true);
        (<Subject<NavigationDirection>>navigatorMock.playService.direction$).next(NavigationDirection.Next);
        (<Subject<number>>navigatorMock.playService.speed$).next(0.5);
        (<Subject<State>>navigatorMock.stateService.state$).next(State.Traversing);

        const node: Node = nodeHelper.createNode();
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();
        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node);
        sequenceEdgesSubject.next({ cached: false, edges: [] });

        const setDirectionSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.playService.setDirection;

        const shiftKeyboardEvent: KeyboardEvent = EventHelper.createKeyboardEvent("keyDown", { key: "D", shiftKey: true });
        const shiftPreventDefaultSpy: jasmine.Spy = spyOn(shiftKeyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(shiftKeyboardEvent);
        expect(shiftPreventDefaultSpy.calls.count()).toBe(1);
        expect(setDirectionSpy.calls.count()).toBe(0);

        (<Subject<boolean>>navigatorMock.playService.playing$).next(false);
        (<Subject<NavigationDirection>>navigatorMock.playService.direction$).next(NavigationDirection.Next);
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(shiftKeyboardEvent);
        expect(shiftPreventDefaultSpy.calls.count()).toBe(2);
        expect(setDirectionSpy.calls.count()).toBe(1);
        expect(setDirectionSpy.calls.argsFor(0)[0]).toBe(NavigationDirection.Prev);

        (<Subject<boolean>>navigatorMock.playService.playing$).next(false);
        (<Subject<NavigationDirection>>navigatorMock.playService.direction$).next(NavigationDirection.Prev);
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(shiftKeyboardEvent);
        expect(shiftPreventDefaultSpy.calls.count()).toBe(3);
        expect(setDirectionSpy.calls.count()).toBe(2);
        expect(setDirectionSpy.calls.argsFor(1)[0]).toBe(NavigationDirection.Next);
    });

    it("should play when stopped edge direction exist and stop when playing", () => {
        const playSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.playService.play;
        const stopSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.playService.stop;
        (<Subject<State>>navigatorMock.stateService.state$).next(State.Traversing);

        const node: Node = nodeHelper.createNode();
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();
        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node);
        sequenceEdgesSubject.next({ cached: false, edges: [] });

        (<Subject<boolean>>navigatorMock.playService.playing$).next(false);
        (<Subject<NavigationDirection>>navigatorMock.playService.direction$).next(NavigationDirection.Next);
        (<Subject<number>>navigatorMock.playService.speed$).next(0.5);

        const spacebarKeyboardEvent: KeyboardEvent = EventHelper.createKeyboardEvent("keyDown", { key: " " });
        const spacebarPreventDefaultSpy: jasmine.Spy = spyOn(spacebarKeyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(spacebarKeyboardEvent);
        expect(spacebarPreventDefaultSpy.calls.count()).toBe(1);
        expect(playSpy.calls.count()).toBe(0);
        expect(stopSpy.calls.count()).toBe(0);

        (<Subject<NavigationDirection>>navigatorMock.playService.direction$).next(NavigationDirection.Next);
        sequenceEdgesSubject.next({
            cached: true,
            edges: [{
                data: { direction: NavigationDirection.Next, worldMotionAzimuth: 0 },
                source: node.key,
                target: "toKey",
            }],
        });
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(spacebarKeyboardEvent);
        expect(spacebarPreventDefaultSpy.calls.count()).toBe(2);
        expect(playSpy.calls.count()).toBe(1);
        expect(stopSpy.calls.count()).toBe(0);

        sequenceEdgesSubject.next({ cached: false, edges: [] });
        (<Subject<boolean>>navigatorMock.playService.playing$).next(true);
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(spacebarKeyboardEvent);
        expect(spacebarPreventDefaultSpy.calls.count()).toBe(3);
        expect(playSpy.calls.count()).toBe(1);
        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should not start play when in earth mode", () => {
        const playSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.playService.play;
        const stopSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.playService.stop;
        (<Subject<State>>navigatorMock.stateService.state$).next(State.Earth);

        const node: Node = nodeHelper.createNode();
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();
        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node);
        sequenceEdgesSubject.next({ cached: false, edges: [] });

        (<Subject<boolean>>navigatorMock.playService.playing$).next(false);
        (<Subject<NavigationDirection>>navigatorMock.playService.direction$).next(NavigationDirection.Next);
        (<Subject<number>>navigatorMock.playService.speed$).next(0.5);

        const spacebarKeyboardEvent: KeyboardEvent = EventHelper.createKeyboardEvent("keyDown", { key: " " });
        const spacebarPreventDefaultSpy: jasmine.Spy = spyOn(spacebarKeyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(spacebarKeyboardEvent);
        expect(spacebarPreventDefaultSpy.calls.count()).toBe(1);
        expect(playSpy.calls.count()).toBe(0);
        expect(stopSpy.calls.count()).toBe(0);

        (<Subject<NavigationDirection>>navigatorMock.playService.direction$).next(NavigationDirection.Next);
        sequenceEdgesSubject.next({
            cached: true,
            edges: [{
                data: { direction: NavigationDirection.Next, worldMotionAzimuth: 0 },
                source: node.key,
                target: "toKey",
            }],
        });
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(spacebarKeyboardEvent);
        expect(spacebarPreventDefaultSpy.calls.count()).toBe(2);
        expect(playSpy.calls.count()).toBe(0);
        expect(stopSpy.calls.count()).toBe(0);

        sequenceEdgesSubject.next({ cached: false, edges: [] });
        (<Subject<boolean>>navigatorMock.playService.playing$).next(true);
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(spacebarKeyboardEvent);
        expect(spacebarPreventDefaultSpy.calls.count()).toBe(3);
        expect(playSpy.calls.count()).toBe(0);
        expect(stopSpy.calls.count()).toBe(0);
    });
});
