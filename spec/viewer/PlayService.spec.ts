import { bootstrap } from "../Bootstrap";
bootstrap();

import {
    of as observableOf,
    zip as observableZip,
    Observable,
    Subject,
} from "rxjs";
import { take, first, skip } from "rxjs/operators";
import { MockCreator } from "../helper/MockCreator";
import { NodeHelper } from "../helper/NodeHelper";
import { StateServiceMockCreator } from "../helper/StateServiceMockCreator";
import { FrameHelper } from "../helper/FrameHelper";
import { Node } from "../../src/graph/Node";
import { APIWrapper } from "../../src/api/APIWrapper";
import { FalcorDataProvider } from "../../src/api/falcor/FalcorDataProvider";
import { ImageEnt } from "../../src/api/ents/ImageEnt";
import { Graph } from "../../src/graph/Graph";
import { GraphMode } from "../../src/graph/GraphMode";
import { GraphService } from "../../src/graph/GraphService";
import { NavigationEdgeStatus } from "../../src/graph/interfaces/NavigationEdgeStatus";
import { NodeCache } from "../../src/graph/NodeCache";
import { Sequence } from "../../src/graph/Sequence";
import { IAnimationState } from "../../src/state/interfaces/IAnimationState";
import { AnimationFrame } from "../../src/state/interfaces/AnimationFrame";
import { State } from "../../src/state/State";
import { StateService } from "../../src/state/StateService";
import { PlayService } from "../../src/viewer/PlayService";
import { NavigationDirection } from "../../src/graph/edge/NavigationDirection";

describe("PlayService.ctor", () => {
    it("should be defined when constructed", () => {
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService();

        const playService: PlayService = new PlayService(graphService, stateService);

        expect(playService).toBeDefined();
    });

    it("should emit default values", (done: () => void) => {
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService();

        const playService: PlayService = new PlayService(graphService, stateService);

        observableZip(
            playService.direction$,
            playService.playing$,
            playService.speed$).pipe(
                first())
            .subscribe(
                ([d, p, s]: [NavigationDirection, boolean, number]): void => {
                    expect(d).toBe(NavigationDirection.Next);
                    expect(p).toBe(false);
                    expect(s).toBe(0.5);

                    done();
                });
    });
});

describe("PlayService.playing", () => {
    it("should be playing after calling play", (done: () => void) => {
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphService: GraphService = new GraphService(new Graph(api));
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
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphService: GraphService = new GraphService(new Graph(api));
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
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService();

        const playService: PlayService = new PlayService(graphService, stateService);

        playService.speed$.pipe(
            skip(1))
            .subscribe(
                (speed: number): void => {
                    expect(speed).toBe(0);

                    done();
                });

        playService.setSpeed(0);
    });

    it("should not emit when setting current speed", () => {
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService();

        const playService: PlayService = new PlayService(graphService, stateService);

        playService.setSpeed(1);

        let speedEmitCount: number = 0;
        let firstEmit: boolean = true;
        playService.speed$.pipe(
            skip(1))
            .subscribe(
                (speed: number): void => {
                    speedEmitCount++;

                    if (firstEmit) {
                        expect(speed).toBe(0);
                        firstEmit = false;
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
        const api: APIWrapper = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphService: GraphService = new GraphService(new Graph(api));
        const stateService: StateService = new StateService();

        const playService: PlayService = new PlayService(graphService, stateService);

        let firstEmit: boolean = true;
        playService.speed$.pipe(
            skip(1))
            .subscribe(
                (speed: number): void => {
                    if (firstEmit) {
                        expect(speed).toBe(0);
                        firstEmit = false;
                    } else {
                        expect(speed).toBe(1);

                        done();
                    }
                });

        playService.setSpeed(-1);
        playService.setSpeed(2);
    });
});

let createState: () => IAnimationState = (): IAnimationState => {
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

describe("PlayService.play", () => {
    let nodeHelper: NodeHelper;

    let api: APIWrapper;
    let graphService: GraphService;
    let stateService: StateService;

    beforeEach(() => {
        nodeHelper = new NodeHelper();

        api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        graphService = new GraphService(new Graph(api));
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

    it("should stop immediately if node does not have an edge in current direction and no bridge", () => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();
        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceNodes$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheBoundingBox$").and.returnValue(observableOf([]));

        playService.setDirection(NavigationDirection.Next);

        playService.play();

        const frame: AnimationFrame = new FrameHelper().createFrame();
        frame.state.currentNode.initializeCache(new NodeCache(undefined));
        (<Subject<AnimationFrame>>stateService.currentState$).next(frame);

        frame.state.currentNode.cacheSequenceEdges([]);

        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should stop if earth mode is emitted", () => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();
        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceNodes$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheBoundingBox$").and.returnValue(observableOf([]));

        playService.setDirection(NavigationDirection.Next);

        playService.play();

        (<Subject<State>>stateService.state$).next(State.Earth);

        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should stop if error occurs", () => {
        spyOn(console, "error").and.stub();

        const playService: PlayService = new PlayService(graphService, stateService);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();
        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceNodes$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheBoundingBox$").and.returnValue(new Subject<Node[]>());

        playService.setDirection(NavigationDirection.Next);

        playService.play();

        const frame: AnimationFrame = new FrameHelper().createFrame();

        const node: Node = frame.state.currentNode;
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();
        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);

        (<Subject<AnimationFrame>>stateService.currentState$).next(frame);

        sequenceEdgesSubject.error(new Error());

        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should emit in correct order if stopping immediately", (done: () => void) => {
        const playService: PlayService = new PlayService(graphService, stateService);

        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceNodes$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheBoundingBox$").and.returnValue(observableOf([]));

        playService.setDirection(NavigationDirection.Next);

        let firstEmit: boolean = true;
        playService.playing$.pipe(
            skip(1),
            take(2))
            .subscribe(
                (playing: boolean): void => {
                    expect(playing).toBe(playService.playing);

                    if (firstEmit) {
                        expect(playing).toBe(true);
                        firstEmit = false;
                    } else {
                        expect(playing).toBe(false);
                        done();
                    }
                });

        playService.play();

        const frame: AnimationFrame = new FrameHelper().createFrame();
        frame.state.currentNode.initializeCache(new NodeCache(undefined));
        (<Subject<AnimationFrame>>stateService.currentState$).next(frame);

        frame.state.currentNode.cacheSequenceEdges([]);
    });

    it("should not stop if nodes are not cached", () => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();
        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceNodes$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheBoundingBox$").and.returnValue(observableOf([]));

        playService.setDirection(NavigationDirection.Next);

        playService.play();

        const frame: AnimationFrame = new FrameHelper().createFrame();
        const node: Node = frame.state.currentNode;
        node.initializeCache(new NodeCache(undefined));
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();
        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);

        (<Subject<AnimationFrame>>stateService.currentState$).next(frame);

        sequenceEdgesSubject.next({ cached: false, edges: [] });

        expect(stopSpy.calls.count()).toBe(0);

        sequenceEdgesSubject.next({ cached: true, edges: [] });

        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should stop if no more nodes", () => {
        const playService: PlayService = new PlayService(graphService, stateService);

        const stopSpy: jasmine.Spy = spyOn(playService, "stop").and.callThrough();
        spyOn(graphService, "cacheSequence$").and.returnValue(new Subject<Sequence>());
        spyOn(graphService, "cacheSequenceNodes$").and.returnValue(new Subject<Sequence>());

        playService.setDirection(NavigationDirection.Next);

        playService.play();

        const frame: AnimationFrame = new FrameHelper().createFrame();
        const node: Node = frame.state.currentNode;
        node.initializeCache(new NodeCache(undefined));
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();

        const prevFullNode: ImageEnt = new NodeHelper().createFullNode();
        prevFullNode.captured_at = -1;
        const prevNode: Node = new Node(prevFullNode);
        prevNode.makeFull(prevFullNode);
        frame.state.trajectory.splice(0, 0, prevNode);
        frame.state.currentIndex = 1;

        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);

        (<Subject<AnimationFrame>>stateService.currentState$).next(frame);

        sequenceEdgesSubject.next({ cached: false, edges: [] });

        expect(stopSpy.calls.count()).toBe(0);

        sequenceEdgesSubject.next({ cached: true, edges: [] });

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
        spyOn(graphService, "cacheBoundingBox$").and.returnValue(new Subject<Node[]>());

        playService.setDirection(NavigationDirection.Next);

        playService.play();

        const frame: AnimationFrame = new FrameHelper().createFrame();
        const node: Node = frame.state.currentNode;
        node.initializeCache(new NodeCache(undefined));
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();
        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);

        (<Subject<AnimationFrame>>stateService.currentState$).next(frame);

        const fullToNode: ImageEnt = nodeHelper.createFullNode();
        fullToNode.id = "toKey";
        const toNode: Node = new Node(fullToNode);

        sequenceEdgesSubject.next({
            cached: true,
            edges: [{
                data: { direction: NavigationDirection.Next, worldMotionAzimuth: 0 },
                source: node.id,
                target: toNode.id,
            }],
        });

        cacheNodeSubject.next(toNode);

        expect(cacheNodeSpy.calls.count()).toBe(1);
        expect(cacheNodeSpy.calls.argsFor(0)[0]).toBe(toNode.id);

        expect(appendNodesSpy.calls.count()).toBe(1);
        expect(appendNodesSpy.calls.argsFor(0)[0].length).toBe(1);
        expect(appendNodesSpy.calls.argsFor(0)[0][0].id).toBe(toNode.id);
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
        spyOn(graphService, "cacheBoundingBox$").and.returnValue(new Subject<Node[]>());

        playService.setDirection(NavigationDirection.Next);

        playService.play();

        const frame: AnimationFrame = new FrameHelper().createFrame();
        const node: Node = frame.state.currentNode;
        node.initializeCache(new NodeCache(undefined));
        const sequenceEdgesSubject: Subject<NavigationEdgeStatus> = new Subject<NavigationEdgeStatus>();
        new MockCreator().mockProperty(node, "sequenceEdges$", sequenceEdgesSubject);

        (<Subject<AnimationFrame>>stateService.currentState$).next(frame);

        const fullToNode: ImageEnt = nodeHelper.createFullNode();
        fullToNode.id = "toKey";
        const toNode: Node = new Node(fullToNode);

        sequenceEdgesSubject.next({
            cached: true,
            edges: [{
                data: { direction: NavigationDirection.Next, worldMotionAzimuth: 0 },
                source: node.id,
                target: toNode.id,
            }],
        });

        cacheNodeSubject.error(new Error());

        expect(cacheNodeSpy.calls.count()).toBe(1);
        expect(cacheNodeSpy.calls.argsFor(0)[0]).toBe(toNode.id);

        expect(appendNodesSpy.calls.count()).toBe(0);

        expect(stopSpy.calls.count()).toBe(1);
    });

    it("should cache sequence when in spatial graph mode", () => {
        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Next);
        // Set speed to zero so that graph mode is set to spatial when calling play
        playService.setSpeed(0);

        const cacheSequenceSpy: jasmine.Spy = spyOn(graphService, "cacheSequence$");
        cacheSequenceSpy.and.returnValue(new Subject<Sequence>());
        const cacheSequenceNodesSpy: jasmine.Spy = spyOn(graphService, "cacheSequenceNodes$");
        cacheSequenceNodesSpy.and.returnValue(new Subject<Sequence>());

        playService.play();

        const currentNode: Node = nodeHelper.createNode();
        new MockCreator().mockProperty(currentNode, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const currentNodeSubject: Subject<Node> = <Subject<Node>>stateService.currentNode$;
        currentNodeSubject.next(currentNode);

        expect(cacheSequenceSpy.calls.count()).toBe(1);
        expect(cacheSequenceSpy.calls.argsFor(0)[0]).toBe(currentNode.sequenceId);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(0);

        playService.stop();
    });

    it("should cache sequence nodes when in sequence graph mode", () => {
        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Next);
        // Set speed to one so that graph mode is set to sequence when calling play
        playService.setSpeed(1);

        const cacheSequenceSpy: jasmine.Spy = spyOn(graphService, "cacheSequence$");
        cacheSequenceSpy.and.returnValue(new Subject<Sequence>());
        const cacheSequenceNodesSpy: jasmine.Spy = spyOn(graphService, "cacheSequenceNodes$");
        cacheSequenceNodesSpy.and.returnValue(new Subject<Sequence>());

        playService.play();

        const currentNode: Node = nodeHelper.createNode();
        new MockCreator().mockProperty(currentNode, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const currentNodeSubject: Subject<Node> = <Subject<Node>>stateService.currentNode$;
        currentNodeSubject.next(currentNode);

        expect(cacheSequenceSpy.calls.count()).toBe(0);

        expect(cacheSequenceNodesSpy.calls.count()).toBe(1);
        expect(cacheSequenceNodesSpy.calls.argsFor(0)[0]).toBe(currentNode.sequenceId);

        playService.stop();
    });

    it("should not pre-cache if current node is last sequence node", () => {
        graphService.setGraphMode(GraphMode.Spatial);

        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Next);

        const cacheSequenceSubject: Subject<Sequence> = new Subject<Sequence>();
        spyOn(graphService, "cacheSequence$").and.returnValue(cacheSequenceSubject);

        playService.play();

        const sequenceKey: string = "sequenceKey";

        const currentFullNode: ImageEnt = new NodeHelper().createFullNode();
        currentFullNode.sequence.id = sequenceKey;
        currentFullNode.id = "node0";
        const currentNode: Node = new Node(currentFullNode);
        new MockCreator().mockProperty(currentNode, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const prevNodeKey: string = "node1";

        const currentNodeSubject: Subject<Node> = <Subject<Node>>stateService.currentNode$;
        currentNodeSubject.next(currentNode);

        const sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [prevNodeKey, currentNode.id] });
        cacheSequenceSubject.next(sequence);

        const cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        const cacheNodeSubject: Subject<Node> = new Subject<Node>();
        cacheNodeSpy.and.returnValue(cacheNodeSubject);

        const state: IAnimationState = createState();
        state.trajectory = [currentNode];
        state.lastNode = currentNode;
        state.currentNode = currentNode;
        state.nodesAhead = 0;

        (<Subject<AnimationFrame>>stateService.currentState$).next({ fps: 60, id: 0, state: state });

        expect(cacheNodeSpy.calls.count()).toBe(0);

        playService.stop();
    });

    it("should pre-cache one trajectory node", () => {
        graphService.setGraphMode(GraphMode.Spatial);

        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Next);

        const cacheSequenceSubject: Subject<Sequence> = new Subject<Sequence>();
        spyOn(graphService, "cacheSequence$").and.returnValue(cacheSequenceSubject);

        playService.play();

        const sequenceKey: string = "sequenceKey";

        const currentFullNode: ImageEnt = new NodeHelper().createFullNode();
        currentFullNode.sequence.id = sequenceKey;
        currentFullNode.id = "node0";
        const currentNode: Node = new Node(currentFullNode);
        new MockCreator().mockProperty(currentNode, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const nextNodeKey: string = "node1";

        const currentNodeSubject: Subject<Node> = <Subject<Node>>stateService.currentNode$;
        currentNodeSubject.next(currentNode);

        const sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [currentNode.id, nextNodeKey] });
        cacheSequenceSubject.next(sequence);

        const cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        const cacheNodeSubject: Subject<Node> = new Subject<Node>();
        cacheNodeSpy.and.returnValue(cacheNodeSubject);

        const state: IAnimationState = createState();
        state.trajectory = [currentNode];
        state.lastNode = currentNode;
        state.currentNode = currentNode;
        state.nodesAhead = 0;

        const currentStateSubject$: Subject<AnimationFrame> = <Subject<AnimationFrame>>stateService.currentState$;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        cacheNodeSubject.next(new NodeHelper().createNode());

        expect(cacheNodeSpy.calls.count()).toBe(1);
        expect(cacheNodeSpy.calls.argsFor(0)[0]).toBe(nextNodeKey);

        playService.stop();
    });

    it("should pre-cache one trajectory node in prev direction", () => {
        graphService.setGraphMode(GraphMode.Spatial);

        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Prev);

        const cacheSequenceSubject: Subject<Sequence> = new Subject<Sequence>();
        spyOn(graphService, "cacheSequence$").and.returnValue(cacheSequenceSubject);

        playService.play();

        const sequenceKey: string = "sequenceKey";

        const currentFullNode: ImageEnt = new NodeHelper().createFullNode();
        currentFullNode.sequence.id = sequenceKey;
        currentFullNode.id = "node0";
        const currentNode: Node = new Node(currentFullNode);
        new MockCreator().mockProperty(currentNode, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const prevNodeKey: string = "node1";

        const currentNodeSubject: Subject<Node> = <Subject<Node>>stateService.currentNode$;
        currentNodeSubject.next(currentNode);

        const sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [prevNodeKey, currentNode.id] });
        cacheSequenceSubject.next(sequence);

        const cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        const cacheNodeSubject: Subject<Node> = new Subject<Node>();
        cacheNodeSpy.and.returnValue(cacheNodeSubject);

        const state: IAnimationState = createState();
        state.trajectory = [currentNode];
        state.lastNode = currentNode;
        state.currentNode = currentNode;
        state.nodesAhead = 0;

        const currentStateSubject$: Subject<AnimationFrame> = <Subject<AnimationFrame>>stateService.currentState$;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        cacheNodeSubject.next(new NodeHelper().createNode());

        expect(cacheNodeSpy.calls.count()).toBe(1);
        expect(cacheNodeSpy.calls.argsFor(0)[0]).toBe(prevNodeKey);

        // Sequence should not have changed because of internal reversing
        expect(sequence.imageIds[0]).toBe(prevNodeKey);
        expect(sequence.imageIds[1]).toBe(currentNode.id);

        playService.stop();
    });

    it("should not pre-cache the same node twice", () => {
        graphService.setGraphMode(GraphMode.Spatial);

        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Next);

        const cacheSequenceSubject: Subject<Sequence> = new Subject<Sequence>();
        spyOn(graphService, "cacheSequence$").and.returnValue(cacheSequenceSubject);

        playService.play();

        const sequenceKey: string = "sequenceKey";

        const currentFullNode: ImageEnt = new NodeHelper().createFullNode();
        currentFullNode.sequence.id = sequenceKey;
        currentFullNode.id = "node0";
        const currentNode: Node = new Node(currentFullNode);
        currentNode.makeFull(currentFullNode);
        new MockCreator().mockProperty(currentNode, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const nextNodeKey: string = "node1";

        const currentNodeSubject: Subject<Node> = <Subject<Node>>stateService.currentNode$;
        currentNodeSubject.next(currentNode);

        const sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [currentNode.id, nextNodeKey] });
        cacheSequenceSubject.next(sequence);

        const cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        const cacheNodeSubject: Subject<Node> = new Subject<Node>();
        cacheNodeSpy.and.returnValue(cacheNodeSubject);

        const state: IAnimationState = createState();
        state.trajectory = [currentNode];
        state.lastNode = currentNode;
        state.currentNode = currentNode;
        state.nodesAhead = 0;

        const currentStateSubject$: Subject<AnimationFrame> = <Subject<AnimationFrame>>stateService.currentState$;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        const nextFullNode: ImageEnt = new NodeHelper().createFullNode();
        nextFullNode.sequence.id = sequenceKey;
        nextFullNode.id = nextNodeKey;
        const nextNode: Node = new Node(nextFullNode);
        nextNode.makeFull(nextFullNode);
        cacheNodeSubject.next(nextNode);

        expect(cacheNodeSpy.calls.count()).toBe(1);
        expect(cacheNodeSpy.calls.argsFor(0)[0]).toBe(nextNodeKey);

        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        expect(cacheNodeSpy.calls.count()).toBe(1);

        playService.stop();
    });

    it("should not pre-cache if all sequence nodes in trajectory", () => {
        graphService.setGraphMode(GraphMode.Spatial);

        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Next);

        const cacheSequenceSubject: Subject<Sequence> = new Subject<Sequence>();
        spyOn(graphService, "cacheSequence$").and.returnValue(cacheSequenceSubject);

        playService.play();

        const sequenceKey: string = "sequenceKey";

        const currentFullNode: ImageEnt = new NodeHelper().createFullNode();
        currentFullNode.sequence.id = sequenceKey;
        currentFullNode.id = "node0";
        const currentNode: Node = new Node(currentFullNode);
        currentNode.makeFull(currentFullNode);
        new MockCreator().mockProperty(currentNode, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const nextNodeKey: string = "node1";
        const nextFullNode: ImageEnt = new NodeHelper().createFullNode();
        nextFullNode.sequence.id = sequenceKey;
        nextFullNode.id = nextNodeKey;
        const nextNode: Node = new Node(nextFullNode);
        nextNode.makeFull(nextFullNode);
        new MockCreator().mockProperty(nextNode, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const currentNodeSubject: Subject<Node> = <Subject<Node>>stateService.currentNode$;
        currentNodeSubject.next(currentNode);

        const sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [currentNode.id, nextNodeKey] });
        cacheSequenceSubject.next(sequence);

        const cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$");
        const cacheNodeSubject: Subject<Node> = new Subject<Node>();
        cacheNodeSpy.and.returnValue(cacheNodeSubject);

        const state: IAnimationState = createState();
        state.trajectory = [currentNode, nextNode];
        state.lastNode = nextNode;
        state.currentNode = currentNode;
        state.nodesAhead = 0;

        const currentStateSubject$: Subject<AnimationFrame> = <Subject<AnimationFrame>>stateService.currentState$;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        expect(cacheNodeSpy.calls.count()).toBe(0);

        playService.stop();
    });

    it("should pre-cache up to specified nodes ahead", () => {
        graphService.setGraphMode(GraphMode.Spatial);

        const playService: PlayService = new PlayService(graphService, stateService);
        playService.setDirection(NavigationDirection.Next);
        // Zero speed means max ten nodes ahead
        playService.setSpeed(0);

        const cacheSequenceSubject: Subject<Sequence> = new Subject<Sequence>();
        spyOn(graphService, "cacheSequence$").and.returnValue(cacheSequenceSubject);

        playService.play();

        const sequenceKey: string = "sequenceKey";

        const currentFullNode: ImageEnt = new NodeHelper().createFullNode();
        currentFullNode.sequence.id = sequenceKey;
        currentFullNode.id = "currentNodeKey";
        const currentNode: Node = new Node(currentFullNode);
        currentNode.makeFull(currentFullNode);
        new MockCreator().mockProperty(currentNode, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

        const sequence: Sequence = new Sequence({ id: sequenceKey, image_ids: [currentNode.id] });
        const sequenceNodes: Node[] = [];

        for (let i: number = 0; i < 20; i++) {
            const sequenceNodeKey: string = `node${i}`;
            const sequenceFullNode: ImageEnt = new NodeHelper().createFullNode();
            sequenceFullNode.sequence.id = sequenceKey;
            sequenceFullNode.id = sequenceNodeKey;
            const sequenceNode: Node = new Node(sequenceFullNode);
            sequenceNode.makeFull(sequenceFullNode);
            new MockCreator().mockProperty(sequenceNode, "sequenceEdges$", new Subject<NavigationEdgeStatus>());

            sequence.imageIds.push(sequenceNode.id);
            sequenceNodes.push(sequenceNode);
        }

        const currentNodeSubject: Subject<Node> = <Subject<Node>>stateService.currentNode$;

        currentNodeSubject.next(currentNode);
        cacheSequenceSubject.next(sequence);

        const cacheNodeSpy: jasmine.Spy = spyOn(graphService, "cacheNode$").and.callFake(
            (key: string): Observable<Node> => {
                const fullNode: ImageEnt = new NodeHelper().createFullNode();
                fullNode.sequence.id = sequenceKey;
                fullNode.id = key;
                const node: Node = new Node(fullNode);
                node.makeFull(fullNode);

                return observableOf(node);
            });

        const state: IAnimationState = createState();
        state.trajectory = [currentNode];
        state.lastNode = currentNode;
        state.currentNode = currentNode;
        state.currentIndex = 0;
        state.nodesAhead = 0;

        // Cache ten nodes immediately
        const currentStateSubject$: Subject<AnimationFrame> = <Subject<AnimationFrame>>stateService.currentState$;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        let cachedCount: number = 10;
        expect(cacheNodeSpy.calls.count()).toBe(cachedCount);

        // Add one node to trajectory before current node has moved
        state.trajectory = state.trajectory.concat(sequenceNodes.splice(0, 1));
        state.lastNode = state.trajectory[state.trajectory.length - 1];
        state.nodesAhead = 1;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        // No new nodes should be cached
        expect(cacheNodeSpy.calls.count()).toBe(cachedCount);

        // Current node has moved one step in trajectory to the last node, nodes ahead
        // is zero and one new node should be cached
        state.currentIndex += 1;
        state.currentNode = state.trajectory[state.currentIndex];
        state.nodesAhead = 0;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        cachedCount += 1;
        expect(cacheNodeSpy.calls.count()).toBe(cachedCount);

        // Add 5 nodes to trajectory and move current node 3 steps
        state.trajectory = state.trajectory.concat(sequenceNodes.splice(0, 5));
        state.currentIndex += 3;
        state.currentNode = state.trajectory[state.currentIndex];
        state.lastNode = state.trajectory[state.trajectory.length - 1];
        state.nodesAhead = 2;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        // Three new nodes should be cached
        cachedCount += 3;
        expect(cacheNodeSpy.calls.count()).toBe(cachedCount);

        // Add all 14 nodes cached so far to trajectory and move current node to last
        // trajectory node
        state.trajectory = state.trajectory.concat(sequenceNodes.splice(0, 8));
        state.currentIndex = state.trajectory.length - 1;
        expect(state.currentIndex).toBe(14);
        state.currentNode = state.trajectory[state.currentIndex];
        state.lastNode = state.trajectory[state.trajectory.length - 1];
        state.nodesAhead = 0;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        // Six last nodes should be cached
        cachedCount += 6;
        expect(cacheNodeSpy.calls.count()).toBe(cachedCount);

        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        // No new nodes should be cached
        expect(cacheNodeSpy.calls.count()).toBe(cachedCount);

        // Add all remaining nodes to trajectory and move current node one step
        state.trajectory = state.trajectory.concat(sequenceNodes.splice(0, sequenceNodes.length));
        state.currentIndex += 1;
        state.currentNode = state.trajectory[state.currentIndex];
        state.lastNode = state.trajectory[state.trajectory.length - 1];
        state.nodesAhead = 5;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        // No new nodes should be cached
        expect(cacheNodeSpy.calls.count()).toBe(cachedCount);

        // Move current node to last trajectory node
        state.trajectory = state.trajectory.concat(sequenceNodes.splice(0, sequenceNodes.length));
        state.currentIndex = state.trajectory.length - 1;
        state.currentNode = state.trajectory[state.currentIndex];
        state.lastNode = state.trajectory[state.trajectory.length - 1];
        state.nodesAhead = 0;
        currentStateSubject$.next({ fps: 60, id: 0, state: state });

        // No new nodes should be cached
        expect(cacheNodeSpy.calls.count()).toBe(20);

        for (let i: number = 0; i < 20; i++) {
            expect(cacheNodeSpy.calls.argsFor(i)[0]).toBe(sequence.imageIds[i + 1]);
        }

        playService.stop();
    });
});
