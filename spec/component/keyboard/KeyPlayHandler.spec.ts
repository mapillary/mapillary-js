import {Subject} from "rxjs";

import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {EventHelper} from "../../helper/EventHelper.spec";
import {MockCreator} from "../../helper/MockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";
import {NodeHelper} from "../../helper/NodeHelper.spec";

import {
    Component,
    IComponentConfiguration,
    KeyPlayHandler,
} from "../../../src/Component";
import { EdgeDirection } from "../../../src/Edge";
import {
    IEdgeStatus,
    Node,
} from "../../../src/Graph";
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
        (<Subject<EdgeDirection>>navigatorMock.playService.direction$).next(EdgeDirection.Next);
        (<Subject<number>>navigatorMock.playService.speed$).next(0.5);

        const node: Node = nodeHelper.createNode();
        const sequenceEdgesSubject: Subject<IEdgeStatus> = new Subject<IEdgeStatus>();
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
        (<Subject<EdgeDirection>>navigatorMock.playService.direction$).next(EdgeDirection.Next);
        (<Subject<number>>navigatorMock.playService.speed$).next(0.5);

        const node: Node = nodeHelper.createNode();
        const sequenceEdgesSubject: Subject<IEdgeStatus> = new Subject<IEdgeStatus>();
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
        (<Subject<EdgeDirection>>navigatorMock.playService.direction$).next(EdgeDirection.Next);
        (<Subject<number>>navigatorMock.playService.speed$).next(0.5);

        const node: Node = nodeHelper.createNode();
        const sequenceEdgesSubject: Subject<IEdgeStatus> = new Subject<IEdgeStatus>();
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
        (<Subject<EdgeDirection>>navigatorMock.playService.direction$).next(EdgeDirection.Next);
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(shiftKeyboardEvent);
        expect(shiftPreventDefaultSpy.calls.count()).toBe(2);
        expect(setDirectionSpy.calls.count()).toBe(1);
        expect(setDirectionSpy.calls.argsFor(0)[0]).toBe(EdgeDirection.Prev);

        (<Subject<boolean>>navigatorMock.playService.playing$).next(false);
        (<Subject<EdgeDirection>>navigatorMock.playService.direction$).next(EdgeDirection.Prev);
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(shiftKeyboardEvent);
        expect(shiftPreventDefaultSpy.calls.count()).toBe(3);
        expect(setDirectionSpy.calls.count()).toBe(2);
        expect(setDirectionSpy.calls.argsFor(1)[0]).toBe(EdgeDirection.Next);
    });

    it("should play when stopped edge direction exist and stop when playing", () => {
        const playSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.playService.play;
        const stopSpy: jasmine.Spy = <jasmine.Spy>navigatorMock.playService.stop;

        const node: Node = nodeHelper.createNode();
        const sequenceEdgesSubject: Subject<IEdgeStatus> = new Subject<IEdgeStatus>();
        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);
        (<Subject<Node>>navigatorMock.stateService.currentNode$).next(node);
        sequenceEdgesSubject.next({ cached: false, edges: [] });

        (<Subject<boolean>>navigatorMock.playService.playing$).next(false);
        (<Subject<EdgeDirection>>navigatorMock.playService.direction$).next(EdgeDirection.Next);
        (<Subject<number>>navigatorMock.playService.speed$).next(0.5);

        const spacebarKeyboardEvent: KeyboardEvent = EventHelper.createKeyboardEvent("keyDown", { key: " " });
        const spacebarPreventDefaultSpy: jasmine.Spy = spyOn(spacebarKeyboardEvent, "preventDefault").and.stub();
        (<Subject<KeyboardEvent>>containerMock.keyboardService.keyDown$).next(spacebarKeyboardEvent);
        expect(spacebarPreventDefaultSpy.calls.count()).toBe(1);
        expect(playSpy.calls.count()).toBe(0);
        expect(stopSpy.calls.count()).toBe(0);

        (<Subject<EdgeDirection>>navigatorMock.playService.direction$).next(EdgeDirection.Next);
        sequenceEdgesSubject.next({
            cached: true,
            edges: [{
                data: { direction: EdgeDirection.Next, worldMotionAzimuth: 0 },
                from: node.key,
                to:  "toKey",
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
});
