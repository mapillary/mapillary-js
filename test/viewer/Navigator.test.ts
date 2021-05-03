import { bootstrap } from "../Bootstrap";
bootstrap();

import {
    empty as observableEmpty,
    of as observableOf,
    throwError as observableThrowError,
    Observable,
    Subject,
} from "rxjs";
import { first } from "rxjs/operators";

import { ImageHelper } from "../helper/ImageHelper";
import { StateServiceMockCreator } from "../helper/StateServiceMockCreator";

import { Navigator } from "../../src/viewer/Navigator";
import { Image } from "../../src/graph/Image";
import { APIWrapper } from "../../src/api/APIWrapper";
import { FalcorDataProvider } from "../../src/api/falcor/FalcorDataProvider";
import { CoreImageEnt } from "../../src/api/ents/CoreImageEnt";
import { Graph } from "../../src/graph/Graph";
import { GraphService } from "../../src/graph/GraphService";
import { IAnimationState } from "../../src/state/interfaces/IAnimationState";
import { AnimationFrame } from "../../src/state/interfaces/AnimationFrame";
import { State } from "../../src/state/State";
import { StateService } from "../../src/state/StateService";
import { CacheService } from "../../src/viewer/CacheService";
import { LoadingService } from "../../src/viewer/LoadingService";
import { CancelMapillaryError } from "../../src/error/CancelMapillaryError";
import { NavigationDirection } from "../../src/graph/edge/NavigationDirection";

const createState: () => IAnimationState = (): IAnimationState => {
    return {
        alpha: 0,
        camera: null,
        currentCamera: null,
        currentIndex: 0,
        currentImage: null,
        currentTransform: null,
        lastImage: null,
        motionless: false,
        imagesAhead: 0,
        previousImage: null,
        previousTransform: null,
        reference: null,
        state: State.Traversing,
        trajectory: null,
        zoom: 0,
    };
};

describe("Navigator.ctor", () => {
    it("should be defined without optional params", () => {
        const navigator: Navigator = new Navigator({
            apiClient: "clientid", container: "containerid",
        });

        expect(navigator).toBeDefined();
    });

    it("should be defined with optional params", () => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graphService: GraphService = new GraphService(new Graph(api));
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService(State.Traversing);
        const cacheService: CacheService = new CacheService(graphService, stateService);

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService,
                cacheService);

        expect(navigator).toBeDefined();
    });
});

describe("Navigator.moveToKey$", () => {
    it("should start loading", () => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graphService: GraphService = new GraphService(new Graph(api));
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService(State.Traversing);
        const cacheService: CacheService = new CacheService(graphService, stateService);

        const loadingSpy: jasmine.Spy = spyOn(loadingService, "startLoading").and.stub();

        spyOn(graphService, "cacheImage$").and.returnValue(observableEmpty());

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService,
                cacheService);

        const key: string = "key";

        navigator.moveTo$(key);

        expect(loadingSpy.calls.count()).toBe(1);
        expect(loadingSpy.calls.first().args[0]).toBe("navigator");
    });

    it("should stop loading when succeeding", () => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graphService: GraphService = new GraphService(new Graph(api));
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService(State.Traversing);

        spyOn(loadingService, "startLoading").and.stub();
        const stopLoadingSpy: jasmine.Spy = spyOn(loadingService, "stopLoading").and.stub();

        const key: string = "key";
        const sequenceKey: string = "sequenceId";
        spyOn(graphService, "cacheImage$").and.returnValue(observableOf<Image>(
            new Image({
                computed_geometry: { lat: 0, lng: 0 },
                id: key,
                geometry: { lat: 0, lng: 0 },
                sequence: { id: sequenceKey },
            })));

        const stateSpy: jasmine.Spy = spyOn(stateService, "setImages").and.stub();

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService);

        navigator.moveTo$(key).subscribe(() => { /*noop*/ });

        expect(stateSpy.calls.count()).toBe(1);

        expect(stopLoadingSpy.calls.count()).toBe(1);
        expect(stopLoadingSpy.calls.first().args[0]).toBe("navigator");
    });

    it("should stop loading when error is thrown", () => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graphService: GraphService = new GraphService(new Graph(api));
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService(State.Traversing);
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        const stopLoadingSpy: jasmine.Spy = spyOn(loadingService, "stopLoading").and.stub();

        spyOn(graphService, "cacheImage$").and.returnValue(observableThrowError(new Error()));

        const stateSpy: jasmine.Spy = spyOn(stateService, "setImages").and.stub();

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService,
                cacheService);

        const key: string = "key";

        navigator.moveTo$(key)
            .subscribe(
                (): void => { return; },
                (): void => { return; });

        expect(stateSpy.calls.count()).toBe(0);

        expect(stopLoadingSpy.calls.count()).toBe(1);
        expect(stopLoadingSpy.calls.first().args[0]).toBe("navigator");
    });

    it("should abort previous request when new request is done", (done: () => void) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graphService: GraphService = new GraphService(new Graph(api));
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService(State.Traversing);
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();
        spyOn(graphService, "cacheImage$").and.returnValue(new Subject<Image>());

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService,
                cacheService);

        navigator.moveTo$("key1")
            .subscribe(
                undefined,
                (e: Error): void => {
                    expect(e).toBeDefined();
                    expect(e instanceof CancelMapillaryError);
                    done();
                });

        navigator.moveTo$("key2");
    });

    it("should succeed when image is cached", (done: () => void) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graphService: GraphService = new GraphService(new Graph(api));
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService(State.Traversing);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        const key: string = "key";
        const sequenceKey: string = "sequenceId";
        const image: Image = new Image({
            computed_geometry: { lat: 0, lng: 0 },
            id: key,
            geometry: { lat: 0, lng: 0 },
            sequence: { id: sequenceKey },
        });

        spyOn(graphService, "cacheImage$").and.returnValue(observableOf<Image>(image));
        spyOn(stateService, "setImages").and.stub();

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService);

        navigator.moveTo$(key)
            .subscribe(
                (n: Image) => {
                    expect(n.id).toBe(image.id);
                    done();
                });
    });

    it("should succeed when image is not cached prior to call", (done: () => void) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graphService: GraphService = new GraphService(new Graph(api));
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService(State.Traversing);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        const key: string = "key";
        const sequenceKey: string = "sequenceId";
        const cacheImageSubject$: Subject<Image> = new Subject<Image>();
        const image: Image = new Image({
            computed_geometry: { lat: 0, lng: 0 },
            id: key,
            geometry: { lat: 0, lng: 0 },
            sequence: { id: sequenceKey },
        });

        spyOn(graphService, "cacheImage$").and.returnValue(cacheImageSubject$);
        spyOn(stateService, "setImages").and.stub();

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService);

        navigator.moveTo$(key)
            .subscribe(
                (n: Image) => {
                    expect(n.id).toBe(image.id);
                    done();
                });

        cacheImageSubject$.next(image);
    });

    describe("Navigator.moveToKey$", () => {
        it("should complete and not abort when another call is made in callback", () => {
            const clientId: string = "clientId";
            const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
            const graphService: GraphService = new GraphService(new Graph(api));
            const loadingService: LoadingService = new LoadingService();
            const stateService: StateService = new StateService(State.Traversing);
            const cacheService: CacheService = new CacheService(graphService, stateService);

            spyOn(loadingService, "startLoading").and.stub();
            spyOn(loadingService, "stopLoading").and.stub();

            const key: string = "key1";
            const sequenceKey: string = "sequenceId";
            const cacheImageSubject$: Subject<Image> = new Subject<Image>();
            const image: Image = new Image({
                computed_geometry: { lat: 0, lng: 0 },
                id: key,
                geometry: { lat: 0, lng: 0 },
                sequence: { id: sequenceKey },
            });

            spyOn(graphService, "cacheImage$").and.returnValue(cacheImageSubject$);
            spyOn(stateService, "setImages").and.stub();

            const navigator: Navigator =
                new Navigator(
                    { apiClient: "cl", container: "co" },
                    api,
                    graphService,
                    loadingService,
                    stateService,
                    cacheService);

            let successCount: number = 0;
            let errorCount: number = 0;
            let completeCount: number = 0;

            navigator.moveTo$(key)
                .subscribe(
                    (): void => {
                        navigator.moveTo$("key2").subscribe();
                        successCount++;
                    },
                    (): void => {
                        errorCount++;
                    },
                    (): void => {
                        completeCount++;
                    });

            cacheImageSubject$.next(image);

            expect(successCount).toBe(1);
            expect(errorCount).toBe(0);
            expect(completeCount).toBe(1);
        });
    });
});

describe("Navigator.movedToKey$", () => {
    it("should emit when move succeeds", (done: Function) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graphService: GraphService = new GraphService(new Graph(api));
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService(State.Traversing);
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        const key: string = "key";
        const sequenceKey: string = "sequenceId";
        spyOn(graphService, "cacheImage$").and.returnValue(observableOf<Image>(
            new Image({
                computed_geometry: { lat: 0, lng: 0 },
                id: key,
                geometry: { lat: 0, lng: 0 },
                sequence: { id: sequenceKey },
            })));

        spyOn(stateService, "setImages").and.stub();

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService,
                cacheService);

        navigator.movedToId$.pipe(
            first(
                (k: string): boolean => {
                    return k != null;
                }))
            .subscribe(
                (k: string): void => {
                    expect(k).toBe(key);

                    done();
                });

        navigator.moveTo$(key).subscribe(() => { /*noop*/ });
    });
});

class TestStateService extends StateService {
    private _overridingCurrentState$: Subject<AnimationFrame>;

    constructor(currentState$: Subject<AnimationFrame>) {
        super(State.Traversing);

        this._overridingCurrentState$ = currentState$;
    }

    public get currentState$(): Subject<AnimationFrame> {
        return this._overridingCurrentState$;
    }
}

describe("Navigator.setFilter$", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should set filter when no key requested", (done: Function) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService(State.Traversing);
        const cacheService: CacheService = new CacheService(graphService, stateService);

        const clearImagesSpy: jasmine.Spy = spyOn(stateService, "clearImages").and.stub();

        const setFilterSubject$: Subject<Graph> = new Subject<Graph>();
        const setFilterSpy: jasmine.Spy = spyOn(graphService, "setFilter$");
        setFilterSpy.and.returnValue(setFilterSubject$);

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService,
                cacheService);

        navigator.setFilter$(["==", "id", "value"])
            .subscribe(
                (): void => {
                    expect(clearImagesSpy.calls.count()).toBe(1);

                    expect(setFilterSpy.calls.count()).toBe(1);
                    expect(setFilterSpy.calls.first().args.length).toBe(1);
                    expect(setFilterSpy.calls.first().args[0].length).toBe(3);
                    expect(setFilterSpy.calls.first().args[0][0]).toBe("==");
                    expect(setFilterSpy.calls.first().args[0][1]).toBe("id");
                    expect(setFilterSpy.calls.first().args[0][2]).toBe("value");

                    done();
                });

        setFilterSubject$.next(graph);
        setFilterSubject$.complete();
    });

    it("should only set filter once when no key requested initially and key requested later", () => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService(State.Traversing);
        const cacheService: CacheService = new CacheService(graphService, stateService);

        const setFilterSpy: jasmine.Spy = spyOn(graphService, "setFilter$");
        setFilterSpy.and.returnValue(new Subject<Graph>());

        spyOn(stateService, "clearImages").and.stub();
        spyOn(loadingService, "startLoading").and.stub();
        spyOn(graphService, "cacheImage$").and.returnValue(new Subject<Image>());

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService,
                cacheService);

        navigator.setFilter$(["==", "id", "id-value"]).subscribe();

        // trigger key requested
        navigator.moveTo$("some-id").subscribe();

        expect(setFilterSpy.calls.count()).toBe(1);
    });

    it("should set filter and cache requested when key requested but not moved to", (done: Function) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService(State.Traversing);
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        const setImagesSpy: jasmine.Spy = spyOn(stateService, "setImages").and.stub();

        const clearImagesSpy: jasmine.Spy = spyOn(stateService, "clearImages").and.stub();

        const setFilterSubject$: Subject<Graph> = new Subject<Graph>();
        const setFilterSpy: jasmine.Spy = spyOn(graphService, "setFilter$");
        setFilterSpy.and.returnValue(setFilterSubject$);

        const cacheImageSubject$: Subject<Image> = new Subject<Image>();
        const cacheImageSpy: jasmine.Spy = spyOn(graphService, "cacheImage$");
        let firstEmit: boolean = true;
        cacheImageSpy.and.callFake(
            (): Observable<Image> => {
                if (firstEmit) {
                    firstEmit = false;
                    return new Subject<Image>();
                }

                return cacheImageSubject$;
            });

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService,
                cacheService);

        navigator.moveTo$("moveToKey").subscribe(() => { /*noop*/ });

        navigator.setFilter$(["==", "id", "value"])
            .subscribe(
                (): void => {
                    expect(setImagesSpy.calls.count()).toBe(0);

                    expect(clearImagesSpy.calls.count()).toBe(1);
                    expect(setFilterSpy.calls.count()).toBe(1);

                    expect(cacheImageSpy.calls.count()).toBe(2);
                    expect(cacheImageSpy.calls.mostRecent().args.length).toBe(1);
                    expect(cacheImageSpy.calls.mostRecent().args[0]).toBe("moveToKey");

                    done();
                });

        setFilterSubject$.next(graph);
        setFilterSubject$.complete();
        cacheImageSubject$.next(null);
        cacheImageSubject$.complete();
    });

    it("should set filter and cache trajectory keys when moved to", (done: Function) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);
        const loadingService: LoadingService = new LoadingService();

        const currentStateSubject$: Subject<AnimationFrame> = new Subject<AnimationFrame>();
        const stateService: TestStateService = new TestStateService(currentStateSubject$);
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(cacheService, "start").and.stub();

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();
        const setImagesSpy: jasmine.Spy = spyOn(stateService, "setImages").and.stub();

        const clearImagesSpy: jasmine.Spy = spyOn(stateService, "clearImages").and.stub();

        const setFilterSubject$: Subject<Graph> = new Subject<Graph>();
        const setFilterSpy: jasmine.Spy = spyOn(graphService, "setFilter$");
        setFilterSpy.and.returnValue(setFilterSubject$);

        const cacheImageSubject1$: Subject<Image> = new Subject<Image>();
        const cacheImageSubject2$: Subject<Image> = new Subject<Image>();
        const cacheImageSpy: jasmine.Spy = spyOn(graphService, "cacheImage$");
        let firstEmit: boolean = true;
        cacheImageSpy.and.callFake(
            (): Observable<Image> => {
                if (firstEmit) {
                    firstEmit = false;
                    return cacheImageSubject1$;
                }

                return cacheImageSubject2$;
            });

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService,
                cacheService);

        navigator.moveTo$("key").subscribe(() => { /*noop*/ });

        const coreImage0: CoreImageEnt = helper.createCoreImageEnt();
        coreImage0.id = "image0";
        const image0: Image = new Image(coreImage0);

        cacheImageSubject1$.next(image0);
        cacheImageSubject1$.complete();

        navigator.setFilter$(["==", "id", "value"])
            .subscribe(
                (): void => {
                    expect(setImagesSpy.calls.count()).toBe(1);

                    expect(clearImagesSpy.calls.count()).toBe(1);
                    expect(setFilterSpy.calls.count()).toBe(1);

                    expect(cacheImageSpy.calls.count()).toBe(3);
                    expect(cacheImageSpy.calls.argsFor(1)[0]).toBe("image1");
                    expect(cacheImageSpy.calls.argsFor(2)[0]).toBe("image2");

                    done();
                });

        const coreImage1: CoreImageEnt = helper.createCoreImageEnt();
        coreImage1.id = "image1";
        const image1: Image = new Image(coreImage1);

        const coreImage2: CoreImageEnt = helper.createCoreImageEnt();
        coreImage2.id = "image2";
        const image2: Image = new Image(coreImage2);

        const state: IAnimationState = createState();
        state.trajectory = [image1, image2];

        currentStateSubject$.next({ fps: 60, id: 0, state: state });
        currentStateSubject$.complete();
        setFilterSubject$.next(graph);
        setFilterSubject$.complete();
        cacheImageSubject2$.next(image1);
        cacheImageSubject2$.next(image2);
        cacheImageSubject2$.complete();
    });
});

describe("Navigator.setToken$", () => {
    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should set token on api and reset when not moved to key", (done: Function) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService(State.Traversing);
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(cacheService, "start").and.stub();

        const clearImagesSpy: jasmine.Spy = spyOn(stateService, "clearImages").and.stub();
        const setTokenSpy: jasmine.Spy = spyOn(api, "setUserToken").and.stub();

        const resetSubject$: Subject<Graph> = new Subject<Graph>();
        const resetSpy: jasmine.Spy = spyOn(graphService, "reset$");
        resetSpy.and.returnValue(resetSubject$);

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService,
                cacheService);

        navigator.setUserToken$("token")
            .subscribe(
                (): void => {
                    expect(clearImagesSpy.calls.count()).toBe(1);
                    expect(setTokenSpy.calls.count()).toBe(1);
                    expect(setTokenSpy.calls.first().args.length).toBe(1);
                    expect(setTokenSpy.calls.first().args[0]).toBe("token");

                    expect(resetSpy.calls.count()).toBe(1);
                    expect(resetSpy.calls.first().args.length).toBe(1);
                    expect(resetSpy.calls.first().args[0]).toEqual([]);

                    done();
                });

        resetSubject$.next(graph);
        resetSubject$.complete();
    });

    it("should set token, reset and cache trajectory keys when moved to", (done: Function) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);
        const loadingService: LoadingService = new LoadingService();

        const currentStateSubject$: Subject<AnimationFrame> = new Subject<AnimationFrame>();
        const stateService: TestStateService = new TestStateService(currentStateSubject$);
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(cacheService, "start").and.stub();

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();
        spyOn(stateService, "setImages").and.stub();

        const clearImagesSpy: jasmine.Spy = spyOn(stateService, "clearImages").and.stub();
        const setTokenSpy: jasmine.Spy = spyOn(api, "setUserToken").and.stub();

        const resetSubject$: Subject<Graph> = new Subject<Graph>();
        const resetSpy: jasmine.Spy = spyOn(graphService, "reset$");
        resetSpy.and.returnValue(resetSubject$);

        const cacheImageSubject1$: Subject<Image> = new Subject<Image>();
        const cacheImageSubject2$: Subject<Image> = new Subject<Image>();
        const cacheImageSpy: jasmine.Spy = spyOn(graphService, "cacheImage$");
        let firstEmit: boolean = true;
        cacheImageSpy.and.callFake(
            (): Observable<Image> => {
                if (firstEmit) {
                    firstEmit = false;
                    return cacheImageSubject1$;
                }

                return cacheImageSubject2$;
            });

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService,
                cacheService);

        navigator.moveTo$("key").subscribe(() => { /*noop*/ });

        const coreImage0: CoreImageEnt = helper.createCoreImageEnt();
        coreImage0.id = "image0";
        const image0: Image = new Image(coreImage0);

        cacheImageSubject1$.next(image0);
        cacheImageSubject1$.complete();

        navigator.setUserToken$("token")
            .subscribe(
                (): void => {
                    expect(clearImagesSpy.calls.count()).toBe(1);
                    expect(setTokenSpy.calls.count()).toBe(1);
                    expect(setTokenSpy.calls.first().args.length).toBe(1);
                    expect(setTokenSpy.calls.first().args[0]).toBe("token");

                    expect(resetSpy.calls.count()).toBe(1);
                    expect(resetSpy.calls.first().args.length).toBe(1);
                    expect(resetSpy.calls.first().args[0].length).toBe(2);
                    expect(resetSpy.calls.first().args[0][0]).toBe("image1");
                    expect(resetSpy.calls.first().args[0][1]).toBe("image2");

                    expect(cacheImageSpy.calls.count()).toBe(3);
                    expect(cacheImageSpy.calls.argsFor(1)[0]).toBe("image1");
                    expect(cacheImageSpy.calls.argsFor(2)[0]).toBe("image2");

                    done();
                });

        const coreImage1: CoreImageEnt = helper.createCoreImageEnt();
        coreImage1.id = "image1";
        const image1: Image = new Image(coreImage1);

        const coreImage2: CoreImageEnt = helper.createCoreImageEnt();
        coreImage2.id = "image2";
        const image2: Image = new Image(coreImage2);

        const state: IAnimationState = createState();
        state.trajectory = [image1, image2];

        currentStateSubject$.next({ fps: 60, id: 0, state: state });
        currentStateSubject$.complete();
        resetSubject$.next(graph);
        resetSubject$.complete();
        cacheImageSubject2$.next(image1);
        cacheImageSubject2$.next(image2);
        cacheImageSubject2$.complete();
    });

    it("should abort outstanding move to key request", (done: () => void) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graphService: GraphService = new GraphService(new Graph(api));
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService(State.Traversing);
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        spyOn(graphService, "cacheImage$").and.returnValue(new Subject<Image>());
        spyOn(stateService, "clearImages").and.stub();

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService,
                cacheService);

        navigator.moveTo$("key1")
            .subscribe(
                undefined,
                (e: Error): void => {
                    expect(e).toBeDefined();
                    expect(e instanceof CancelMapillaryError);
                    done();
                });

        navigator.setUserToken$(undefined);
    });

    it("should abort outstanding move dir request", (done: () => void) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graphService: GraphService = new GraphService(new Graph(api));
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateServiceMockCreator().create();
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService,
                cacheService);

        navigator.moveDir$(NavigationDirection.Next)
            .subscribe(
                undefined,
                (e: Error): void => {
                    expect(e).toBeDefined();
                    expect(e instanceof CancelMapillaryError);
                    done();
                });

        navigator.setUserToken$(undefined);
    });
});
