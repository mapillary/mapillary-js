/// <reference path="../../typings/index.d.ts" />

import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";

import {
    APIv3,
    ICoreNode,
    IFullNode,
} from "../../src/API";
import { EdgeDirection } from "../../src/Edge";
import {
    Graph,
    GraphMode,
    GraphService,
    IEdgeStatus,
    ImageLoadingService,
    Node,
    NodeCache,
    Sequence,
} from "../../src/Graph";
import {
    ICurrentState,
    IFrame,
    StateService,
} from "../../src/State";
import {
    PlayService,
} from "../../src/Viewer";

import { MockCreator } from "../helper/MockCreator.spec";
import { NodeHelper } from "../helper/NodeHelper.spec";
import { StateServiceMockCreator } from "../helper/StateServiceMockCreator.spec";

describe("PlayService.ctor", () => {
    it("should be defined when constructed", () => {
        const clientId: string = "clientId";
        const apiV3: APIv3 = new APIv3(clientId);
        const imageLoadingService: ImageLoadingService = new ImageLoadingService();
        const graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        const stateService: StateService = new StateService();

        const playService: PlayService = new PlayService(graphService, stateService);

        expect(playService).toBeDefined();
    });

    it("should emit default values", (done: () => void) => {
        const clientId: string = "clientId";
        const apiV3: APIv3 = new APIv3(clientId);
        const imageLoadingService: ImageLoadingService = new ImageLoadingService();
        const graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        const stateService: StateService = new StateService();

        const playService: PlayService = new PlayService(graphService, stateService);

        Observable
            .zip(
                playService.direction$,
                playService.playing$,
                playService.speed$)
            .first()
            .subscribe(
                ([d, p, s]: [EdgeDirection, boolean, number]): void => {
                    expect(d).toBe(EdgeDirection.Next);
                    expect(p).toBe(false);
                    expect(s).toBe(0.5);

                    done();
                });
    });
});

describe("PlayService.playing", () => {
    it("should be playing after calling play", (done: () => void) => {
        const clientId: string = "clientId";
        const apiV3: APIv3 = new APIv3(clientId);
        const imageLoadingService: ImageLoadingService = new ImageLoadingService();
        const graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        const stateService: StateService = new StateService();

        const playService: PlayService = new PlayService(graphService, stateService);

        playService.play();

        expect(playService.playing).toBe(true);

        playService.playing$
            .subscribe(
                (playing: boolean): void => {
                    expect(playing).toBe(true);

                    done();
                });
    });

    it("should not be playing after calling stop", (done: () => void) => {
        const clientId: string = "clientId";
        const apiV3: APIv3 = new APIv3(clientId);
        const imageLoadingService: ImageLoadingService = new ImageLoadingService();
        const graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        const stateService: StateService = new StateService();

        const playService: PlayService = new PlayService(graphService, stateService);

        playService.play();

        const setGraphModeSpy: jasmine.Spy = spyOn(graphService, "setGraphMode").and.stub();
        const cutNodesSpy: jasmine.Spy = spyOn(stateService, "cutNodes").and.stub();
        const setSpeedSpy: jasmine.Spy = spyOn(stateService, "setSpeed").and.stub();

        playService.stop();

        expect(setGraphModeSpy.calls.count()).toBe(1);
        expect(setGraphModeSpy.calls.argsFor(0)[0]).toBe(GraphMode.Spatial);

        expect(cutNodesSpy.calls.count()).toBe(1);

        expect(setSpeedSpy.calls.count()).toBe(1);
        expect(setSpeedSpy.calls.argsFor(0)[0]).toBe(1);

        expect(playService.playing).toBe(false);

        playService.playing$
            .subscribe(
                (playing: boolean): void => {
                    expect(playing).toBe(false);

                    done();
                });
    });
});

describe("PlayService.speed$", () => {
    it("should emit when changing speed", (done: () => void) => {
        const clientId: string = "clientId";
        const apiV3: APIv3 = new APIv3(clientId);
        const imageLoadingService: ImageLoadingService = new ImageLoadingService();
        const graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        const stateService: StateService = new StateService();

        const playService: PlayService = new PlayService(graphService, stateService);

        playService.speed$
            .skip(1)
            .subscribe(
                (speed: number): void => {
                    expect(speed).toBe(0);

                    done();
                });

        playService.setSpeed(0);
    });

    it("should not emit when setting current speed", () => {
        const clientId: string = "clientId";
        const apiV3: APIv3 = new APIv3(clientId);
        const imageLoadingService: ImageLoadingService = new ImageLoadingService();
        const graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        const stateService: StateService = new StateService();

        const playService: PlayService = new PlayService(graphService, stateService);

        playService.setSpeed(1);

        let speedEmitCount: number = 0;
        let first: boolean = true;
        playService.speed$
            .skip(1)
            .subscribe(
                (speed: number): void => {
                    speedEmitCount ++;

                    if (first) {
                        expect(speed).toBe(0);
                        first = false;
                    } else {
                        expect(speed).toBe(1);
                    }
                });

        playService.setSpeed(0);
        playService.setSpeed(0);
        playService.setSpeed(1);
        playService.setSpeed(1);

        expect(speedEmitCount).toBe(2);
    });

    it("should clamp speed values to 0, 1 interval", (done: () => void) => {
        const clientId: string = "clientId";
        const apiV3: APIv3 = new APIv3(clientId);
        const imageLoadingService: ImageLoadingService = new ImageLoadingService();
        const graphService: GraphService = new GraphService(new Graph(apiV3), imageLoadingService);
        const stateService: StateService = new StateService();

        const playService: PlayService = new PlayService(graphService, stateService);

        let first: boolean = true;
        playService.speed$
            .skip(1)
            .subscribe(
                (speed: number): void => {
                    if (first) {
                        expect(speed).toBe(0);
                        first = false;
                    } else {
                        expect(speed).toBe(1);

                        done();
                    }
                });

        playService.setSpeed(-1);
        playService.setSpeed(2);
    });
});

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

describe("PlayService.play", () => {
    let nodeHelper: NodeHelper;

    let apiV3: APIv3;
    let imageLoadingService: ImageLoadingService;
    let graphService: GraphService;
    let stateService: StateService;

    beforeEach(() => {
        nodeHelper = new NodeHelper();

        apiV3 = new APIv3("clientId");
        imageLoadingService = new ImageLoadingService();
        graphService = new GraphService(new Graph(apiV3), imageLoadingService);
        stateService = new StateServiceMockCreator().create();
    });

    it("should set graph mode when passing speed threshold", () => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const setGraphModeSpy: jasmine.Spy = spyOn(graphService, "setGraphMode").and.stub();

        playService.setSpeed(0);

        playService.play();

        playService.setSpeed(1);
        playService.setSpeed(0);

        expect(setGraphModeSpy.calls.count()).toBe(3);
        expect(setGraphModeSpy.calls.argsFor(0)[0]).toBe(GraphMode.Spatial);
        expect(setGraphModeSpy.calls.argsFor(1)[0]).toBe(GraphMode.Sequence);
        expect(setGraphModeSpy.calls.argsFor(2)[0]).toBe(GraphMode.Spatial);
    });

    it("should stop immediately if node does not have an edge in current direction", () => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();
        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceNodes$").and.returnValue(new Subject<Sequence>());

        playService.setDirection(EdgeDirection.Next);

        playService.play();

        const node: Node = nodeHelper.createNode();
        node.initializeCache(new NodeCache());
        (<Subject<Node>>stateService.currentNode$).next(node);

        node.cacheSequenceEdges([]);

        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should stop if error occurs", () => {
        spyOn(console, "error").and.stub();

        const playService: PlayService = new PlayService(graphService, stateService);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();
        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceNodes$").and.returnValue(new Subject<Sequence>());

        playService.setDirection(EdgeDirection.Next);

        playService.play();

        const node: Node = new MockCreator().create(Node, "Node"); nodeHelper.createNode();
        const sequenceEdgesSubject: Subject<IEdgeStatus> = new Subject<IEdgeStatus>();
        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);

        (<Subject<Node>>stateService.currentNode$).next(node);

        sequenceEdgesSubject.error(new Error());

        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should emit in correct order if stopping immediately", (done: () => void) => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();
        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceNodes$").and.returnValue(new Subject<Sequence>());

        playService.setDirection(EdgeDirection.Next);

        let first: boolean = true;
        playService.playing$
            .skip(1)
            .take(2)
            .subscribe(
                (playing: boolean): void => {
                    expect(playing).toBe(playService.playing);

                    if (first) {
                        expect(playing).toBe(true);
                        first = false;
                    } else {
                        expect(playing).toBe(false);
                        done();
                    }
                });

        playService.play();

        const node: Node = nodeHelper.createNode();
        node.initializeCache(new NodeCache());
        (<Subject<Node>>stateService.currentNode$).next(node);

        node.cacheSequenceEdges([]);
    });

    it("should not stop if nodes are not cached", () => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();
        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceNodes$").and.returnValue(new Subject<Sequence>());

        playService.setDirection(EdgeDirection.Next);

        playService.play();

        const node: Node = new MockCreator().create(Node, "Node"); nodeHelper.createNode();
        const sequenceEdgesSubject: Subject<IEdgeStatus> = new Subject<IEdgeStatus>();
        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);

        (<Subject<Node>>stateService.currentNode$).next(node);

        sequenceEdgesSubject.next({ cached: false, edges: []});

        expect(stopSpy.calls.count()).toBe(0);

        sequenceEdgesSubject.next({ cached: true, edges: []});

        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should append node when cached", () => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const appendNodesSpy: jasmine.Spy = <jasmine.Spy>stateService.appendNodes;
        appendNodesSpy.and.callThrough();
        const cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        const cacheNodeSubject: Subject<Node> = new Subject<Node>();
        cacheNodeSpy.and.returnValue(cacheNodeSubject);

        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceNodes$").and.returnValue(new Subject<Sequence>());

        playService.setDirection(EdgeDirection.Next);

        playService.play();

        const node: Node = new MockCreator().create(Node, "Node"); nodeHelper.createNode();
        const sequenceEdgesSubject: Subject<IEdgeStatus> = new Subject<IEdgeStatus>();
        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);

        let state: ICurrentState = createState();
        state.trajectory = [node];
        state.lastNode = node;
        state.nodesAhead = 0;

        let currentStateSubject$: Subject<IFrame> = <Subject<IFrame>>stateService.currentState$;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        const fullToNode: IFullNode = nodeHelper.createFullNode();
        fullToNode.key = "toKey";
        const toNode: Node = new Node(fullToNode);

        sequenceEdgesSubject.next({
            cached: true,
            edges: [{
                data: { direction: EdgeDirection.Next, worldMotionAzimuth: 0 },
                from: node.key,
                to:  toNode.key,
            }],
        });

        cacheNodeSubject.next(toNode);

        expect(cacheNodeSpy.calls.count()).toBe(1);
        expect(cacheNodeSpy.calls.argsFor(0)[0]).toBe(toNode.key);

        expect(appendNodesSpy.calls.count()).toBe(1);
        expect(appendNodesSpy.calls.argsFor(0)[0].length).toBe(1);
        expect(appendNodesSpy.calls.argsFor(0)[0][0].key).toBe(toNode.key);
    });

    it("should stop on node caching error", () => {
        spyOn(console, "error").and.stub();

        const playService: PlayService = new PlayService(graphService, stateService);

        const appendNodesSpy: jasmine.Spy = <jasmine.Spy>stateService.appendNodes;
        appendNodesSpy.and.callThrough();
        const cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        const cacheNodeSubject: Subject<Node> = new Subject<Node>();
        cacheNodeSpy.and.returnValue(cacheNodeSubject);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();

        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceNodes$").and.returnValue(new Subject<Sequence>());

        playService.setDirection(EdgeDirection.Next);

        playService.play();

        const node: Node = new MockCreator().create(Node, "Node"); nodeHelper.createNode();
        const sequenceEdgesSubject: Subject<IEdgeStatus> = new Subject<IEdgeStatus>();
        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);

        let state: ICurrentState = createState();
        state.trajectory = [node];
        state.lastNode = node;
        state.nodesAhead = 0;

        let currentStateSubject$: Subject<IFrame> = <Subject<IFrame>>stateService.currentState$;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        const fullToNode: IFullNode = nodeHelper.createFullNode();
        fullToNode.key = "toKey";
        const toNode: Node = new Node(fullToNode);

        sequenceEdgesSubject.next({
            cached: true,
            edges: [{
                data: { direction: EdgeDirection.Next, worldMotionAzimuth: 0 },
                from: node.key,
                to:  toNode.key,
            }],
        });

        cacheNodeSubject.error(new Error());

        expect(cacheNodeSpy.calls.count()).toBe(1);
        expect(cacheNodeSpy.calls.argsFor(0)[0]).toBe(toNode.key);

        expect(appendNodesSpy.calls.count()).toBe(0);

        expect(stopSpy.calls.count()).toBe(1);
    });
});
