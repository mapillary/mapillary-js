/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {NodeHelper} from "../helper/NodeHelper.spec";

import {
    APIv3,
    ICoreNode,
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
    CacheService,
} from "../../src/Viewer";

describe("CacheService.ctor", () => {
    it("should be defined when constructed", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let stateService: StateService = new StateService();

        let cacheService: CacheService = new CacheService(graphService, stateService);

        expect(cacheService).toBeDefined();
    });
});

describe("CacheService.started", () => {
    it("should not be started", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let stateService: StateService = new StateService();

        let cacheService: CacheService = new CacheService(graphService, stateService);

        expect(cacheService.started).toBe(false);
    });

    it("should be started after calling start", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let stateService: StateService = new StateService();

        let cacheService: CacheService = new CacheService(graphService, stateService);

        cacheService.start();

        expect(cacheService.started).toBe(true);
    });

    it("should not be started after calling stop", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        let stateService: StateService = new StateService();

        let cacheService: CacheService = new CacheService(graphService, stateService);

        cacheService.start();
        cacheService.stop();

        expect(cacheService.started).toBe(false);
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

describe("CacheService.start", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should call graph service uncache method", () => {
        let clientId: string = "clientId";
        let apiV3: APIv3 = new APIv3(clientId);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let graph: Graph = new Graph(apiV3);
        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        let currentStateSubject$: Subject<IFrame> = new Subject<IFrame>();
        let stateService: TestStateService = new TestStateService(currentStateSubject$);

        let uncacheSpy: jasmine.Spy = spyOn(graphService, "uncache$");
        let uncacheSubject: Subject<Graph> = new Subject<Graph>();
        uncacheSpy.and.returnValue(uncacheSubject);

        let cacheService: CacheService = new CacheService(graphService, stateService);

        cacheService.start();

        let coreNode1: ICoreNode = helper.createCoreNode();
        coreNode1.key = "node1";
        let node1: Node = new Node(coreNode1);

        let coreNode2: ICoreNode = helper.createCoreNode();
        coreNode2.key = "node2";
        let node2: Node = new Node(coreNode2);

        let state: ICurrentState = createState();
        state.trajectory = [node1, node2];
        state.currentNode = node1;

        currentStateSubject$.next({ fps: 60, id: 0, state: state });
        currentStateSubject$.complete();

        uncacheSubject.complete();

        expect(uncacheSpy.calls.count()).toBe(1);
        expect(uncacheSpy.calls.first().args.length).toBe(1);
        expect(uncacheSpy.calls.first().args[0].length).toBe(2);
        expect(uncacheSpy.calls.first().args[0][0]).toBe(coreNode1.key);
        expect(uncacheSpy.calls.first().args[0][1]).toBe(coreNode2.key);
    });
});

