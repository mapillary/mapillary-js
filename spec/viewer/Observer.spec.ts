/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {EventEmitter} from "../../src/Utils";
import {
    Navigator,
    Observer,
    Viewer,
} from "../../src/Viewer";

import {ContainerMockCreator} from "../helper/ContainerMockCreator.spec";
import {NavigatorMockCreator} from "../helper/NavigatorMockCreator.spec";

class TestEventEmitter extends EventEmitter { }

describe("Observer.ctor", () => {
    it("should be defined", () => {
        const eventEmitter: EventEmitter = new TestEventEmitter();

        const observer: Observer =
            new Observer(
                eventEmitter,
                new NavigatorMockCreator().createMock(),
                new ContainerMockCreator().createMock());

        expect(observer).toBeDefined();
    });
});

describe("Observer.loading", () => {
    it("should emit loading when not started", (done: Function) => {
        const eventEmitter: EventEmitter = new TestEventEmitter();
        const navigatorMock: Navigator = new NavigatorMockCreator().createMock();

        new Observer(
            eventEmitter,
            navigatorMock,
            new ContainerMockCreator().createMock());

        eventEmitter.on(
            Viewer.loadingchanged,
            (loading: boolean) => {
                expect(loading).toBe(true);
                done();
            });

        (<Subject<boolean>>navigatorMock.loadingService.loading$).next(true);
    });

    it("should emit loading when started", (done: Function) => {
        const eventEmitter: EventEmitter = new TestEventEmitter();
        const navigatorMock: Navigator = new NavigatorMockCreator().createMock();

        const observer: Observer =
            new Observer(
                eventEmitter,
                navigatorMock,
                new ContainerMockCreator().createMock());

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
        const eventEmitter: EventEmitter = new TestEventEmitter();
        const navigatorMock: Navigator = new NavigatorMockCreator().createMock();

        const observer: Observer =
            new Observer(
                eventEmitter,
                navigatorMock,
                new ContainerMockCreator().createMock());

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
