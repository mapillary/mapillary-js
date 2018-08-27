import {NodeHelper} from "../helper/NodeHelper.spec";

import {ICoreNode, IFullNode} from "../../src/API";
import {Camera} from "../../src/Geo";
import {Node} from "../../src/Graph";
import {IRotation, IState, StateBase, TransitionMode} from "../../src/State";

class TestStateBase extends StateBase {
    public traverse(): StateBase { return null; }
    public wait(): StateBase { return null; }
    public waitInteractively(): StateBase { return null; }
    public move(delta: number): void { return; }
    public moveTo(position: number): void { return; }
    public rotate(delta: IRotation): void { return; }
    public rotateUnbounded(delta: IRotation): void { return; }
    public rotateWithoutInertia(delta: IRotation): void { return; }
    public rotateBasic(basicRotation: number[]): void { return; }
    public rotateBasicUnbounded(basic: number[]): void { return; }
    public rotateBasicWithoutInertia(basic: number[]): void { return; }
    public rotateToBasic(basic: number[]): void { return; }
    public zoomIn(delta: number, reference: number[]): void { return; }
    public update(fps: number): void { return; }
    public setCenter(center: number[]): void { return; }
    public setZoom(zoom: number): void { return; }
    public setSpeed(speed: number): void { return; }

    public motionlessTransition(): boolean { return this._motionlessTransition(); }

    protected _getAlpha(): number { return; }
}

class TestNode extends Node {
    constructor(core: ICoreNode) {
        super(core);
    }

    public get assetsCached(): boolean {
        return true;
    }

    public get image(): HTMLImageElement {
        return null;
    }
}

let createState: () => IState = (): IState => {
    return {
        alpha: 1,
        camera: new Camera(),
        currentIndex: -1,
        reference: { alt: 0, lat: 0, lon: 0 },
        trajectory: [],
        transitionMode: TransitionMode.Default,
        zoom: 0,
    };
};

let createFullNode: () => Node = (): Node => {
    let helper: NodeHelper = new NodeHelper();
    let node: TestNode = new TestNode(helper.createCoreNode());
    node.makeFull(helper.createFillNode());

    return node;
};

describe("StateBase.transitionMode", () => {
    it("should set transition mode", () => {
        const state1: IState = createState();
        const stateBase1: TestStateBase = new TestStateBase(state1);

        expect(stateBase1.transitionMode).toBe(TransitionMode.Default);

        const state2: IState = createState();
        state2.transitionMode = TransitionMode.Instantaneous;
        const stateBase2: TestStateBase = new TestStateBase(state2);

        expect(stateBase2.transitionMode).toBe(TransitionMode.Instantaneous);
    });
});

describe("StateBase.motionlessTransition", () => {
    it("should be false if not both nodes set", () => {
        const state: IState = createState();
        const stateBase: TestStateBase = new TestStateBase(state);

        expect(stateBase.motionlessTransition()).toBe(false);
    });

    it("should be false if nodes in same connected component", () => {
        const state: IState = createState();
        const stateBase: TestStateBase = new TestStateBase(state);

        const helper: NodeHelper = new NodeHelper();

        const fullNode1: IFullNode = helper.createFullNode();
        fullNode1.merge_cc = 1;
        fullNode1.merge_version = 1;
        const node1: Node = new TestNode(fullNode1);
        node1.makeFull(fullNode1);

        const fullNode2: IFullNode = helper.createFullNode();
        fullNode2.merge_cc = 1;
        fullNode2.merge_version = 1;
        const node2: Node = new TestNode(fullNode2);
        node2.makeFull(fullNode2);

        stateBase.set([node1]);
        stateBase.set([node2]);

        expect(stateBase.motionlessTransition()).toBe(false);
    });

    it("should be true if instantaneous transition mode", () => {
        const state: IState = createState();
        state.transitionMode = TransitionMode.Instantaneous;
        const stateBase: TestStateBase = new TestStateBase(state);

        const helper: NodeHelper = new NodeHelper();

        const fullNode1: IFullNode = helper.createFullNode();
        fullNode1.merge_cc = 1;
        fullNode1.merge_version = 1;
        const node1: Node = new TestNode(fullNode1);
        node1.makeFull(fullNode1);

        const fullNode2: IFullNode = helper.createFullNode();
        fullNode2.merge_cc = 1;
        fullNode2.merge_version = 1;
        const node2: Node = new TestNode(fullNode2);
        node2.makeFull(fullNode2);

        stateBase.set([node1]);
        stateBase.set([node2]);

        expect(stateBase.motionlessTransition()).toBe(true);
    });
});

describe("StateBase.set", () => {
    it("should set current node", () => {
        let state: IState = createState();
        let stateBase: TestStateBase = new TestStateBase(state);

        let node: Node = createFullNode();
        stateBase.set([node]);

        expect(stateBase.currentNode).toBeDefined();
        expect(stateBase.currentIndex).toBe(0);
        expect(stateBase.trajectory.length).toBe(1);
    });

    it("should set multiple nodes", () => {
        let state: IState = createState();
        let stateBase: TestStateBase = new TestStateBase(state);

        stateBase.set([
            createFullNode(),
            createFullNode(),
            createFullNode(),
        ]);

        expect(stateBase.currentNode).toBeDefined();
        expect(stateBase.currentIndex).toBe(0);
        expect(stateBase.trajectory.length).toBe(3);
    });
});

describe("StateBase.remove", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should throw when removing negative number", () => {
        let state: IState = createState();
        let stateBase: TestStateBase = new TestStateBase(state);

        expect((): void => { stateBase.remove(-1); }).toThrowError(Error);
    });

    it("should throw when removing current node", () => {
        let state: IState = createState();
        let stateBase: TestStateBase = new TestStateBase(state);

        let node: Node = createFullNode();
        stateBase.set([node]);

        expect((): void => { stateBase.remove(1); }).toThrowError(Error);
    });

    it("should throw when removing previous node", () => {
        let state: IState = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        stateBase.set([createFullNode()]);
        stateBase.prepend([createFullNode()]);

        expect((): void => { stateBase.remove(1); }).toThrowError(Error);
    });

    it("should remove one node", () => {
        let state: IState = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreNode: ICoreNode = helper.createCoreNode();
        coreNode.key = "currentNode";
        let node: TestNode = new TestNode(coreNode);
        node.makeFull(helper.createFillNode());

        stateBase.set([node]);
        stateBase.prepend([createFullNode(), createFullNode()]);

        stateBase.remove(1);

        expect(stateBase.currentNode).toBeDefined();
        expect(stateBase.currentNode.key).toBe(node.key);
        expect(stateBase.currentIndex).toBe(1);
        expect(stateBase.trajectory.length).toBe(2);
    });

    it("should remove multiple nodes", () => {
        let state: IState = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreNode: ICoreNode = helper.createCoreNode();
        coreNode.key = "currentNode";
        let node: TestNode = new TestNode(coreNode);
        node.makeFull(helper.createFillNode());

        stateBase.set([node]);
        stateBase.prepend([
            createFullNode(),
            createFullNode(),
            createFullNode(),
            createFullNode(),
        ]);

        stateBase.remove(3);

        expect(stateBase.currentNode).toBeDefined();
        expect(stateBase.currentNode.key).toBe(node.key);
        expect(stateBase.currentIndex).toBe(1);
        expect(stateBase.trajectory.length).toBe(2);
    });
});

describe("StateBase.clear", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should clear empty state without affecting it", () => {
        let state: IState = createState();
        let stateBase: TestStateBase = new TestStateBase(state);

        stateBase.clear();

        expect(stateBase.currentIndex).toBe(state.currentIndex);
    });

    it("should remove one previous node", () => {
        let state: IState = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreNode: ICoreNode = helper.createCoreNode();
        coreNode.key = "currentNode";
        let node: TestNode = new TestNode(coreNode);
        node.makeFull(helper.createFillNode());

        stateBase.set([node]);
        stateBase.prepend([createFullNode(), createFullNode()]);

        stateBase.clear();

        expect(stateBase.currentNode).toBeDefined();
        expect(stateBase.currentNode.key).toBe(node.key);
        expect(stateBase.currentIndex).toBe(1);
        expect(stateBase.trajectory.length).toBe(2);
    });

    it("should remove multiple previous nodes", () => {
        let state: IState = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreNode: ICoreNode = helper.createCoreNode();
        coreNode.key = "currentNode";
        let node: TestNode = new TestNode(coreNode);
        node.makeFull(helper.createFillNode());

        stateBase.set([node]);
        stateBase.prepend([
            createFullNode(),
            createFullNode(),
            createFullNode(),
            createFullNode(),
        ]);

        stateBase.clear();

        expect(stateBase.currentNode).toBeDefined();
        expect(stateBase.currentNode.key).toBe(node.key);
        expect(stateBase.currentIndex).toBe(1);
        expect(stateBase.trajectory.length).toBe(2);
    });

    it("should remove one coming node", () => {
        let state: IState = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreNode: ICoreNode = helper.createCoreNode();
        coreNode.key = "currentNode";
        let node: TestNode = new TestNode(coreNode);
        node.makeFull(helper.createFillNode());

        stateBase.set([node]);
        stateBase.append([createFullNode()]);

        stateBase.clear();

        expect(stateBase.currentNode).toBeDefined();
        expect(stateBase.currentNode.key).toBe(node.key);
        expect(stateBase.currentIndex).toBe(0);
        expect(stateBase.trajectory.length).toBe(1);
    });

    it("should remove multiple coming nodes", () => {
        let state: IState = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreNode: ICoreNode = helper.createCoreNode();
        coreNode.key = "currentNode";
        let node: TestNode = new TestNode(coreNode);
        node.makeFull(helper.createFillNode());

        stateBase.set([node]);
        stateBase.append([
            createFullNode(),
            createFullNode(),
            createFullNode(),
            createFullNode(),
        ]);

        stateBase.clear();

        expect(stateBase.currentNode).toBeDefined();
        expect(stateBase.currentNode.key).toBe(node.key);
        expect(stateBase.currentIndex).toBe(0);
        expect(stateBase.trajectory.length).toBe(1);
    });

    it("should remove one previous and one coming node", () => {
        let state: IState = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreNode: ICoreNode = helper.createCoreNode();
        coreNode.key = "currentNode";
        let node: TestNode = new TestNode(coreNode);
        node.makeFull(helper.createFillNode());

        stateBase.set([node]);
        stateBase.prepend([createFullNode(), createFullNode()]);
        stateBase.append([createFullNode()]);

        stateBase.clear();

        expect(stateBase.currentNode).toBeDefined();
        expect(stateBase.currentNode.key).toBe(node.key);
        expect(stateBase.currentIndex).toBe(1);
        expect(stateBase.trajectory.length).toBe(2);
    });
});

describe("StateBase.clearPrior", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should clear prior of empty state without affecting it", () => {
        let state: IState = createState();
        let stateBase: TestStateBase = new TestStateBase(state);

        stateBase.clearPrior();

        expect(stateBase.currentIndex).toBe(state.currentIndex);
    });

    it("should remove one previous node", () => {
        let state: IState = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreNode: ICoreNode = helper.createCoreNode();
        coreNode.key = "currentNode";
        let node: TestNode = new TestNode(coreNode);
        node.makeFull(helper.createFillNode());

        stateBase.set([node]);
        stateBase.prepend([createFullNode(), createFullNode()]);

        stateBase.clearPrior();

        expect(stateBase.currentNode).toBeDefined();
        expect(stateBase.currentNode.key).toBe(node.key);
        expect(stateBase.currentIndex).toBe(1);
        expect(stateBase.trajectory.length).toBe(2);
    });

    it("should remove multiple previous nodes", () => {
        let state: IState = createState();

        let stateBase: TestStateBase = new TestStateBase(state);

        let coreNode: ICoreNode = helper.createCoreNode();
        coreNode.key = "currentNode";
        let node: TestNode = new TestNode(coreNode);
        node.makeFull(helper.createFillNode());

        stateBase.set([node]);
        stateBase.prepend([
            createFullNode(),
            createFullNode(),
            createFullNode(),
            createFullNode(),
        ]);

        stateBase.clearPrior();

        expect(stateBase.currentNode).toBeDefined();
        expect(stateBase.currentNode.key).toBe(node.key);
        expect(stateBase.currentIndex).toBe(1);
        expect(stateBase.trajectory.length).toBe(2);
    });
});
