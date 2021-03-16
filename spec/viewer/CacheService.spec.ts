import { bootstrap } from "../Bootstrap";
bootstrap();

import { of as observableOf, Subject } from "rxjs";

import { NodeHelper } from "../helper/NodeHelper";

import { Node } from "../../src/graph/Node";
import { APIWrapper } from "../../src/api/APIWrapper";
import { FalcorDataProvider } from "../../src/api/FalcorDataProvider";
import { CoreImageEnt } from "../../src/api/ents/CoreImageEnt";
import { Graph } from "../../src/graph/Graph";
import { GraphMode } from "../../src/graph/GraphMode";
import { GraphService } from "../../src/graph/GraphService";
import { IAnimationState } from "../../src/state/interfaces/IAnimationState";
import { AnimationFrame } from "../../src/state/interfaces/AnimationFrame";
import { State } from "../../src/state/State";
import { StateService } from "../../src/state/StateService";
import { CacheService } from "../../src/viewer/CacheService";

describe("CacheService.ctor", () => {
    it("should be defined when constructed", () => {
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService();

        const cacheService: CacheService = new CacheService(graphService, stateService);

        expect(cacheService).toBeDefined();
    });
});

describe("CacheService.started", () => {
    it("should not be started", () => {
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService();

        const cacheService: CacheService = new CacheService(graphService, stateService);

        expect(cacheService.started).toBe(false);
    });

    it("should be started after calling start", () => {
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService();

        const cacheService: CacheService = new CacheService(graphService, stateService);

        cacheService.start();

        expect(cacheService.started).toBe(true);
    });

    it("should not be started after calling stop", () => {
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService();

        const cacheService: CacheService = new CacheService(graphService, stateService);

        cacheService.start();
        cacheService.stop();

        expect(cacheService.started).toBe(false);
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

describe("CacheService.start", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should call graph service uncache method", () => {
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);
        graphService.setGraphMode(GraphMode.Spatial);

        const currentStateSubject$: Subject<AnimationFrame> = new Subject<AnimationFrame>();
        const stateService: TestStateService = new TestStateService(currentStateSubject$);

        const uncacheSpy: jasmine.Spy = spyOn(graphService, "uncache$");
        const uncacheSubject: Subject<Graph> = new Subject<Graph>();
        uncacheSpy.and.returnValue(uncacheSubject);

        const cacheService: CacheService = new CacheService(graphService, stateService);

        cacheService.start();

        const coreNode1: CoreImageEnt = helper.createCoreNode();
        coreNode1.key = "node1";
        const node1: Node = new Node(coreNode1);

        const coreNode2: CoreImageEnt = helper.createCoreNode();
        coreNode2.key = "node2";
        const node2: Node = new Node(coreNode2);

        const state: IAnimationState = createState();
        state.trajectory = [node1, node2];
        state.currentNode = node1;

        currentStateSubject$.next({ fps: 60, id: 0, state: state });
        currentStateSubject$.complete();

        uncacheSubject.complete();

        expect(uncacheSpy.calls.count()).toBe(1);
        expect(uncacheSpy.calls.first().args.length).toBe(2);
        expect(uncacheSpy.calls.first().args[0].length).toBe(2);
        expect(uncacheSpy.calls.first().args[0][0]).toBe(coreNode1.key);
        expect(uncacheSpy.calls.first().args[0][1]).toBe(coreNode2.key);
        expect(uncacheSpy.calls.first().args[1]).toBeUndefined();
    });

    it("should call graph service uncache method with sequence key of last trajectory node", () => {
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);
        graphService.setGraphMode(GraphMode.Sequence);

        const currentStateSubject$: Subject<AnimationFrame> = new Subject<AnimationFrame>();
        const stateService: TestStateService = new TestStateService(currentStateSubject$);

        const uncacheSpy: jasmine.Spy = spyOn(graphService, "uncache$");
        const uncacheSubject: Subject<Graph> = new Subject<Graph>();
        uncacheSpy.and.returnValue(uncacheSubject);

        const cacheService: CacheService = new CacheService(graphService, stateService);

        cacheService.start();

        const coreNode1: CoreImageEnt = helper.createCoreNode();
        coreNode1.key = "node1";
        const node1: Node = new Node(coreNode1);

        const coreNode2: CoreImageEnt = helper.createCoreNode();
        coreNode2.key = "node2";
        coreNode2.sequence_key = "sequence2";
        const node2: Node = new Node(coreNode2);

        const state: IAnimationState = createState();
        state.trajectory = [node1, node2];
        state.currentNode = node1;

        currentStateSubject$.next({ fps: 60, id: 0, state: state });
        currentStateSubject$.complete();

        uncacheSubject.complete();

        expect(uncacheSpy.calls.count()).toBe(1);
        expect(uncacheSpy.calls.first().args.length).toBe(2);
        expect(uncacheSpy.calls.first().args[0].length).toBe(2);
        expect(uncacheSpy.calls.first().args[0][0]).toBe(coreNode1.key);
        expect(uncacheSpy.calls.first().args[0][1]).toBe(coreNode2.key);
        expect(uncacheSpy.calls.first().args[1]).toBe(coreNode2.sequence_key);
    });

    it("should cache current node if switching to sequence graph mode", () => {
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);

        spyOn(graphService, "uncache$").and.returnValue(observableOf<void>(null));

        graphService.setGraphMode(GraphMode.Spatial);

        const currentStateSubject$: Subject<AnimationFrame> = new Subject<AnimationFrame>();
        const stateService: TestStateService = new TestStateService(currentStateSubject$);

        const cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        const cacheNodeSubject: Subject<Graph> = new Subject<Graph>();
        cacheNodeSpy.and.returnValue(cacheNodeSubject);

        const cacheService: CacheService = new CacheService(graphService, stateService);

        cacheService.start();

        const coreNode1: CoreImageEnt = helper.createCoreNode();
        coreNode1.key = "node1";
        const node1: Node = new Node(coreNode1);

        const coreNode2: CoreImageEnt = helper.createCoreNode();
        coreNode2.key = "node2";
        const node2: Node = new Node(coreNode2);

        const state: IAnimationState = createState();
        state.trajectory = [node1, node2];
        state.currentNode = node1;

        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        graphService.setGraphMode(GraphMode.Sequence);

        expect(cacheNodeSpy.calls.count()).toBe(1);
        expect(cacheNodeSpy.calls.first().args.length).toBe(1);
        expect(cacheNodeSpy.calls.first().args[0]).toBe(coreNode1.key);

        cacheService.stop();
    });

    it("should cache all trajectory nodes ahead if switching to spatial graph mode", () => {
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);

        spyOn(graphService, "uncache$").and.returnValue(observableOf<void>(null));

        graphService.setGraphMode(GraphMode.Sequence);

        const currentStateSubject$: Subject<AnimationFrame> = new Subject<AnimationFrame>();
        const stateService: TestStateService = new TestStateService(currentStateSubject$);

        const cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        const cacheNodeSubject: Subject<Graph> = new Subject<Graph>();
        cacheNodeSpy.and.returnValue(cacheNodeSubject);

        const cacheService: CacheService = new CacheService(graphService, stateService);

        cacheService.start();

        const coreNode1: CoreImageEnt = helper.createCoreNode();
        coreNode1.key = "node1";
        const node1: Node = new Node(coreNode1);

        const coreNode2: CoreImageEnt = helper.createCoreNode();
        coreNode2.key = "node2";
        const node2: Node = new Node(coreNode2);

        const coreNode3: CoreImageEnt = helper.createCoreNode();
        coreNode3.key = "node3";
        const node3: Node = new Node(coreNode3);

        const state: IAnimationState = createState();
        state.trajectory = [node1, node2, node3];
        state.currentNode = node2;
        state.currentIndex = 1;

        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        graphService.setGraphMode(GraphMode.Spatial);

        expect(cacheNodeSpy.calls.count()).toBe(2);
        expect(cacheNodeSpy.calls.first().args.length).toBe(1);
        expect(cacheNodeSpy.calls.first().args[0]).toBe(coreNode2.key);
        expect(cacheNodeSpy.calls.argsFor(1).length).toBe(1);
        expect(cacheNodeSpy.calls.argsFor(1)[0]).toBe(coreNode3.key);

        cacheService.stop();
    });

    it("should keep the subscription open if caching a node fails", () => {
        spyOn(console, "error").and.stub();

        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graph: Graph = new Graph(api);
        const graphService: GraphService = new GraphService(graph);

        spyOn(graphService, "uncache$").and.returnValue(observableOf<void>(null));

        const currentStateSubject$: Subject<AnimationFrame> = new Subject<AnimationFrame>();
        const stateService: TestStateService = new TestStateService(currentStateSubject$);

        const cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");

        const cacheService: CacheService = new CacheService(graphService, stateService);

        cacheService.start();

        const coreNode1: CoreImageEnt = helper.createCoreNode();
        coreNode1.key = "node1";
        const node1: Node = new Node(coreNode1);

        const state: IAnimationState = createState();
        state.trajectory = [node1];
        state.currentNode = node1;
        state.currentIndex = 0;

        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        const cacheNodeSubject1: Subject<Graph> = new Subject<Graph>();
        cacheNodeSpy.and.returnValue(cacheNodeSubject1);

        graphService.setGraphMode(GraphMode.Sequence);

        cacheNodeSubject1.error(new Error());

        const cacheNodeSubject2: Subject<Graph> = new Subject<Graph>();
        cacheNodeSpy.and.returnValue(cacheNodeSubject2);

        graphService.setGraphMode(GraphMode.Spatial);

        expect(cacheNodeSpy.calls.count()).toBe(2);

        cacheService.stop();
    });
});
