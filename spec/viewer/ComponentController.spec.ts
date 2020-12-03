import { skip, first, take } from "rxjs/operators";
import { Subject } from "rxjs";

import {
    ComponentService,
    CoverComponent,
    CoverState,
    ICoverConfiguration,
} from "../../src/Component";
import { Node } from "../../src/Graph";
import { EventEmitter } from "../../src/Utils";
import {
    ComponentController,
    Container,
    Navigator,
    Observer,
    Viewer,
} from "../../src/Viewer";

import { ContainerMockCreator } from "../helper/ContainerMockCreator.spec";
import { NavigatorMockCreator } from "../helper/NavigatorMockCreator.spec";
import { NodeMockCreator } from "../helper/NodeMockCreator.spec";
import { MockCreator } from "../helper/MockCreator.spec";

describe("ComponentController.ctor", () => {
    it("should be defined", () => {
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

        expect(componentController).toBeDefined();
    });

    it("should always have cover activated initially", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.imageByKeyFull$)
            .and.returnValue(new Subject());
        const eventEmitter: EventEmitter = new EventEmitter();
        const observer: Observer = new Observer(eventEmitter, navigator, container);

        const componentService1: ComponentService = new ComponentService(container, navigator);
        const componentController1: ComponentController =
            new ComponentController(container, navigator, observer, "key", {}, componentService1);
        expect(componentService1.coverActivated).toBe(true);

        const componentService2: ComponentService = new ComponentService(container, navigator);
        const componentController2: ComponentController =
            new ComponentController(container, navigator, observer, "key", { cover: true }, componentService2);
        expect(componentService2.coverActivated).toBe(true);

        const componentService3: ComponentService = new ComponentService(container, navigator);
        const componentController3: ComponentController =
            new ComponentController(container, navigator, observer, "key", { cover: false }, componentService3);
        expect(componentService3.coverActivated).toBe(true);

        const componentService4: ComponentService = new ComponentService(container, navigator);
        const componentController4: ComponentController =
            new ComponentController(container, navigator, observer, null, {}, componentService4);
        expect(componentService4.coverActivated).toBe(true);

        const componentService5: ComponentService = new ComponentService(container, navigator);
        const componentController5: ComponentController =
            new ComponentController(container, navigator, observer, null, { cover: false }, componentService5);
        expect(componentService5.coverActivated).toBe(true);

        expect(
            !!componentController1 &&
            !!componentController2 &&
            !!componentController3 &&
            !!componentController4 &&
            !!componentController5).toBe(true);
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

        const componentController: ComponentController =
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
            (navigable: boolean): void => {
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
            (navigable: boolean): void => {
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
