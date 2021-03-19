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

import { NodeHelper } from "../helper/NodeHelper";
import { StateServiceMockCreator } from "../helper/StateServiceMockCreator";

import { Navigator } from "../../src/viewer/Navigator";
import { Node } from "../../src/graph/Node";
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
import { AbortMapillaryError } from "../../src/error/AbortMapillaryError";
import { NavigationDirection } from "../../src/graph/edge/NavigationDirection";

const createState: () => IAnimationState = (): IAnimationState => {
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
        const stateService: StateService = new StateService();
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
        const stateService: StateService = new StateService();
        const cacheService: CacheService = new CacheService(graphService, stateService);

        const loadingSpy: jasmine.Spy = spyOn(loadingService, "startLoading").and.stub();

        spyOn(graphService, "cacheNode$").and.returnValue(observableEmpty());

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
        const stateService: StateService = new StateService();

        spyOn(loadingService, "startLoading").and.stub();
        const stopLoadingSpy: jasmine.Spy = spyOn(loadingService, "stopLoading").and.stub();

        const key: string = "key";
        const sequenceKey: string = "sequenceKey";
        spyOn(graphService, "cacheNode$").and.returnValue(observableOf<Node>(
            new Node({
                computed_geometry: { lat: 0, lon: 0 },
                id: key,
                geometry: { lat: 0, lon: 0 },
                sequence: { id: sequenceKey },
            })));

        const stateSpy: jasmine.Spy = spyOn(stateService, "setNodes").and.stub();

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
        const stateService: StateService = new StateService();
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        const stopLoadingSpy: jasmine.Spy = spyOn(loadingService, "stopLoading").and.stub();

        spyOn(graphService, "cacheNode$").and.returnValue(observableThrowError(new Error()));

        const stateSpy: jasmine.Spy = spyOn(stateService, "setNodes").and.stub();

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
        const stateService: StateService = new StateService();
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();
        spyOn(graphService, "cacheNode$").and.returnValue(new Subject<Node>());

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
                    expect(e instanceof AbortMapillaryError);
                    done();
                });

        navigator.moveTo$("key2");
    });

    it("should succeed when node is cached", (done: () => void) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graphService: GraphService = new GraphService(new Graph(api));
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService();

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        const key: string = "key";
        const sequenceKey: string = "sequenceKey";
        const node: Node = new Node({
            computed_geometry: { lat: 0, lon: 0 },
            id: key,
            geometry: { lat: 0, lon: 0 },
            sequence: { id: sequenceKey },
        });

        spyOn(graphService, "cacheNode$").and.returnValue(observableOf<Node>(node));
        spyOn(stateService, "setNodes").and.stub();

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService);

        navigator.moveTo$(key)
            .subscribe(
                (n: Node) => {
                    expect(n.id).toBe(node.id);
                    done();
                });
    });

    it("should succeed when node is not cached prior to call", (done: () => void) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graphService: GraphService = new GraphService(new Graph(api));
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService();

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        const key: string = "key";
        const sequenceKey: string = "sequenceKey";
        const cacheNodeSubject$: Subject<Node> = new Subject<Node>();
        const node: Node = new Node({
            computed_geometry: { lat: 0, lon: 0 },
            id: key,
            geometry: { lat: 0, lon: 0 },
            sequence: { id: sequenceKey },
        });

        spyOn(graphService, "cacheNode$").and.returnValue(cacheNodeSubject$);
        spyOn(stateService, "setNodes").and.stub();

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService);

        navigator.moveTo$(key)
            .subscribe(
                (n: Node) => {
                    expect(n.id).toBe(node.id);
                    done();
                });

        cacheNodeSubject$.next(node);
    });

    describe("Navigator.moveToKey$", () => {
        it("should complete and not abort when another call is made in callback", () => {
            const clientId: string = "clientId";
            const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
            const graphService: GraphService = new GraphService(new Graph(api));
            const loadingService: LoadingService = new LoadingService();
            const stateService: StateService = new StateService();
            const cacheService: CacheService = new CacheService(graphService, stateService);

            spyOn(loadingService, "startLoading").and.stub();
            spyOn(loadingService, "stopLoading").and.stub();

            const key: string = "key1";
            const sequenceKey: string = "sequenceKey";
            const cacheNodeSubject$: Subject<Node> = new Subject<Node>();
            const node: Node = new Node({
                computed_geometry: { lat: 0, lon: 0 },
                id: key,
                geometry: { lat: 0, lon: 0 },
                sequence: { id: sequenceKey },
            });

            spyOn(graphService, "cacheNode$").and.returnValue(cacheNodeSubject$);
            spyOn(stateService, "setNodes").and.stub();

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

            cacheNodeSubject$.next(node);

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
        const stateService: StateService = new StateService();
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        const key: string = "key";
        const sequenceKey: string = "sequenceKey";
        spyOn(graphService, "cacheNode$").and.returnValue(observableOf<Node>(
            new Node({
                computed_geometry: { lat: 0, lon: 0 },
                id: key,
                geometry: { lat: 0, lon: 0 },
                sequence: { id: sequenceKey },
            })));

        spyOn(stateService, "setNodes").and.stub();

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
        super();

        this._overridingCurrentState$ = currentState$;
    }

    public get currentState$(): Subject<AnimationFrame> {
        return this._overridingCurrentState$;
    }
}

describe("Navigator.setFilter$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should set filter when no key requested", (done: Function) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService();
        const cacheService: CacheService = new CacheService(graphService, stateService);

        const clearNodesSpy: jasmine.Spy = spyOn(stateService, "clearNodes").and.stub();

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
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService();
        const cacheService: CacheService = new CacheService(graphService, stateService);

        const setFilterSpy: jasmine.Spy = spyOn(graphService, "setFilter$");
        setFilterSpy.and.returnValue(new Subject<Graph>());

        spyOn(stateService, "clearNodes").and.stub();
        spyOn(loadingService, "startLoading").and.stub();
        spyOn(graphService, "cacheNode$").and.returnValue(new Subject<Node>());

        const navigator: Navigator =
            new Navigator(
                { apiClient: "cl", container: "co" },
                api,
                graphService,
                loadingService,
                stateService,
                cacheService);

        navigator.setFilter$(["==", "key", "value"]).subscribe();

        // trigger key requested
        navigator.moveTo$("key").subscribe();

        expect(setFilterSpy.calls.count()).toBe(1);
    });

    it("should set filter and cache requested when key requested but not moved to", (done: Function) => {
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService();
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        const setNodesSpy: jasmine.Spy = spyOn(stateService, "setNodes").and.stub();

        const clearNodesSpy: jasmine.Spy = spyOn(stateService, "clearNodes").and.stub();

        const setFilterSubject$: Subject<Graph> = new Subject<Graph>();
        const setFilterSpy: jasmine.Spy = spyOn(graphService, "setFilter$");
        setFilterSpy.and.returnValue(setFilterSubject$);

        const cacheNodeSubject$: Subject<Node> = new Subject<Node>();
        const cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        let firstEmit: boolean = true;
        cacheNodeSpy.and.callFake(
            (): Observable<Node> => {
                if (firstEmit) {
                    firstEmit = false;
                    return new Subject<Node>();
                }

                return cacheNodeSubject$;
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
        const setNodesSpy: jasmine.Spy = spyOn(stateService, "setNodes").and.stub();

        const clearNodesSpy: jasmine.Spy = spyOn(stateService, "clearNodes").and.stub();

        const setFilterSubject$: Subject<Graph> = new Subject<Graph>();
        const setFilterSpy: jasmine.Spy = spyOn(graphService, "setFilter$");
        setFilterSpy.and.returnValue(setFilterSubject$);

        const cacheNodeSubject1$: Subject<Node> = new Subject<Node>();
        const cacheNodeSubject2$: Subject<Node> = new Subject<Node>();
        const cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        let firstEmit: boolean = true;
        cacheNodeSpy.and.callFake(
            (): Observable<Node> => {
                if (firstEmit) {
                    firstEmit = false;
                    return cacheNodeSubject1$;
                }

                return cacheNodeSubject2$;
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

        const coreNode0: CoreImageEnt = helper.createCoreNode();
        coreNode0.id = "node0";
        const node0: Node = new Node(coreNode0);

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

        const coreNode1: CoreImageEnt = helper.createCoreNode();
        coreNode1.id = "node1";
        const node1: Node = new Node(coreNode1);

        const coreNode2: CoreImageEnt = helper.createCoreNode();
        coreNode2.id = "node2";
        const node2: Node = new Node(coreNode2);

        const state: IAnimationState = createState();
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
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService();
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(cacheService, "start").and.stub();

        const clearNodesSpy: jasmine.Spy = spyOn(stateService, "clearNodes").and.stub();
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
        spyOn(stateService, "setNodes").and.stub();

        const clearNodesSpy: jasmine.Spy = spyOn(stateService, "clearNodes").and.stub();
        const setTokenSpy: jasmine.Spy = spyOn(api, "setUserToken").and.stub();

        const resetSubject$: Subject<Graph> = new Subject<Graph>();
        const resetSpy: jasmine.Spy = spyOn(graphService, "reset$");
        resetSpy.and.returnValue(resetSubject$);

        const cacheNodeSubject1$: Subject<Node> = new Subject<Node>();
        const cacheNodeSubject2$: Subject<Node> = new Subject<Node>();
        const cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        let firstEmit: boolean = true;
        cacheNodeSpy.and.callFake(
            (): Observable<Node> => {
                if (firstEmit) {
                    firstEmit = false;
                    return cacheNodeSubject1$;
                }

                return cacheNodeSubject2$;
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

        const coreNode0: CoreImageEnt = helper.createCoreNode();
        coreNode0.id = "node0";
        const node0: Node = new Node(coreNode0);

        cacheNodeSubject1$.next(node0);
        cacheNodeSubject1$.complete();

        navigator.setUserToken$("token")
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

        const coreNode1: CoreImageEnt = helper.createCoreNode();
        coreNode1.id = "node1";
        const node1: Node = new Node(coreNode1);

        const coreNode2: CoreImageEnt = helper.createCoreNode();
        coreNode2.id = "node2";
        const node2: Node = new Node(coreNode2);

        const state: IAnimationState = createState();
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
        const clientId: string = "clientId";
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider(({ clientToken: clientId })));
        const graphService: GraphService = new GraphService(new Graph(api));
        const loadingService: LoadingService = new LoadingService();
        const stateService: StateService = new StateService();
        const cacheService: CacheService = new CacheService(graphService, stateService);

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        spyOn(graphService, "cacheNode$").and.returnValue(new Subject<Node>());
        spyOn(stateService, "clearNodes").and.stub();

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
                    expect(e instanceof AbortMapillaryError);
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
                    expect(e instanceof AbortMapillaryError);
                    done();
                });

        navigator.setUserToken$(undefined);
    });
});
