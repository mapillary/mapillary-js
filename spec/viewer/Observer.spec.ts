import { Subject } from "rxjs";

import { Navigator } from "../../src/viewer/Navigator";

import { ContainerMockCreator } from "../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../helper/NavigatorMockCreator";
import { EventEmitter } from "../../src/utils/EventEmitter";
import { Observer } from "../../src/viewer/Observer";
import { Viewer } from "../../src/viewer/Viewer";

describe("Observer.ctor", () => {
    it("should be defined", () => {
        const eventEmitter: EventEmitter = new EventEmitter();

        const observer: Observer =
            new Observer(
                eventEmitter,
                new NavigatorMockCreator().create(),
                new ContainerMockCreator().create());

        expect(observer).toBeDefined();
    });
});

describe("Observer.loading", () => {
    it("should emit loading when not started", (done: Function) => {
        const eventEmitter: EventEmitter = new EventEmitter();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const observer: Observer = new Observer(
            eventEmitter,
            navigatorMock,
            new ContainerMockCreator().create());

        expect(observer).toBeDefined();

        eventEmitter.on(
            Viewer.loadingchanged,
            (loading: boolean) => {
                expect(loading).toBe(true);
                done();
            });

        (<Subject<boolean>>navigatorMock.loadingService.loading$).next(true);
    });

    it("should emit loading when started", (done: Function) => {
        const eventEmitter: EventEmitter = new EventEmitter();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const observer: Observer =
            new Observer(
                eventEmitter,
                navigatorMock,
                new ContainerMockCreator().create());

        eventEmitter.on(
            Viewer.loadingchanged,
            (loading: boolean) => {
                expect(loading).toBe(true);
                done();
            });

        observer.startEmit();

        (<Subject<boolean>>navigatorMock.loadingService.loading$).next(true);
    });

    it("should emit loading when started and stopped", (done: Function) => {
        const eventEmitter: EventEmitter = new EventEmitter();
        const navigatorMock: Navigator = new NavigatorMockCreator().create();

        const observer: Observer =
            new Observer(
                eventEmitter,
                navigatorMock,
                new ContainerMockCreator().create());

        eventEmitter.on(
            Viewer.loadingchanged,
            (loading: boolean) => {
                expect(loading).toBe(true);
                done();
            });

        observer.startEmit();
        observer.stopEmit();

        (<Subject<boolean>>navigatorMock.loadingService.loading$).next(true);
    });
});
