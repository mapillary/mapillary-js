/// <reference path="../../typings/index.d.ts" />


import {NodeHelper} from "../helper/NodeHelper.spec";

import {ICoreNode} from "../../src/API";
import {Camera} from "../../src/Geo";
import {Node} from "../../src/Graph";
import {IRotation, IState, StateBase} from "../../src/State";

class TestStateBase extends StateBase {
    public traverse(): StateBase { return null; }
    public wait(): StateBase { return null; }
    public move(delta: number): void { return; }
    public moveTo(position: number): void { return; }
    public rotate(delta: IRotation): void { return; }
    public rotateBasic(basicRotation: number[]): void { return; }
    public rotateBasicUnbounded(basic: number[]): void { return; }
    public rotateBasicWithoutInertia(basic: number[]): void { return; }
    public rotateToBasic(basic: number[]): void { return; }
    public zoomIn(delta: number, reference: number[]): void { return; }
    public update(fps: number): void { return; }
    public setCenter(center: number[]): void { return; }
    public setZoom(zoom: number): void { return; }

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
        zoom: 0,
    };
};

let createFullNode: () => Node = (): Node => {
    let helper: NodeHelper = new NodeHelper();
    let node: TestNode = new TestNode(helper.createCoreNode());
    node.makeFull(helper.createFillNode());

    return node;
};

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
