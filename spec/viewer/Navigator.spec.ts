/// <reference path="../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {NodeHelper} from "../helper/NodeHelper.spec";

import {
    APIv3,
    ICoreNode,
    IKey,
} from "../../src/API";
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
} from "../../src/State";
import {
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
        trajectory: null,
        zoom: 0,
    };
};

describe("Navigator.ctor", () => {
    it("should be defined without optional params", () => {
        let navigator: Navigator = new Navigator("clientId");

        expect(navigator).toBeDefined();
    });

    it("should be defined with optional params", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        let navigator: Navigator =
            new Navigator(clientId, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

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

        let loadingSpy: jasmine.Spy = spyOn(loadingService, "startLoading").and.stub();

        spyOn(graphService, "cacheNode$").and.returnValue(Observable.empty<Node>());

        let navigator: Navigator =
            new Navigator(clientId, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

        let key: string = "key";

        navigator.moveToKey$(key);

        expect(loadingSpy.calls.count()).toBe(1);
        expect(loadingSpy.calls.first().args[0]).toBe("navigator");
    });

    it("should stop loading when succeding", () => {
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
        spyOn(graphService, "cacheNode$").and.returnValue(Observable.of<Node>(
            new Node({
                cl: { lat: 0, lon: 0 },
                key: key,
                l: { lat: 0, lon: 0 },
                sequence: { key: sequenceKey },
            })));

        let stateSpy: jasmine.Spy = spyOn(stateService, "setNodes").and.stub();

        let navigator: Navigator =
            new Navigator(clientId, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

        navigator.moveToKey$(key).subscribe();

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

        spyOn(loadingService, "startLoading").and.stub();
        let stopLoadingSpy: jasmine.Spy = spyOn(loadingService, "stopLoading").and.stub();

        spyOn(graphService, "cacheNode$").and.returnValue(Observable.throw(new Error()));

        let stateSpy: jasmine.Spy = spyOn(stateService, "setNodes").and.stub();

        let navigator: Navigator =
            new Navigator(clientId, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

        let key: string = "key";

        navigator.moveToKey$(key)
            .subscribe(
                (n: Node): void => { return; },
                (e: Error): void => { return; });

        expect(stateSpy.calls.count()).toBe(0);

        expect(stopLoadingSpy.calls.count()).toBe(1);
        expect(stopLoadingSpy.calls.first().args[0]).toBe("navigator");
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

        spyOn(loadingService, "startLoading").and.stub();
        spyOn(loadingService, "stopLoading").and.stub();

        let key: string = "key";
        let sequenceKey: string = "sequenceKey";
        spyOn(graphService, "cacheNode$").and.returnValue(Observable.of<Node>(
            new Node({
                cl: { lat: 0, lon: 0 },
                key: key,
                l: { lat: 0, lon: 0 },
                sequence: { key: sequenceKey },
            })));

        spyOn(stateService, "setNodes").and.stub();

        let navigator: Navigator =
            new Navigator(clientId, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

        navigator.movedToKey$
            .first(
                (k: string): boolean => {
                    return k != null;
                })
            .subscribe(
                (k: string): void => {
                    expect(k).toBe(key);

                    done();
                });

        navigator.moveToKey$(key).subscribe();
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

        let startLoadingSpy: jasmine.Spy = spyOn(loadingService, "startLoading").and.stub();

        spyOn(apiV3, "imageCloseTo$").and.returnValue(Observable.empty<IKey>());

        let navigator: Navigator =
            new Navigator(clientId, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

        let lat: number = 0;
        let lon: number = 0;

        navigator.moveCloseTo$(lat, lon).subscribe();

        expect(startLoadingSpy.calls.count()).toBe(1);
        expect(startLoadingSpy.calls.first().args[0]).toBe("navigator");
    });

    it("should call moveToKey$ when succeding", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        spyOn(loadingService, "startLoading").and.stub();

        let key: string = "key";
        spyOn(apiV3, "imageCloseTo$").and.returnValue(Observable.of<IKey>({ key: key }));

        let navigator: Navigator =
            new Navigator(clientId, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

        let moveSpy: jasmine.Spy = spyOn(navigator, "moveToKey$");
        moveSpy.and.returnValue(Observable.empty<Node>());

        let lat: number = 0;
        let lon: number = 0;

        navigator.moveCloseTo$(lat, lon).subscribe();

        expect(moveSpy.calls.count()).toBe(1);
        expect(moveSpy.calls.first().args[0]).toBe(key);
    });

    it("should stop loading and throw when failing", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        spyOn(loadingService, "startLoading").and.stub();
        let stopLoadingSpy: jasmine.Spy = spyOn(loadingService, "stopLoading").and.stub();

        spyOn(apiV3, "imageCloseTo$").and.returnValue(Observable.of<IKey>(null));

        let navigator: Navigator =
            new Navigator(clientId, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

        let moveSpy: jasmine.Spy = spyOn(navigator, "moveToKey$");
        moveSpy.and.returnValue(Observable.empty<Node>());

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

        let clearNodesSpy: jasmine.Spy = spyOn(stateService, "clearNodes").and.stub();

        let setFilterSubject$: Subject<Graph> = new Subject<Graph>();
        let setFilterSpy: jasmine.Spy = spyOn(graphService, "setFilter$");
        setFilterSpy.and.returnValue(setFilterSubject$);

        let navigator: Navigator =
            new Navigator(clientId, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

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

    it("should set filter and cache requested when key requested but not moved to", (done: Function) => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graph: Graph = new Graph(apiV3);
        let graphService: GraphService = new GraphService(graph, imageLoadingService);
        let loadingService: LoadingService = new LoadingService();
        let stateService: StateService = new StateService();

        spyOn(loadingService, "startLoading").and.stub();
        let setNodesSpy: jasmine.Spy = spyOn(stateService, "setNodes").and.stub();

        let clearNodesSpy: jasmine.Spy = spyOn(stateService, "clearNodes").and.stub();

        let setFilterSubject$: Subject<Graph> = new Subject<Graph>();
        let setFilterSpy: jasmine.Spy = spyOn(graphService, "setFilter$");
        setFilterSpy.and.returnValue(setFilterSubject$);

        let cacheNodeSubject$: Subject<Node> = new Subject<Node>();
        let cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        let first: boolean = true;
        cacheNodeSpy.and.callFake(
            (key: string): Observable<Node> => {
                if (first) {
                    first = false;
                    return new Subject<Node>();
                }

                return cacheNodeSubject$;
            });

        let navigator: Navigator =
            new Navigator(clientId, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

        navigator.moveToKey$("moveToKey").subscribe();

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
        let first: boolean = true;
        cacheNodeSpy.and.callFake(
            (key: string): Observable<Node> => {
                if (first) {
                    first = false;
                    return cacheNodeSubject1$;
                }

                return cacheNodeSubject2$;
            });

        let navigator: Navigator =
            new Navigator(clientId, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

        navigator.moveToKey$("key").subscribe();

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
        setFilterSubject$.next(graph);
        setFilterSubject$.complete();
        cacheNodeSubject2$.next(node1);
        cacheNodeSubject2$.next(node2);
        cacheNodeSubject2$.complete();
    });
});

describe("Navigator.reset$", () => {
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

        let clearNodesSpy: jasmine.Spy = spyOn(stateService, "clearNodes").and.stub();
        let setTokenSpy: jasmine.Spy = spyOn(apiV3, "setToken").and.stub();

        let resetSubject$: Subject<Graph> = new Subject<Graph>();
        let resetSpy: jasmine.Spy = spyOn(graphService, "reset$");
        resetSpy.and.returnValue(resetSubject$);

        let navigator: Navigator =
            new Navigator(clientId, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

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
        let first: boolean = true;
        cacheNodeSpy.and.callFake(
            (key: string): Observable<Node> => {
                if (first) {
                    first = false;
                    return cacheNodeSubject1$;
                }

                return cacheNodeSubject2$;
            });

        let navigator: Navigator =
            new Navigator(clientId, undefined, apiV3, graphService, imageLoadingService, loadingService, stateService);

        navigator.moveToKey$("key").subscribe();

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
        resetSubject$.next(graph);
        resetSubject$.complete();
        cacheNodeSubject2$.next(node1);
        cacheNodeSubject2$.next(node2);
        cacheNodeSubject2$.complete();
    });
});
