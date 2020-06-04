import {of as observableOf, throwError as observableThrowError, empty as observableEmpty, Observable, Subject} from "rxjs";

import {first} from "rxjs/operators";

import {NodeHelper} from "../helper/NodeHelper.spec";
import {StateServiceMockCreator} from "../helper/StateServiceMockCreator.spec";

import {
    APIv3,
    ICoreNode,
    IKey,
    IFullNode,
} from "../../src/API";
import {EdgeDirection} from "../../src/graph/edge/EdgeDirection";
import {AbortMapillaryError} from "../../src/Error";
import {
    Graph,
    GraphService,
    ImageLoadingService,
    Node,
} from "../../src/Graph";
import {
    ICurrentState,
    IFrame,
    StateService,
    State,
} from "../../src/State";
import {
    CacheService,
    LoadingService,
    Navigator,
} from "../../src/Viewer";

let createState: () => ICurrentState = (): ICurrentState => {
    return {
        alpha: 0,
        camera: null,
        currentCamera: null,
        currentIndex: 0,
        currentNode: null,
        currentTransform: null,
        lastNode: null,
        motionless: false,
        nodesAhead: 0,
        previousNode: null,
        previousTransform: null,
        reference: null,
        state: State.Traversing,
        trajectory: null,
        zoom: 0,
    };
};

describe("Navigator.ctor", () => {
    it("should be defined without optional params", () => {
        let navigator: Navigator = new Navigator("clientId", {});

        expect(navigator).toBeDefined();
    });

    it("should be defined with optional params", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        expect(navigator).toBeDefined();
    });
});

describe("Navigator.moveToKey$", () => {
    it("should start loading", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        let loadingSpy: jasmine.Spy = spyOn(loadingService, "startLoading").and.stub();

        spyOn(graphService, "cacheNode$").and.returnValue(observableEmpty());

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        let key: string = "key";

        navigator.moveToKey$(key);

        expect(loadingSpy.calls.count()).toBe(1);
        expect(loadingSpy.calls.first().args[0]).toBe("navigator");
    });

    it("should stop loading when succeeding", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        spyOn(loadingService, "startLoading").and.stub();
        let stopLoadingSpy: jasmine.Spy = spyOn(loadingService, "stopLoading").and.stub();

        let key: string = "key";
        let sequenceKey: string = "sequenceKey";
        spyOn(graphService, "cacheNode$").and.returnValue(observableOf<Node>(
            new Node({
                cl: { lat: 0, lon: 0 },
                key: key,
                l: { lat: 0, lon: 0 },
                sequence_key: sequenceKey,
            })));

        let stateSpy: jasmine.Spy = spyOn(stateService, "setNodes").and.stub();

        let navigator: Navigator =
            new Navigator(clientId, {}, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

        navigator.moveToKey$(key).subscribe(() => { /*noop*/ });

        expect(stateSpy.calls.count()).toBe(1);

        expect(stopLoadingSpy.calls.count()).toBe(1);
        expect(stopLoadingSpy.calls.first().args[0]).toBe("navigator");
    });

    it("should stop loading when error is thrown", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        let stopLoadingSpy: jasmine.Spy = spyOn(loadingService, "stopLoading").and.stub();

        spyOn(graphService, "cacheNode$").and.returnValue(observableThrowError(new Error()));

        let stateSpy: jasmine.Spy = spyOn(stateService, "setNodes").and.stub();

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        let key: string = "key";

        navigator.moveToKey$(key)
            .subscribe(
                (n: Node): void => { return; },
                (e: Error): void => { return; });

        expect(stateSpy.calls.count()).toBe(0);

        expect(stopLoadingSpy.calls.count()).toBe(1);
        expect(stopLoadingSpy.calls.first().args[0]).toBe("navigator");
    });

    it("should abort previous request when new request is done", (done: () => void) => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();
        spyOn(graphService, "cacheNode$").and.returnValue(new Subject<Node>());

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        navigator.moveToKey$("key1")
            .subscribe(
                undefined,
                (e: Error): void => {
                    expect(e).toBeDefined();
                    expect(e instanceof AbortMapillaryError);
                    done();
                });

        navigator.moveToKey$("key2");
    });

    it("should succeed when node is cached", (done: () => void) => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        let key: string = "key";
        let sequenceKey: string = "sequenceKey";
        let node: Node = new Node({
            cl: { lat: 0, lon: 0 },
            key: key,
            l: { lat: 0, lon: 0 },
            sequence_key: sequenceKey,
        });

        spyOn(graphService, "cacheNode$").and.returnValue(observableOf<Node>(node));
        spyOn(stateService, "setNodes").and.stub();

        let navigator: Navigator =
            new Navigator(clientId, {}, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

        navigator.moveToKey$(key)
            .subscribe(
                (n: Node) => {
                    expect(n.key).toBe(node.key);
                    done();
                });
    });

    it("should succeed when node is not cached prior to call", (done: () => void) => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        let key: string = "key";
        let sequenceKey: string = "sequenceKey";
        let cacheNodeSubject$: Subject<Node> = new Subject<Node>();
        let node: Node = new Node({
            cl: { lat: 0, lon: 0 },
            key: key,
            l: { lat: 0, lon: 0 },
            sequence_key: sequenceKey,
        });

        spyOn(graphService, "cacheNode$").and.returnValue(cacheNodeSubject$);
        spyOn(stateService, "setNodes").and.stub();

        let navigator: Navigator =
            new Navigator(clientId, {}, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

        navigator.moveToKey$(key)
            .subscribe(
                (n: Node) => {
                    expect(n.key).toBe(node.key);
                    done();
                });

        cacheNodeSubject$.next(node);
    });

    describe("Navigator.moveToKey$", () => {
        it("should complete and not abort when another call is made in callback", () => {
            let clientId: string = "clientId";
            let apiV3: APIv3 = new APIv3(clientId);
            let imageLoadingService: ImageLoadingService = new ImageLoadingService();
            let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
            let loadingService: LoadingService = new LoadingService();
            let stateService: StateService = new StateService();
            let cacheService: CacheService = new CacheService(graphService, stateService);

            spyOn(loadingService, "startLoading").and.stub();
            spyOn(loadingService, "stopLoading").and.stub();

            let key: string = "key1";
            let sequenceKey: string = "sequenceKey";
            let cacheNodeSubject$: Subject<Node> = new Subject<Node>();
            let node: Node = new Node({
                cl: { lat: 0, lon: 0 },
                key: key,
                l: { lat: 0, lon: 0 },
                sequence_key: sequenceKey,
            });

            spyOn(graphService, "cacheNode$").and.returnValue(cacheNodeSubject$);
            spyOn(stateService, "setNodes").and.stub();

            let navigator: Navigator =
                new Navigator(
                    clientId,
                    {},
                    undefined,
                    apiV3,
                    graphService,
                    imageLoadingService,
                    loadingService,
                    stateService,
                    cacheService);

            let successCount: number = 0;
            let errorCount: number = 0;
            let completeCount: number = 0;

            navigator.moveToKey$(key)
                .subscribe(
                    (): void => {
                        navigator.moveToKey$("key2").subscribe();
                        successCount++;
                    },
                    (): void => {
                        errorCount++;
                    },
                    (): void => {
                        completeCount++;
                    });

            cacheNodeSubject$.next(node);

            expect(successCount).toBe(1);
            expect(errorCount).toBe(0);
            expect(completeCount).toBe(1);
        });
    });
});

describe("Navigator.movedToKey$", () => {
    it("should emit when move succeeds", (done: Function) => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        let key: string = "key";
        let sequenceKey: string = "sequenceKey";
        spyOn(graphService, "cacheNode$").and.returnValue(observableOf<Node>(
            new Node({
                cl: { lat: 0, lon: 0 },
                key: key,
                l: { lat: 0, lon: 0 },
                sequence_key: sequenceKey,
            })));

        spyOn(stateService, "setNodes").and.stub();

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        navigator.movedToKey$.pipe(
            first(
                (k: string): boolean => {
                    return k != null;
                }))
            .subscribe(
                (k: string): void => {
                    expect(k).toBe(key);

                    done();
                });

        navigator.moveToKey$(key).subscribe(() => { /*noop*/ });
    });
});

describe("Navigator.moveCloseTo$", () => {
    it("should start loading", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        let startLoadingSpy: jasmine.Spy = spyOn(loadingService, "startLoading").and.stub();

        spyOn(apiV3, "imageCloseTo$").and.returnValue(observableEmpty());

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        let lat: number = 0;
        let lon: number = 0;

        navigator.moveCloseTo$(lat, lon).subscribe(() => { /*noop*/ });

        expect(startLoadingSpy.calls.count()).toBe(1);
        expect(startLoadingSpy.calls.first().args[0]).toBe("navigator");
    });

    it("should call cacheNode$ when succeding", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();

        let key: string = "key";
        spyOn(apiV3, "imageCloseTo$").and.returnValue(observableOf<IFullNode>(<IFullNode>{ key: key }));

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        let cacheSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        cacheSpy.and.returnValue(observableEmpty());

        let lat: number = 0;
        let lon: number = 0;

        navigator.moveCloseTo$(lat, lon).subscribe(() => { /*noop*/ });

        expect(cacheSpy.calls.count()).toBe(1);
        expect(cacheSpy.calls.first().args[0]).toBe(key);
    });

    it("should stop loading and throw when failing", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        let stopLoadingSpy: jasmine.Spy = spyOn(loadingService, "stopLoading").and.stub();

        spyOn(apiV3, "imageCloseTo$").and.returnValue(observableOf<IFullNode>(null));

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        let moveSpy: jasmine.Spy = spyOn(navigator, "moveToKey$");
        moveSpy.and.returnValue(observableEmpty());

        let lat: number = 0;
        let lon: number = 0;

        navigator.moveCloseTo$(lat, lon)
            .subscribe(
                (n: Node): void => { return; },
                (e: Error): void => { return; });

        expect(stopLoadingSpy.calls.count()).toBe(1);
        expect(stopLoadingSpy.calls.first().args[0]).toBe("navigator");

        expect(moveSpy.calls.count()).toBe(0);
    });

    it("should abort previous request when new request is done", (done: () => void) => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(apiV3, "imageCloseTo$").and.returnValue(new Subject<IFullNode>());

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        let lat: number = 0;
        let lon: number = 0;

        navigator.moveCloseTo$(lat, lon)
            .subscribe(
                undefined,
                (e: Error): void => {
                    expect(e).toBeDefined();
                    expect(e instanceof AbortMapillaryError);
                    done();
                });

        navigator.moveCloseTo$(lat, lon);
    });
});

class TestStateService extends StateService {
    private _overridingCurrentState$: Subject<IFrame>;

    constructor(currentState$: Subject<IFrame>) {
        super();

        this._overridingCurrentState$ = currentState$;
    }

    public get currentState$(): Subject<IFrame> {
        return this._overridingCurrentState$;
    }
}

describe("Navigator.setFilter$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should set filter when no key requested", (done: Function) => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graph: Graph = new Graph(apiV3);
        let graphService: GraphService = new GraphService(graph, imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        let clearNodesSpy: jasmine.Spy = spyOn(stateService, "clearNodes").and.stub();

        let setFilterSubject$: Subject<Graph> = new Subject<Graph>();
        let setFilterSpy: jasmine.Spy = spyOn(graphService, "setFilter$");
        setFilterSpy.and.returnValue(setFilterSubject$);

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        navigator.setFilter$(["==", "key", "value"])
            .subscribe(
                (): void => {
                    expect(clearNodesSpy.calls.count()).toBe(1);

                    expect(setFilterSpy.calls.count()).toBe(1);
                    expect(setFilterSpy.calls.first().args.length).toBe(1);
                    expect(setFilterSpy.calls.first().args[0].length).toBe(3);
                    expect(setFilterSpy.calls.first().args[0][0]).toBe("==");
                    expect(setFilterSpy.calls.first().args[0][1]).toBe("key");
                    expect(setFilterSpy.calls.first().args[0][2]).toBe("value");

                    done();
                });

        setFilterSubject$.next(graph);
        setFilterSubject$.complete();
    });

    it("should only set filter once when no key requested initially and key requested later", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graph: Graph = new Graph(apiV3);
        let graphService: GraphService = new GraphService(graph, imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        let setFilterSpy: jasmine.Spy = spyOn(graphService, "setFilter$");
        setFilterSpy.and.returnValue(new Subject<Graph>());

        spyOn(stateService, "clearNodes").and.stub();
        spyOn(loadingService, "startLoading").and.stub();
        spyOn(graphService, "cacheNode$").and.returnValue(new Subject<Node>());

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        navigator.setFilter$(["==", "key", "value"]).subscribe();

        // trigger key requested
        navigator.moveToKey$("key").subscribe();

        expect(setFilterSpy.calls.count()).toBe(1);
    });

    it("should set filter and cache requested when key requested but not moved to", (done: Function) => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graph: Graph = new Graph(apiV3);
        let graphService: GraphService = new GraphService(graph, imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        let setNodesSpy: jasmine.Spy = spyOn(stateService, "setNodes").and.stub();

        let clearNodesSpy: jasmine.Spy = spyOn(stateService, "clearNodes").and.stub();

        let setFilterSubject$: Subject<Graph> = new Subject<Graph>();
        let setFilterSpy: jasmine.Spy = spyOn(graphService, "setFilter$");
        setFilterSpy.and.returnValue(setFilterSubject$);

        let cacheNodeSubject$: Subject<Node> = new Subject<Node>();
        let cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        let firstEmit: boolean = true;
        cacheNodeSpy.and.callFake(
            (key: string): Observable<Node> => {
                if (firstEmit) {
                    firstEmit = false;
                    return new Subject<Node>();
                }

                return cacheNodeSubject$;
            });

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        navigator.moveToKey$("moveToKey").subscribe(() => { /*noop*/ });

        navigator.setFilter$(["==", "key", "value"])
            .subscribe(
                (): void => {
                    expect(setNodesSpy.calls.count()).toBe(0);

                    expect(clearNodesSpy.calls.count()).toBe(1);
                    expect(setFilterSpy.calls.count()).toBe(1);

                    expect(cacheNodeSpy.calls.count()).toBe(2);
                    expect(cacheNodeSpy.calls.mostRecent().args.length).toBe(1);
                    expect(cacheNodeSpy.calls.mostRecent().args[0]).toBe("moveToKey");

                    done();
                });

        setFilterSubject$.next(graph);
        setFilterSubject$.complete();
        cacheNodeSubject$.next(null);
        cacheNodeSubject$.complete();
    });

    it("should set filter and cache trajectory keys when moved to", (done: Function) => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graph: Graph = new Graph(apiV3);
        let graphService: GraphService = new GraphService(graph, imageLoadingService);
        let loadingService: LoadingService = new LoadingService();

        let currentStateSubject$: Subject<IFrame> = new Subject<IFrame>();
        let stateService: TestStateService = new TestStateService(currentStateSubject$);
        let cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(cacheService, "start").and.stub();

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();
        let setNodesSpy: jasmine.Spy = spyOn(stateService, "setNodes").and.stub();

        let clearNodesSpy: jasmine.Spy = spyOn(stateService, "clearNodes").and.stub();

        let setFilterSubject$: Subject<Graph> = new Subject<Graph>();
        let setFilterSpy: jasmine.Spy = spyOn(graphService, "setFilter$");
        setFilterSpy.and.returnValue(setFilterSubject$);

        let cacheNodeSubject1$: Subject<Node> = new Subject<Node>();
        let cacheNodeSubject2$: Subject<Node> = new Subject<Node>();
        let cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        let firstEmit: boolean = true;
        cacheNodeSpy.and.callFake(
            (key: string): Observable<Node> => {
                if (firstEmit) {
                    firstEmit = false;
                    return cacheNodeSubject1$;
                }

                return cacheNodeSubject2$;
            });

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        navigator.moveToKey$("key").subscribe(() => { /*noop*/ });

        let coreNode0: ICoreNode = helper.createCoreNode();
        coreNode0.key = "node0";
        let node0: Node = new Node(coreNode0);

        cacheNodeSubject1$.next(node0);
        cacheNodeSubject1$.complete();

        navigator.setFilter$(["==", "key", "value"])
            .subscribe(
                (): void => {
                    expect(setNodesSpy.calls.count()).toBe(1);

                    expect(clearNodesSpy.calls.count()).toBe(1);
                    expect(setFilterSpy.calls.count()).toBe(1);

                    expect(cacheNodeSpy.calls.count()).toBe(3);
                    expect(cacheNodeSpy.calls.argsFor(1)[0]).toBe("node1");
                    expect(cacheNodeSpy.calls.argsFor(2)[0]).toBe("node2");

                    done();
                });

        let coreNode1: ICoreNode = helper.createCoreNode();
        coreNode1.key = "node1";
        let node1: Node = new Node(coreNode1);

        let coreNode2: ICoreNode = helper.createCoreNode();
        coreNode2.key = "node2";
        let node2: Node = new Node(coreNode2);

        let state: ICurrentState = createState();
        state.trajectory = [node1, node2];

        currentStateSubject$.next({ fps: 60, id: 0, state: state });
        currentStateSubject$.complete();
        setFilterSubject$.next(graph);
        setFilterSubject$.complete();
        cacheNodeSubject2$.next(node1);
        cacheNodeSubject2$.next(node2);
        cacheNodeSubject2$.complete();
    });
});

describe("Navigator.setToken$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should set token on api and reset when not moved to key", (done: Function) => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graph: Graph = new Graph(apiV3);
        let graphService: GraphService = new GraphService(graph, imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(cacheService, "start").and.stub();

        let clearNodesSpy: jasmine.Spy = spyOn(stateService, "clearNodes").and.stub();
        let setTokenSpy: jasmine.Spy = spyOn(apiV3, "setToken").and.stub();

        let resetSubject$: Subject<Graph> = new Subject<Graph>();
        let resetSpy: jasmine.Spy = spyOn(graphService, "reset$");
        resetSpy.and.returnValue(resetSubject$);

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        navigator.setToken$("token")
            .subscribe(
                (): void => {
                    expect(clearNodesSpy.calls.count()).toBe(1);
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
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graph: Graph = new Graph(apiV3);
        let graphService: GraphService = new GraphService(graph, imageLoadingService);
        let loadingService: LoadingService = new LoadingService();

        let currentStateSubject$: Subject<IFrame> = new Subject<IFrame>();
        let stateService: TestStateService = new TestStateService(currentStateSubject$);
        let cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(cacheService, "start").and.stub();

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();
        spyOn(stateService, "setNodes").and.stub();

        let clearNodesSpy: jasmine.Spy = spyOn(stateService, "clearNodes").and.stub();
        let setTokenSpy: jasmine.Spy = spyOn(apiV3, "setToken").and.stub();

        let resetSubject$: Subject<Graph> = new Subject<Graph>();
        let resetSpy: jasmine.Spy = spyOn(graphService, "reset$");
        resetSpy.and.returnValue(resetSubject$);

        let cacheNodeSubject1$: Subject<Node> = new Subject<Node>();
        let cacheNodeSubject2$: Subject<Node> = new Subject<Node>();
        let cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        let firstEmit: boolean = true;
        cacheNodeSpy.and.callFake(
            (key: string): Observable<Node> => {
                if (firstEmit) {
                    firstEmit = false;
                    return cacheNodeSubject1$;
                }

                return cacheNodeSubject2$;
            });

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        navigator.moveToKey$("key").subscribe(() => { /*noop*/ });

        let coreNode0: ICoreNode = helper.createCoreNode();
        coreNode0.key = "node0";
        let node0: Node = new Node(coreNode0);

        cacheNodeSubject1$.next(node0);
        cacheNodeSubject1$.complete();

        navigator.setToken$("token")
            .subscribe(
                (): void => {
                    expect(clearNodesSpy.calls.count()).toBe(1);
                    expect(setTokenSpy.calls.count()).toBe(1);
                    expect(setTokenSpy.calls.first().args.length).toBe(1);
                    expect(setTokenSpy.calls.first().args[0]).toBe("token");

                    expect(resetSpy.calls.count()).toBe(1);
                    expect(resetSpy.calls.first().args.length).toBe(1);
                    expect(resetSpy.calls.first().args[0].length).toBe(2);
                    expect(resetSpy.calls.first().args[0][0]).toBe("node1");
                    expect(resetSpy.calls.first().args[0][1]).toBe("node2");

                    expect(cacheNodeSpy.calls.count()).toBe(3);
                    expect(cacheNodeSpy.calls.argsFor(1)[0]).toBe("node1");
                    expect(cacheNodeSpy.calls.argsFor(2)[0]).toBe("node2");

                    done();
                });

        let coreNode1: ICoreNode = helper.createCoreNode();
        coreNode1.key = "node1";
        let node1: Node = new Node(coreNode1);

        let coreNode2: ICoreNode = helper.createCoreNode();
        coreNode2.key = "node2";
        let node2: Node = new Node(coreNode2);

        let state: ICurrentState = createState();
        state.trajectory = [node1, node2];

        currentStateSubject$.next({ fps: 60, id: 0, state: state });
        currentStateSubject$.complete();
        resetSubject$.next(graph);
        resetSubject$.complete();
        cacheNodeSubject2$.next(node1);
        cacheNodeSubject2$.next(node2);
        cacheNodeSubject2$.complete();
    });

    it("should abort outstanding move to key request", (done: () => void) => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        spyOn(graphService, "cacheNode$").and.returnValue(new Subject<Node>());
        spyOn(apiV3, "imageCloseTo$").and.returnValue(new Subject<IFullNode>());

        spyOn(stateService, "clearNodes").and.stub();

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        navigator.moveToKey$("key1")
            .subscribe(
                undefined,
                (e: Error): void => {
                    expect(e).toBeDefined();
                    expect(e instanceof AbortMapillaryError);
                    done();
                });

        navigator.setToken$(undefined);
    });

    it("should abort outstanding move close to request", (done: () => void) => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        spyOn(apiV3, "imageCloseTo$").and.returnValue(new Subject<IFullNode>());

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        navigator.moveCloseTo$(0, 0)
            .subscribe(
                undefined,
                (e: Error): void => {
                    expect(e).toBeDefined();
                    expect(e instanceof AbortMapillaryError);
                    done();
                });

        navigator.setToken$(undefined);
    });

    it("should abort outstanding move dir request", (done: () => void) => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateServiceMockCreator().create();
        let cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        let navigator: Navigator =
            new Navigator(
                clientId,
                {},
                undefined,
                apiV3,
                graphService,
                imageLoadingService,
                loadingService,
                stateService,
                cacheService);

        navigator.moveDir$(EdgeDirection.Next)
            .subscribe(
                undefined,
                (e: Error): void => {
                    expect(e).toBeDefined();
                    expect(e instanceof AbortMapillaryError);
                    done();
                });

        navigator.setToken$(undefined);
    });
});
