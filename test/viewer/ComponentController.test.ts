import {
    skip,
    first,
    take,
} from "rxjs/operators";
import { Subject } from "rxjs";

import { Image } from "../../src/graph/Image";
import { ContainerMockCreator } from "../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../helper/NavigatorMockCreator";
import { ImageMockCreator } from "../helper/ImageMockCreator";
import { MockCreator } from "../helper/MockCreator";
import { ComponentService } from "../../src/component/ComponentService";
import { CoverComponent } from "../../src/component/cover/CoverComponent";
import { CoverConfiguration }
    from "../../src/component/interfaces/CoverConfiguration";
import { Observer } from "../../src/viewer/Observer";
import { EventEmitter } from "../../src/util/EventEmitter";
import { ComponentController } from "../../src/viewer/ComponentController";
import { Viewer } from "../../src/viewer/Viewer";
import { Component } from "../../src/component/Component";
import { ComponentConfiguration }
    from "../../src/component/interfaces/ComponentConfiguration";
import { CoverState } from "../../src/component/cover/CoverState";
import { ViewerNavigableEvent }
    from "../../src/viewer/events/ViewerNavigableEvent";
import { ComponentName } from "../../src/component/ComponentName";
import { FallbackComponentName }
    from "../../src/component/fallback/FallbackComponentName";

class CMock extends Component<ComponentConfiguration> {
    protected static _cn: ComponentName | FallbackComponentName;
    public static get componentName(): ComponentName | FallbackComponentName {
        return this._cn;
    };
    protected _activate(): void { /*noop*/ }
    protected _deactivate(): void { /*noop*/ }
    protected _getDefaultConfiguration(): ComponentConfiguration {
        return {};
    }
}

class IFC extends CMock {
    protected static _cn: FallbackComponentName = "imagefallback";
}
class NFC extends CMock {
    protected static _cn: FallbackComponentName = "navigationfallback";
}

ComponentService.register(IFC);
ComponentService.register(NFC);

class AC extends CMock { protected static _cn: ComponentName = "attribution"; };
class BeC extends CMock { protected static _cn: ComponentName = "bearing"; }
class CC extends CMock { protected static _cn: ComponentName = "cache"; }
class DiC extends CMock { protected static _cn: ComponentName = "direction"; }
class IC extends CMock { protected static _cn: ComponentName = "image"; }
class KC extends CMock { protected static _cn: ComponentName = "keyboard"; }
class MaC extends CMock { protected static _cn: ComponentName = "marker"; }
class MoC extends CMock { protected static _cn: ComponentName = "mouse"; }
class PC extends CMock { protected static _cn: ComponentName = "popup"; }
class SeC extends CMock { protected static _cn: ComponentName = "sequence"; }
class SlC extends CMock { protected static _cn: ComponentName = "slider"; }
class SpC extends CMock { protected static _cn: ComponentName = "spatial"; }
class TC extends CMock { protected static _cn: ComponentName = "tag"; }
class ZC extends CMock { protected static _cn: ComponentName = "zoom"; }

ComponentService.register(AC);
ComponentService.register(BeC);
ComponentService.register(CC);
ComponentService.register(DiC);
ComponentService.register(IC);
ComponentService.register(KC);
ComponentService.register(MaC);
ComponentService.register(MoC);
ComponentService.register(PC);
ComponentService.register(SeC);
ComponentService.register(SlC);
ComponentService.register(SpC);
ComponentService.register(TC);
ComponentService.register(ZC);

class CoverComponentMock extends CoverComponent {
    protected _activate(): void { /*noop*/ }
    protected _deactivate(): void { /*noop*/ }
    protected _getDefaultConfiguration(): ComponentConfiguration {
        return {};
    }
}

ComponentService.registerCover(CoverComponentMock);

describe("ComponentController.ctor", () => {
    it("should be defined", () => {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.getImages$)
            .and.returnValue(new Subject());
        const viewer = <Viewer>new EventEmitter();
        const observer = new Observer(viewer, navigator, container);

        const componentService = new ComponentService(container, navigator);
        const componentController =
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
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.getImages$)
            .and.returnValue(new Subject());
        const viewer = <Viewer>new EventEmitter();
        const observer = new Observer(viewer, navigator, container);

        const controllers: ComponentController[] = [];
        for (let i = 0; i < 5; i++) {
            const componentService = new ComponentService(container, navigator);
            const componentController =
                new ComponentController(container, navigator, observer, "key", { cover: false }, componentService);

            expect(componentService.coverActivated).toBe(true);

            controllers.push(componentController);
        }

        for (const controller of controllers) {
            expect(controller).toBeDefined();
        }
    });
});

describe("ComponentController.navigable", () => {
    it("should be navigable if no key is supplied", () => {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.getImages$)
            .and.returnValue(new Subject());

        const componentService = new ComponentService(container, navigator);
        const viewer = <Viewer>new EventEmitter();
        const observer = new Observer(viewer, navigator, container);

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
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.getImages$)
            .and.returnValue(new Subject());
        const componentService = new ComponentService(container, navigator);
        const viewer = <Viewer>new EventEmitter();
        const observer = new Observer(viewer, navigator, container);

        const componentController =
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
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.getImages$)
            .and.returnValue(new Subject());
        const componentService = new ComponentService(container, navigator);
        const viewer = <Viewer>new EventEmitter();
        const observer = new Observer(viewer, navigator, container);

        (<jasmine.Spy>container.mouseService.filtered$).and.returnValue(new Subject<MouseEvent>());
        (<jasmine.Spy>container.mouseService.filteredWheel$).and.returnValue(new Subject<MouseEvent>());

        const componentController =
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
                (c: CoverConfiguration): void => {
                    expect(c.id).toBe(key);
                });

        let navigableChangedCount: number = 0;
        viewer.on(
            "navigable",
            (): void => {
                navigableChangedCount++;
            });

        (<Subject<string>>navigator.movedToId$).next(key);

        expect(componentController.navigable).toBe(true);
        expect(navigableChangedCount).toBe(0);
        expect(componentService.coverActivated).toBe(false);
    });

    it("should change when initialized with key and cover false and image retrieved", () => {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.getImages$)
            .and.returnValue(new Subject());
        const componentService = new ComponentService(container, navigator);
        const viewer = <Viewer>new EventEmitter();
        const observer = new Observer(viewer, navigator, container);

        (<jasmine.Spy>container.mouseService.filtered$).and.returnValue(new Subject<MouseEvent>());
        (<jasmine.Spy>container.mouseService.filteredWheel$).and.returnValue(new Subject<MouseEvent>());
        const moveToKey$: Subject<Image> = new Subject<Image>();
        (<jasmine.Spy>navigator.moveTo$).and.returnValue(moveToKey$);

        const key: string = "key";
        const componentController =
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
                (c: CoverConfiguration): boolean => {
                    return c.state === CoverState.Hidden;
                }))
            .subscribe(
                (c: CoverConfiguration): void => {
                    configurationCount++;
                    expect(c.id).toBe(key);
                });

        let navigableChangedCount: number = 0;
        viewer.on(
            "navigable",
            (event: ViewerNavigableEvent): void => {
                navigableChangedCount++;
                expect(event.navigable).toBe(true);
            });

        (<Subject<string>>navigator.stateService.currentId$).next(null);
        moveToKey$.next(new ImageMockCreator().create({ key: "key" }));

        expect(componentController.navigable).toBe(true);
        expect(configurationCount).toBe(1);
        expect(navigableChangedCount).toBe(1);
        expect(componentService.coverActivated).toBe(false);
    });

    it("should not change when initialized with key and cover false and image retrieval fail", () => {
        spyOn(console, "error").and.stub();

        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.getImages$)
            .and.returnValue(new Subject());
        const componentService = new ComponentService(container, navigator);
        const viewer = <Viewer>new EventEmitter();
        const observer = new Observer(viewer, navigator, container);

        (<jasmine.Spy>container.mouseService.filtered$).and.returnValue(new Subject<MouseEvent>());
        const moveToKey$: Subject<Image> = new Subject<Image>();
        (<jasmine.Spy>navigator.moveTo$).and.returnValue(moveToKey$);

        const key = "key";
        const componentController =
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
        viewer.on(
            "navigable",
            (): void => {
                navigableChangedCount++;
            });

        (<Subject<string>>navigator.stateService.currentId$).next(null);
        moveToKey$.error(new Error("Move to key failed"));

        expect(componentController.navigable).toBe(false);
        expect(navigableChangedCount).toBe(0);
        expect(componentService.coverActivated).toBe(true);
    });

    it("should change when activating cover after successful deactivation", () => {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.getImages$)
            .and.returnValue(new Subject());
        const componentService = new ComponentService(container, navigator);
        const viewer = <Viewer>new EventEmitter();
        const observer = new Observer(viewer, navigator, container);

        (<jasmine.Spy>container.mouseService.filtered$).and.returnValue(new Subject<MouseEvent>());
        (<jasmine.Spy>container.mouseService.filteredWheel$).and.returnValue(new Subject<MouseEvent>());
        const moveToKey$: Subject<Image> = new Subject<Image>();
        (<jasmine.Spy>navigator.moveTo$).and.returnValue(moveToKey$);

        const key = "key";
        const componentController =
            new ComponentController(
                container,
                navigator,
                observer,
                key,
                { cover: false },
                componentService);

        (<Subject<string>>navigator.stateService.currentId$).next(null);
        moveToKey$.next(new ImageMockCreator().create({ key: "key" }));

        expect(componentController.navigable).toBe(true);
        expect(componentService.coverActivated).toBe(false);

        let navigableChangedCount: number = 0;
        viewer.on(
            "navigable",
            (event: ViewerNavigableEvent): void => {
                navigableChangedCount++;
                expect(event.navigable).toBe(false);
            });

        componentController.activateCover();

        expect(navigableChangedCount).toBe(1);
        expect(componentController.navigable).toBe(false);
        expect(componentService.coverActivated).toBe(true);
    });
});

describe("ComponentController.activateCover", () => {
    it("should not move again if deactivating cover twice", () => {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.getImages$)
            .and.returnValue(new Subject());
        const componentService = new ComponentService(container, navigator);
        const observer = new MockCreator().create(Observer, "Observer");

        (<jasmine.Spy>container.mouseService.filtered$).and.returnValue(new Subject<MouseEvent>());
        (<jasmine.Spy>container.mouseService.filteredWheel$).and.returnValue(new Subject<MouseEvent>());

        const moveToKeySpy: jasmine.Spy = <jasmine.Spy>navigator.moveTo$;
        const moveToKey$: Subject<Image> = new Subject<Image>();
        moveToKeySpy.and.returnValue(moveToKey$);

        const key = "key_key";
        const componentController =
            new ComponentController(
                container,
                navigator,
                observer,
                key,
                { cover: true },
                componentService);

        componentController.deactivateCover();

        (<Subject<string>>navigator.stateService.currentId$).next(null);

        expect(moveToKeySpy.calls.count()).toBe(1);

        componentController.deactivateCover();

        (<Subject<string>>navigator.stateService.currentId$).next(null);

        expect(moveToKeySpy.calls.count()).toBe(1);
    });

    it("should not stop again if activating cover twice", () => {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        (<jasmine.Spy>navigator.api.getImages$)
            .and.returnValue(new Subject());
        const componentService = new ComponentService(container, navigator);
        const observer = new MockCreator().create(Observer, "Observer");

        (<jasmine.Spy>container.mouseService.filtered$).and.returnValue(new Subject<MouseEvent>());
        (<jasmine.Spy>container.mouseService.filteredWheel$).and.returnValue(new Subject<MouseEvent>());

        const moveToKeySpy: jasmine.Spy = <jasmine.Spy>navigator.moveTo$;
        const moveToKey$: Subject<Image> = new Subject<Image>();
        moveToKeySpy.and.returnValue(moveToKey$);

        const stopEmitSpy: jasmine.Spy = <jasmine.Spy>observer.stopEmit;

        const key = "key_key";
        const componentController =
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
