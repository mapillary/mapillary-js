import { Subject } from "rxjs";

import { ContainerMockCreator } from "../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../helper/NavigatorMockCreator";
import { EventEmitter } from "../../src/util/EventEmitter";
import { Observer } from "../../src/viewer/Observer";
import { Viewer } from "../../src/viewer/Viewer";
import { ViewerLoadingEvent } from "../../src/viewer/events/ViewerLoadingEvent";

describe("Observer.ctor", () => {
    it("should be defined", () => {
        const viewer = <Viewer>new EventEmitter();

        const observer =
            new Observer(
                viewer,
                new NavigatorMockCreator().create(),
                new ContainerMockCreator().create());

        expect(observer).toBeDefined();
    });
});

describe("Observer.loading", () => {
    it("should emit loading when not started", (done: Function) => {
        const viewer = <Viewer>new EventEmitter();
        const navigatorMock = new NavigatorMockCreator().create();

        const observer = new Observer(
            viewer,
            navigatorMock,
            new ContainerMockCreator().create());

        expect(observer).toBeDefined();

        viewer.on(
            "loading",
            (event: ViewerLoadingEvent) => {
                expect(event.loading).toBe(true);
                done();
            });

        (<Subject<boolean>>navigatorMock.loadingService.loading$).next(true);
    });

    it("should emit loading when started", (done: Function) => {
        const viewer = <Viewer>new EventEmitter();
        const navigatorMock = new NavigatorMockCreator().create();

        const observer =
            new Observer(
                viewer,
                navigatorMock,
                new ContainerMockCreator().create());

        viewer.on(
            "loading",
            (event: ViewerLoadingEvent) => {
                expect(event.loading).toBe(true);
                done();
            });

        observer.startEmit();

        (<Subject<boolean>>navigatorMock.loadingService.loading$).next(true);
    });

    it("should emit loading when started and stopped", (done: Function) => {
        const viewer = <Viewer>new EventEmitter();
        const navigatorMock = new NavigatorMockCreator().create();

        const observer =
            new Observer(
                viewer,
                navigatorMock,
                new ContainerMockCreator().create());

        viewer.on(
            "loading",
            (event: ViewerLoadingEvent) => {
                expect(event.loading).toBe(true);
                done();
            });

        observer.startEmit();
        observer.stopEmit();

        (<Subject<boolean>>navigatorMock.loadingService.loading$).next(true);
    });
});
