/// <reference path="../../typings/index.d.ts" />

import {NodeHelper} from "../helper/NodeHelper.spec";

import {
    ICoreNode,
    IFillNode,
} from "../../src/API";
import {
    Filter,
    FilterFunction,
    Node,
} from "../../src/Graph";

describe("Filter.ctor", () => {
    it("should create a filter", () => {
        let filter: Filter = new Filter();

        expect(filter).toBeDefined();
    });
});

describe("Filter.createComparisonFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should compare ==, string", () => {
        let creator: Filter = new Filter();

        let sequenceKey: string = "skey";
        let filter: FilterFunction = creator.createComparisonFilter(["==", "sequenceKey", sequenceKey]);

        let coreNode1: ICoreNode = helper.createCoreNode();
        let coreNode2: ICoreNode = helper.createCoreNode();
        let coreNode3: ICoreNode = helper.createCoreNode();
        let coreNode4: ICoreNode = helper.createCoreNode();

        coreNode1.sequence.key = sequenceKey;
        coreNode2.sequence.key = sequenceKey + "w";
        coreNode3.sequence.key = null;
        coreNode4.sequence.key = undefined;

        let node1: Node = new Node(coreNode1);
        let node2: Node = new Node(coreNode2);
        let node3: Node = new Node(coreNode3);
        let node4: Node = new Node(coreNode4);

        expect(filter(node1)).toBe(true);
        expect(filter(node2)).toBe(false);
        expect(filter(node3)).toBe(false);
        expect(filter(node4)).toBe(false);
    });

    it("should compare ==, number", () => {
        let creator: Filter = new Filter();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createComparisonFilter(["==", "capturedAt", capturedAt]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());

        let fillNode1: IFillNode = helper.createFillNode();
        let fillNode2: IFillNode = helper.createFillNode();
        let fillNode3: IFillNode = helper.createFillNode();
        let fillNode4: IFillNode = helper.createFillNode();

        fillNode1.captured_at = capturedAt;
        fillNode2.captured_at = capturedAt + 1;
        fillNode3.captured_at = null;
        fillNode4.captured_at = undefined;

        node1.makeFull(fillNode1);
        node2.makeFull(fillNode2);
        node3.makeFull(fillNode3);
        node4.makeFull(fillNode4);

        expect(filter(node1)).toBe(true);
        expect(filter(node2)).toBe(false);
        expect(filter(node3)).toBe(false);
        expect(filter(node4)).toBe(false);
    });

    it("should compare ==, null", () => {
        let creator: Filter = new Filter();

        let filter: FilterFunction = creator.createComparisonFilter<string>(["==", "userKey", null]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());

        let fillNode1: IFillNode = helper.createFillNode();
        let fillNode2: IFillNode = helper.createFillNode();
        let fillNode3: IFillNode = helper.createFillNode();
        let fillNode4: IFillNode = helper.createFillNode();

        fillNode1.user.key = null;
        fillNode2.user.key = "ukey";
        fillNode3.user.key = "null";
        fillNode4.user.key = undefined;

        node1.makeFull(fillNode1);
        node2.makeFull(fillNode2);
        node3.makeFull(fillNode3);
        node4.makeFull(fillNode4);

        expect(filter(node1)).toBe(true);
        expect(filter(node2)).toBe(false);
        expect(filter(node3)).toBe(false);
        expect(filter(node4)).toBe(false);
    });
});

describe("Filter.createComparisonFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should compare !=, string", () => {
        let creator: Filter = new Filter();

        let sequenceKey: string = "skey";
        let filter: FilterFunction = creator.createComparisonFilter(["!=", "sequenceKey", sequenceKey]);

        let coreNode1: ICoreNode = helper.createCoreNode();
        let coreNode2: ICoreNode = helper.createCoreNode();
        let coreNode3: ICoreNode = helper.createCoreNode();
        let coreNode4: ICoreNode = helper.createCoreNode();

        coreNode1.sequence.key = sequenceKey;
        coreNode2.sequence.key = sequenceKey + "w";
        coreNode3.sequence.key = null;
        coreNode4.sequence.key = undefined;

        let node1: Node = new Node(coreNode1);
        let node2: Node = new Node(coreNode2);
        let node3: Node = new Node(coreNode3);
        let node4: Node = new Node(coreNode4);

        expect(filter(node1)).toBe(false);
        expect(filter(node2)).toBe(true);
        expect(filter(node3)).toBe(true);
        expect(filter(node4)).toBe(true);
    });

    it("should compare !=, number", () => {
        let creator: Filter = new Filter();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createComparisonFilter(["!=", "capturedAt", capturedAt]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());

        let fillNode1: IFillNode = helper.createFillNode();
        let fillNode2: IFillNode = helper.createFillNode();
        let fillNode3: IFillNode = helper.createFillNode();
        let fillNode4: IFillNode = helper.createFillNode();

        fillNode1.captured_at = capturedAt;
        fillNode2.captured_at = capturedAt + 1;
        fillNode3.captured_at = null;
        fillNode4.captured_at = undefined;

        node1.makeFull(fillNode1);
        node2.makeFull(fillNode2);
        node3.makeFull(fillNode3);
        node4.makeFull(fillNode4);

        expect(filter(node1)).toBe(false);
        expect(filter(node2)).toBe(true);
        expect(filter(node3)).toBe(true);
        expect(filter(node4)).toBe(true);
    });

    it("should compare !=, null", () => {
        let creator: Filter = new Filter();

        let filter: FilterFunction = creator.createComparisonFilter<string>(["!=", "userKey", null]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());

        let fillNode1: IFillNode = helper.createFillNode();
        let fillNode2: IFillNode = helper.createFillNode();
        let fillNode3: IFillNode = helper.createFillNode();
        let fillNode4: IFillNode = helper.createFillNode();

        fillNode1.user.key = null;
        fillNode2.user.key = "ukey";
        fillNode3.user.key = "null";
        fillNode4.user.key = undefined;

        node1.makeFull(fillNode1);
        node2.makeFull(fillNode2);
        node3.makeFull(fillNode3);
        node4.makeFull(fillNode4);

        expect(filter(node1)).toBe(false);
        expect(filter(node2)).toBe(true);
        expect(filter(node3)).toBe(true);
        expect(filter(node4)).toBe(true);
    });
});

describe("Filter.createComparisonFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should compare >, number", () => {
        let creator: Filter = new Filter();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createComparisonFilter([">", "capturedAt", capturedAt]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());
        let node5: Node = new Node(helper.createCoreNode());

        let fillNode1: IFillNode = helper.createFillNode();
        let fillNode2: IFillNode = helper.createFillNode();
        let fillNode3: IFillNode = helper.createFillNode();
        let fillNode4: IFillNode = helper.createFillNode();
        let fillNode5: IFillNode = helper.createFillNode();

        fillNode1.captured_at = capturedAt - 1;
        fillNode2.captured_at = capturedAt;
        fillNode3.captured_at = capturedAt + 1;
        fillNode4.captured_at = null;
        fillNode5.captured_at = undefined;

        node1.makeFull(fillNode1);
        node2.makeFull(fillNode2);
        node3.makeFull(fillNode3);
        node4.makeFull(fillNode4);
        node5.makeFull(fillNode5);

        expect(filter(node1)).toBe(false);
        expect(filter(node2)).toBe(false);
        expect(filter(node3)).toBe(true);
        expect(filter(node4)).toBe(false);
        expect(filter(node5)).toBe(false);
    });

    it("should compare >, string", () => {
        let creator: Filter = new Filter();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createComparisonFilter([">", "sequenceKey", sequenceKey]);

        let coreNode1: ICoreNode = helper.createCoreNode();
        let coreNode2: ICoreNode = helper.createCoreNode();
        let coreNode3: ICoreNode = helper.createCoreNode();
        let coreNode4: ICoreNode = helper.createCoreNode();
        let coreNode5: ICoreNode = helper.createCoreNode();

        coreNode1.sequence.key = "-1";
        coreNode2.sequence.key = sequenceKey;
        coreNode3.sequence.key = "1";
        coreNode4.sequence.key = null;
        coreNode5.sequence.key = undefined;

        let node1: Node = new Node(coreNode1);
        let node2: Node = new Node(coreNode2);
        let node3: Node = new Node(coreNode3);
        let node4: Node = new Node(coreNode4);
        let node5: Node = new Node(coreNode4);

        expect(filter(node1)).toBe(false);
        expect(filter(node2)).toBe(false);
        expect(filter(node3)).toBe(true);
        expect(filter(node4)).toBe(false);
        expect(filter(node5)).toBe(false);
    });
});

describe("Filter.createComparisonFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should compare >=, number", () => {
        let creator: Filter = new Filter();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createComparisonFilter([">=", "capturedAt", capturedAt]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());
        let node5: Node = new Node(helper.createCoreNode());

        let fillNode1: IFillNode = helper.createFillNode();
        let fillNode2: IFillNode = helper.createFillNode();
        let fillNode3: IFillNode = helper.createFillNode();
        let fillNode4: IFillNode = helper.createFillNode();
        let fillNode5: IFillNode = helper.createFillNode();

        fillNode1.captured_at = capturedAt - 1;
        fillNode2.captured_at = capturedAt;
        fillNode3.captured_at = capturedAt + 1;
        fillNode4.captured_at = null;
        fillNode5.captured_at = undefined;

        node1.makeFull(fillNode1);
        node2.makeFull(fillNode2);
        node3.makeFull(fillNode3);
        node4.makeFull(fillNode4);
        node5.makeFull(fillNode5);

        expect(filter(node1)).toBe(false);
        expect(filter(node2)).toBe(true);
        expect(filter(node3)).toBe(true);
        expect(filter(node4)).toBe(false);
        expect(filter(node5)).toBe(false);
    });

    it("should compare >=, string", () => {
        let creator: Filter = new Filter();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createComparisonFilter([">=", "sequenceKey", sequenceKey]);

        let coreNode1: ICoreNode = helper.createCoreNode();
        let coreNode2: ICoreNode = helper.createCoreNode();
        let coreNode3: ICoreNode = helper.createCoreNode();
        let coreNode4: ICoreNode = helper.createCoreNode();
        let coreNode5: ICoreNode = helper.createCoreNode();

        coreNode1.sequence.key = "-1";
        coreNode2.sequence.key = sequenceKey;
        coreNode3.sequence.key = "1";
        coreNode4.sequence.key = null;
        coreNode5.sequence.key = undefined;

        let node1: Node = new Node(coreNode1);
        let node2: Node = new Node(coreNode2);
        let node3: Node = new Node(coreNode3);
        let node4: Node = new Node(coreNode4);
        let node5: Node = new Node(coreNode4);

        expect(filter(node1)).toBe(false);
        expect(filter(node2)).toBe(true);
        expect(filter(node3)).toBe(true);
        expect(filter(node4)).toBe(false);
        expect(filter(node5)).toBe(false);
    });
});

describe("Filter.createComparisonFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should compare <, number", () => {
        let creator: Filter = new Filter();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createComparisonFilter(["<", "capturedAt", capturedAt]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());
        let node5: Node = new Node(helper.createCoreNode());

        let fillNode1: IFillNode = helper.createFillNode();
        let fillNode2: IFillNode = helper.createFillNode();
        let fillNode3: IFillNode = helper.createFillNode();
        let fillNode4: IFillNode = helper.createFillNode();
        let fillNode5: IFillNode = helper.createFillNode();

        fillNode1.captured_at = capturedAt - 1;
        fillNode2.captured_at = capturedAt;
        fillNode3.captured_at = capturedAt + 1;
        fillNode4.captured_at = null;
        fillNode5.captured_at = undefined;

        node1.makeFull(fillNode1);
        node2.makeFull(fillNode2);
        node3.makeFull(fillNode3);
        node4.makeFull(fillNode4);
        node5.makeFull(fillNode5);

        expect(filter(node1)).toBe(true);
        expect(filter(node2)).toBe(false);
        expect(filter(node3)).toBe(false);
        expect(filter(node4)).toBe(false);
        expect(filter(node5)).toBe(false);
    });

    it("should compare <, string", () => {
        let creator: Filter = new Filter();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createComparisonFilter(["<", "sequenceKey", sequenceKey]);

        let coreNode1: ICoreNode = helper.createCoreNode();
        let coreNode2: ICoreNode = helper.createCoreNode();
        let coreNode3: ICoreNode = helper.createCoreNode();
        let coreNode4: ICoreNode = helper.createCoreNode();
        let coreNode5: ICoreNode = helper.createCoreNode();

        coreNode1.sequence.key = "-1";
        coreNode2.sequence.key = sequenceKey;
        coreNode3.sequence.key = "1";
        coreNode4.sequence.key = null;
        coreNode5.sequence.key = undefined;

        let node1: Node = new Node(coreNode1);
        let node2: Node = new Node(coreNode2);
        let node3: Node = new Node(coreNode3);
        let node4: Node = new Node(coreNode4);
        let node5: Node = new Node(coreNode4);

        expect(filter(node1)).toBe(true);
        expect(filter(node2)).toBe(false);
        expect(filter(node3)).toBe(false);
        expect(filter(node4)).toBe(false);
        expect(filter(node5)).toBe(false);
    });
});

describe("Filter.createComparisonFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should compare <=, number", () => {
        let creator: Filter = new Filter();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createComparisonFilter(["<=", "capturedAt", capturedAt]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());
        let node5: Node = new Node(helper.createCoreNode());

        let fillNode1: IFillNode = helper.createFillNode();
        let fillNode2: IFillNode = helper.createFillNode();
        let fillNode3: IFillNode = helper.createFillNode();
        let fillNode4: IFillNode = helper.createFillNode();
        let fillNode5: IFillNode = helper.createFillNode();

        fillNode1.captured_at = capturedAt - 1;
        fillNode2.captured_at = capturedAt;
        fillNode3.captured_at = capturedAt + 1;
        fillNode4.captured_at = null;
        fillNode5.captured_at = undefined;

        node1.makeFull(fillNode1);
        node2.makeFull(fillNode2);
        node3.makeFull(fillNode3);
        node4.makeFull(fillNode4);
        node5.makeFull(fillNode5);

        expect(filter(node1)).toBe(true);
        expect(filter(node2)).toBe(true);
        expect(filter(node3)).toBe(false);
        expect(filter(node4)).toBe(false);
        expect(filter(node5)).toBe(false);
    });

    it("should compare <=, string", () => {
        let creator: Filter = new Filter();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createComparisonFilter(["<=", "sequenceKey", sequenceKey]);

        let coreNode1: ICoreNode = helper.createCoreNode();
        let coreNode2: ICoreNode = helper.createCoreNode();
        let coreNode3: ICoreNode = helper.createCoreNode();
        let coreNode4: ICoreNode = helper.createCoreNode();
        let coreNode5: ICoreNode = helper.createCoreNode();

        coreNode1.sequence.key = "-1";
        coreNode2.sequence.key = sequenceKey;
        coreNode3.sequence.key = "1";
        coreNode4.sequence.key = null;
        coreNode5.sequence.key = undefined;

        let node1: Node = new Node(coreNode1);
        let node2: Node = new Node(coreNode2);
        let node3: Node = new Node(coreNode3);
        let node4: Node = new Node(coreNode4);
        let node5: Node = new Node(coreNode4);

        expect(filter(node1)).toBe(true);
        expect(filter(node2)).toBe(true);
        expect(filter(node3)).toBe(false);
        expect(filter(node4)).toBe(false);
        expect(filter(node5)).toBe(false);
    });
});
