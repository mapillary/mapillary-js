import { skip, first, take } from "rxjs/operators";
import { Subject } from "rxjs";

import { Navigator } from "../../src/viewer/Navigator";
import { Node } from "../../src/graph/Node";

import { ContainerMockCreator } from "../helper/ContainerMockCreator.spec";
import { NavigatorMockCreator } from "../helper/NavigatorMockCreator.spec";
import { NodeMockCreator } from "../helper/NodeMockCreator.spec";
import { MockCreator } from "../helper/MockCreator.spec";
import { ComponentService } from "../../src/component/ComponentService";
import { CoverComponent } from "../../src/component/CoverComponent";
import { ICoverConfiguration, CoverState } from "../../src/component/interfaces/ICoverConfiguration";
import { Container } from "../../src/viewer/Container";
import { Observer } from "../../src/viewer/Observer";
import { EventEmitter } from "../../src/utils/EventEmitter";
import { ComponentController } from "../../src/viewer/ComponentController";
import { Viewer } from "../../src/viewer/Viewer";
import { Component } from "../../src/component/Component";
import { IComponentConfiguration } from "../../src/component/interfaces/IComponentConfiguration";

class ComponentMock extends Component<IComponentConfiguration> {
    protected static _cn: string = "mock";
    public static get componentName(): string {
        return this._cn;
    };
    protected _activate(): void { /*noop*/ }
    protected _deactivate(): void { /*noop*/ }
    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }
}

class AC extends ComponentMock { protected static _cn: string = "attribution"; };
class BaC extends ComponentMock { protected static _cn: string = "background"; }
class BeC extends ComponentMock { protected static _cn: string = "bearing"; }
class CC extends ComponentMock { protected static _cn: string = "cache"; }
class DiC extends ComponentMock { protected static _cn: string = "direction"; }
class DeC extends ComponentMock { protected static _cn: string = "debug"; }
class IC extends ComponentMock { protected static _cn: string = "image"; }
class IPC extends ComponentMock { protected static _cn: string = "imagePlane"; }
class KC extends ComponentMock { protected static _cn: string = "keyboard"; }
class MaC extends ComponentMock { protected static _cn: string = "marker"; }
class MoC extends ComponentMock { protected static _cn: string = "mouse"; }
class NC extends ComponentMock { protected static _cn: string = "navigation"; }
class PC extends ComponentMock { protected static _cn: string = "popup"; }
class RC extends ComponentMock { protected static _cn: string = "route"; }
class SeC extends ComponentMock { protected static _cn: string = "sequence"; }
class SlC extends ComponentMock { protected static _cn: string = "slider"; }
class SDC extends ComponentMock { protected static _cn: string = "spatialData"; }
class TC extends ComponentMock { protected static _cn: string = "tag"; }
class ZC extends ComponentMock { protected static _cn: string = "zoom"; }

ComponentService.register(AC);
ComponentService.register(BaC);
ComponentService.register(BeC);
ComponentService.register(CC);
ComponentService.register(DiC);
ComponentService.register(DeC);
ComponentService.register(IC);
ComponentService.register(IPC);
ComponentService.register(KC);
ComponentService.register(MaC);
ComponentService.register(MoC);
ComponentService.register(NC);
ComponentService.register(PC);
ComponentService.register(RC);
ComponentService.register(SeC);
ComponentService.register(SlC);
ComponentService.register(SDC);
ComponentService.register(TC);
ComponentService.register(ZC);

class CoverComponentMock extends CoverComponent {
    protected _activate(): void { /*noop*/ }
    protected _deactivate(): void { /*noop*/ }
    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }
}

ComponentService.registerCover(CoverComponentMock);

describe("ComponentController.ctor", () => {
    it("should be defined", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.imageByKeyFull$)
            .and.returnValue(new Subject());
        const eventEmitter: EventEmitter = new EventEmitter();
        const observer: Observer = new Observer(eventEmitter, navigator, container);

        const componentService = new ComponentService(container, navigator);
        const componentController: ComponentController =
            new ComponentController(
                container,
                navigator,
                observer,
                "key",
                {},
                componentService);

        expect(componentController).toBeDefined();
    });

    it("should always have cover activated initially", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.imageByKeyFull$)
            .and.returnValue(new Subject());
        const eventEmitter: EventEmitter = new EventEmitter();
        const observer: Observer = new Observer(eventEmitter, navigator, container);

        const controllers: ComponentController[] = [];
        for (let i = 0; i < 5; i++) {
            const componentService = new ComponentService(container, navigator);
            const componentController: ComponentController =
                new ComponentController(container, navigator, observer, "key", { cover: false }, componentService);

            expect(componentService.coverActivated).toBeTrue();

            controllers.push(componentController);
        }

        for (const controller of controllers) {
            expect(controller).toBeDefined();
        }
    });
});

describe("ComponentController.navigable", () => {
    it("should be navigable if no key is supplied", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.imageByKeyFull$)
            .and.returnValue(new Subject());

        const componentService: ComponentService = new ComponentService(container, navigator);
        const eventEmitter: EventEmitter = new EventEmitter();
        const observer: Observer = new Observer(eventEmitter, navigator, container);

        const componentController =
            new ComponentController(
                container,
                navigator,
                observer,
                null,
                {},
                componentService);

        expect(componentController.navigable).toBe(true);
    });

    it("should not be navigable if key is supplied", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.imageByKeyFull$)
            .and.returnValue(new Subject());
        const componentService: ComponentService = new ComponentService(container, navigator);
        const eventEmitter: EventEmitter = new EventEmitter();
        const observer: Observer = new Observer(eventEmitter, navigator, container);

        const componentController: ComponentController =
            new ComponentController(
                container,
                navigator,
                observer,
                "key",
                {},
                componentService);

        expect(componentController.navigable).toBe(false);
    });

    it("should not change when initialized without key and moved to key", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.imageByKeyFull$)
            .and.returnValue(new Subject());
        const componentService: ComponentService = new ComponentService(container, navigator);
        const eventEmitter: EventEmitter = new EventEmitter();
        const observer: Observer = new Observer(eventEmitter, navigator, container);

        (<jasmine.Spy>container.mouseService.filtered$).and.returnValue(new Subject<MouseEvent>());
        (<jasmine.Spy>container.mouseService.filteredWheel$).and.returnValue(new Subject<MouseEvent>());

        const componentController: ComponentController =
            new ComponentController(
                container,
                navigator,
                observer,
                null,
                {},
                componentService);

        expect(componentController.navigable).toBe(true);
        expect(componentService.coverActivated).toBe(true);

        const coverComponent: CoverComponent = componentService.getCover();
        const key: string = "key";

        coverComponent.configuration$.pipe(
            skip(1), // skip initial default configuration
            take(1))
            .subscribe(
                (c: ICoverConfiguration): void => {
                    expect(c.key).toBe(key);
                });

        let navigableChangedCount: number = 0;
        eventEmitter.on(
            Viewer.navigablechanged,
            (): void => {
                navigableChangedCount++;
            });

        (<Subject<string>>navigator.movedToKey$).next(key);

        expect(componentController.navigable).toBe(true);
        expect(navigableChangedCount).toBe(0);
        expect(componentService.coverActivated).toBe(false);
    });

    it("should change when initialized with key and cover false and node retrieved", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.imageByKeyFull$)
            .and.returnValue(new Subject());
        const componentService: ComponentService = new ComponentService(container, navigator);
        const eventEmitter: EventEmitter = new EventEmitter();
        const observer: Observer = new Observer(eventEmitter, navigator, container);

        (<jasmine.Spy>container.mouseService.filtered$).and.returnValue(new Subject<MouseEvent>());
        (<jasmine.Spy>container.mouseService.filteredWheel$).and.returnValue(new Subject<MouseEvent>());
        const moveToKey$: Subject<Node> = new Subject<Node>();
        (<jasmine.Spy>navigator.moveToKey$).and.returnValue(moveToKey$);

        const key: string = "key";
        const componentController: ComponentController =
            new ComponentController(
                container,
                navigator,
                observer,
                key,
                { cover: false },
                componentService);

        expect(componentController.navigable).toBe(false);
        expect(componentService.coverActivated).toBe(true);

        const coverComponent: CoverComponent = componentService.getCover();

        let configurationCount: number = 0;
        coverComponent.configuration$.pipe(
            first(
                (c: ICoverConfiguration): boolean => {
                    return c.state === CoverState.Hidden;
                }))
            .subscribe(
                (c: ICoverConfiguration): void => {
                    configurationCount++;
                    expect(c.key).toBe(key);
                });

        let navigableChangedCount: number = 0;
        eventEmitter.on(
            Viewer.navigablechanged,
            (navigable: boolean): void => {
                navigableChangedCount++;
                expect(navigable).toBe(true);
            });

        (<Subject<string>>navigator.stateService.currentKey$).next(null);
        moveToKey$.next(new NodeMockCreator().create({ key: "key" }));

        expect(componentController.navigable).toBe(true);
        expect(configurationCount).toBe(1);
        expect(navigableChangedCount).toBe(1);
        expect(componentService.coverActivated).toBe(false);
    });

    it("should not change when initialized with key and cover false and node retrieval fail", () => {
        spyOn(console, "error").and.stub();

        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.imageByKeyFull$)
            .and.returnValue(new Subject());
        const componentService: ComponentService = new ComponentService(container, navigator);
        const eventEmitter: EventEmitter = new EventEmitter();
        const observer: Observer = new Observer(eventEmitter, navigator, container);

        (<jasmine.Spy>container.mouseService.filtered$).and.returnValue(new Subject<MouseEvent>());
        const moveToKey$: Subject<Node> = new Subject<Node>();
        (<jasmine.Spy>navigator.moveToKey$).and.returnValue(moveToKey$);

        const key: string = "key";
        const componentController: ComponentController =
            new ComponentController(
                container,
                navigator,
                observer,
                key,
                { cover: false },
                componentService);

        expect(componentController.navigable).toBe(false);
        expect(componentService.coverActivated).toBe(true);

        let navigableChangedCount: number = 0;
        eventEmitter.on(
            Viewer.navigablechanged,
            (): void => {
                navigableChangedCount++;
            });

        (<Subject<string>>navigator.stateService.currentKey$).next(null);
        moveToKey$.error(new Error("Move to key failed"));

        expect(componentController.navigable).toBe(false);
        expect(navigableChangedCount).toBe(0);
        expect(componentService.coverActivated).toBe(true);
    });

    it("should change when activating cover after successful deactivation", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.imageByKeyFull$)
            .and.returnValue(new Subject());
        const componentService: ComponentService = new ComponentService(container, navigator);
        const eventEmitter: EventEmitter = new EventEmitter();
        const observer: Observer = new Observer(eventEmitter, navigator, container);

        (<jasmine.Spy>container.mouseService.filtered$).and.returnValue(new Subject<MouseEvent>());
        (<jasmine.Spy>container.mouseService.filteredWheel$).and.returnValue(new Subject<MouseEvent>());
        const moveToKey$: Subject<Node> = new Subject<Node>();
        (<jasmine.Spy>navigator.moveToKey$).and.returnValue(moveToKey$);

        const key: string = "key";
        const componentController: ComponentController =
            new ComponentController(
                container,
                navigator,
                observer,
                key,
                { cover: false },
                componentService);

        (<Subject<string>>navigator.stateService.currentKey$).next(null);
        moveToKey$.next(new NodeMockCreator().create({ key: "key" }));

        expect(componentController.navigable).toBe(true);
        expect(componentService.coverActivated).toBe(false);

        let navigableChangedCount: number = 0;
        eventEmitter.on(
            Viewer.navigablechanged,
            (navigable: boolean): void => {
                navigableChangedCount++;
                expect(navigable).toBe(false);
            });

        componentController.activateCover();

        expect(navigableChangedCount).toBe(1);
        expect(componentController.navigable).toBe(false);
        expect(componentService.coverActivated).toBe(true);
    });
});

describe("ComponentController.activateCover", () => {
    it("should not move again if deactivating cover twice", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.imageByKeyFull$)
            .and.returnValue(new Subject());
        const componentService: ComponentService = new ComponentService(container, navigator);
        const observer: Observer = new MockCreator().create(Observer, "Observer");

        (<jasmine.Spy>container.mouseService.filtered$).and.returnValue(new Subject<MouseEvent>());
        (<jasmine.Spy>container.mouseService.filteredWheel$).and.returnValue(new Subject<MouseEvent>());

        const moveToKeySpy: jasmine.Spy = <jasmine.Spy>navigator.moveToKey$;
        const moveToKey$: Subject<Node> = new Subject<Node>();
        moveToKeySpy.and.returnValue(moveToKey$);

        const key: string = "key_key";
        const componentController: ComponentController =
            new ComponentController(
                container,
                navigator,
                observer,
                key,
                { cover: true },
                componentService);

        componentController.deactivateCover();

        (<Subject<string>>navigator.stateService.currentKey$).next(null);

        expect(moveToKeySpy.calls.count()).toBe(1);

        componentController.deactivateCover();

        (<Subject<string>>navigator.stateService.currentKey$).next(null);

        expect(moveToKeySpy.calls.count()).toBe(1);
    });

    it("should not stop again if activating cover twice", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.imageByKeyFull$)
            .and.returnValue(new Subject());
        const componentService: ComponentService = new ComponentService(container, navigator);
        const observer: Observer = new MockCreator().create(Observer, "Observer");

        (<jasmine.Spy>container.mouseService.filtered$).and.returnValue(new Subject<MouseEvent>());
        (<jasmine.Spy>container.mouseService.filteredWheel$).and.returnValue(new Subject<MouseEvent>());

        const moveToKeySpy: jasmine.Spy = <jasmine.Spy>navigator.moveToKey$;
        const moveToKey$: Subject<Node> = new Subject<Node>();
        moveToKeySpy.and.returnValue(moveToKey$);

        const stopEmitSpy: jasmine.Spy = <jasmine.Spy>observer.stopEmit;

        const key: string = "key_key";
        const componentController: ComponentController =
            new ComponentController(
                container,
                navigator,
                observer,
                key,
                { cover: false },
                componentService);

        componentController.activateCover();

        expect(stopEmitSpy.calls.count()).toBe(1);

        componentController.activateCover();

        expect(stopEmitSpy.calls.count()).toBe(1);
    });
});
