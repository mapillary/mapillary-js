import { NodeHelper } from "../helper/NodeHelper";
import { Node } from "../../src/graph/Node";
import { CoreImageEnt } from "../../src/api/ents/CoreImageEnt";
import { SpatialImageEnt } from "../../src/api/ents/SpatialImageEnt";
import { FilterCreator, FilterFunction } from "../../src/graph/FilterCreator";

/**
 * Implementation based on https://github.com/mapbox/feature-filter.
 */
describe("FilterCreator.ctor", () => {
    it("should create a filter", () => {
        let filter: FilterCreator = new FilterCreator();

        expect(filter).toBeDefined();
    });
});

describe("FilterCreator.createFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should compare ==, string", () => {
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "skey";
        let filter: FilterFunction = creator.createFilter(["==", "sequenceId", sequenceKey]);

        let coreNode1: CoreImageEnt = helper.createCoreNode();
        let coreNode2: CoreImageEnt = helper.createCoreNode();
        let coreNode3: CoreImageEnt = helper.createCoreNode();
        let coreNode4: CoreImageEnt = helper.createCoreNode();

        coreNode1.sequence.id = sequenceKey;
        coreNode2.sequence.id = sequenceKey + "w";
        coreNode3.sequence.id = null;
        coreNode4.sequence.id = undefined;

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
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter(["==", "capturedAt", capturedAt]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());

        let fillNode1: SpatialImageEnt = helper.createFillNode();
        let fillNode2: SpatialImageEnt = helper.createFillNode();
        let fillNode3: SpatialImageEnt = helper.createFillNode();
        let fillNode4: SpatialImageEnt = helper.createFillNode();

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
        let creator: FilterCreator = new FilterCreator();

        let filter = creator.createFilter(["==", "creatorId", null]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());

        let fillNode1: SpatialImageEnt = helper.createFillNode();
        let fillNode2: SpatialImageEnt = helper.createFillNode();
        let fillNode3: SpatialImageEnt = helper.createFillNode();
        let fillNode4: SpatialImageEnt = helper.createFillNode();

        fillNode1.creator.id = null;
        fillNode2.creator.id = "ukey";
        fillNode3.creator.id = "null";
        fillNode4.creator.id = undefined;

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

describe("FilterCreator.createFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should compare !=, string", () => {
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "skey";
        let filter: FilterFunction = creator.createFilter(["!=", "sequenceId", sequenceKey]);

        let coreNode1: CoreImageEnt = helper.createCoreNode();
        let coreNode2: CoreImageEnt = helper.createCoreNode();
        let coreNode3: CoreImageEnt = helper.createCoreNode();
        let coreNode4: CoreImageEnt = helper.createCoreNode();

        coreNode1.sequence.id = sequenceKey;
        coreNode2.sequence.id = sequenceKey + "w";
        coreNode3.sequence.id = null;
        coreNode4.sequence.id = undefined;

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
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter(["!=", "capturedAt", capturedAt]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());

        let fillNode1: SpatialImageEnt = helper.createFillNode();
        let fillNode2: SpatialImageEnt = helper.createFillNode();
        let fillNode3: SpatialImageEnt = helper.createFillNode();
        let fillNode4: SpatialImageEnt = helper.createFillNode();

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
        let creator: FilterCreator = new FilterCreator();

        let filter = creator.createFilter(["!=", "creatorId", null]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());

        let fillNode1: SpatialImageEnt = helper.createFillNode();
        let fillNode2: SpatialImageEnt = helper.createFillNode();
        let fillNode3: SpatialImageEnt = helper.createFillNode();
        let fillNode4: SpatialImageEnt = helper.createFillNode();

        fillNode1.creator.id = null;
        fillNode2.creator.id = "ukey";
        fillNode3.creator.id = "null";
        fillNode4.creator.id = undefined;

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

describe("FilterCreator.createFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should compare >, number", () => {
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter([">", "capturedAt", capturedAt]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());
        let node5: Node = new Node(helper.createCoreNode());

        let fillNode1: SpatialImageEnt = helper.createFillNode();
        let fillNode2: SpatialImageEnt = helper.createFillNode();
        let fillNode3: SpatialImageEnt = helper.createFillNode();
        let fillNode4: SpatialImageEnt = helper.createFillNode();
        let fillNode5: SpatialImageEnt = helper.createFillNode();

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
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createFilter([">", "sequenceId", sequenceKey]);

        let coreNode1: CoreImageEnt = helper.createCoreNode();
        let coreNode2: CoreImageEnt = helper.createCoreNode();
        let coreNode3: CoreImageEnt = helper.createCoreNode();
        let coreNode4: CoreImageEnt = helper.createCoreNode();
        let coreNode5: CoreImageEnt = helper.createCoreNode();

        coreNode1.sequence.id = "-1";
        coreNode2.sequence.id = sequenceKey;
        coreNode3.sequence.id = "1";
        coreNode4.sequence.id = null;
        coreNode5.sequence.id = undefined;

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

describe("FilterCreator.createFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should compare >=, number", () => {
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter([">=", "capturedAt", capturedAt]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());
        let node5: Node = new Node(helper.createCoreNode());

        let fillNode1: SpatialImageEnt = helper.createFillNode();
        let fillNode2: SpatialImageEnt = helper.createFillNode();
        let fillNode3: SpatialImageEnt = helper.createFillNode();
        let fillNode4: SpatialImageEnt = helper.createFillNode();
        let fillNode5: SpatialImageEnt = helper.createFillNode();

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
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createFilter([">=", "sequenceId", sequenceKey]);

        let coreNode1: CoreImageEnt = helper.createCoreNode();
        let coreNode2: CoreImageEnt = helper.createCoreNode();
        let coreNode3: CoreImageEnt = helper.createCoreNode();
        let coreNode4: CoreImageEnt = helper.createCoreNode();
        let coreNode5: CoreImageEnt = helper.createCoreNode();

        coreNode1.sequence.id = "-1";
        coreNode2.sequence.id = sequenceKey;
        coreNode3.sequence.id = "1";
        coreNode4.sequence.id = null;
        coreNode5.sequence.id = undefined;

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

describe("FilterCreator.createFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should compare <, number", () => {
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter(["<", "capturedAt", capturedAt]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());
        let node5: Node = new Node(helper.createCoreNode());

        let fillNode1: SpatialImageEnt = helper.createFillNode();
        let fillNode2: SpatialImageEnt = helper.createFillNode();
        let fillNode3: SpatialImageEnt = helper.createFillNode();
        let fillNode4: SpatialImageEnt = helper.createFillNode();
        let fillNode5: SpatialImageEnt = helper.createFillNode();

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
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createFilter(["<", "sequenceId", sequenceKey]);

        let coreNode1: CoreImageEnt = helper.createCoreNode();
        let coreNode2: CoreImageEnt = helper.createCoreNode();
        let coreNode3: CoreImageEnt = helper.createCoreNode();
        let coreNode4: CoreImageEnt = helper.createCoreNode();
        let coreNode5: CoreImageEnt = helper.createCoreNode();

        coreNode1.sequence.id = "-1";
        coreNode2.sequence.id = sequenceKey;
        coreNode3.sequence.id = "1";
        coreNode4.sequence.id = null;
        coreNode5.sequence.id = undefined;

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

describe("FilterCreator.createFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should compare <=, number", () => {
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter(["<=", "capturedAt", capturedAt]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());
        let node5: Node = new Node(helper.createCoreNode());

        let fillNode1: SpatialImageEnt = helper.createFillNode();
        let fillNode2: SpatialImageEnt = helper.createFillNode();
        let fillNode3: SpatialImageEnt = helper.createFillNode();
        let fillNode4: SpatialImageEnt = helper.createFillNode();
        let fillNode5: SpatialImageEnt = helper.createFillNode();

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
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createFilter(["<=", "sequenceId", sequenceKey]);

        let coreNode1: CoreImageEnt = helper.createCoreNode();
        let coreNode2: CoreImageEnt = helper.createCoreNode();
        let coreNode3: CoreImageEnt = helper.createCoreNode();
        let coreNode4: CoreImageEnt = helper.createCoreNode();
        let coreNode5: CoreImageEnt = helper.createCoreNode();

        coreNode1.sequence.id = "-1";
        coreNode2.sequence.id = sequenceKey;
        coreNode3.sequence.id = "1";
        coreNode4.sequence.id = null;
        coreNode5.sequence.id = undefined;

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

describe("FilterCreator.createFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should test in, number", () => {
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter(["in", "capturedAt", capturedAt]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());
        let node5: Node = new Node(helper.createCoreNode());

        let fillNode1: SpatialImageEnt = helper.createFillNode();
        let fillNode2: SpatialImageEnt = helper.createFillNode();
        let fillNode3: SpatialImageEnt = helper.createFillNode();
        let fillNode4: SpatialImageEnt = helper.createFillNode();
        let fillNode5: SpatialImageEnt = helper.createFillNode();

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
        expect(filter(node3)).toBe(false);
        expect(filter(node4)).toBe(false);
        expect(filter(node5)).toBe(false);
    });

    it("should test in, string", () => {
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createFilter(["in", "sequenceId", sequenceKey]);

        let coreNode1: CoreImageEnt = helper.createCoreNode();
        let coreNode2: CoreImageEnt = helper.createCoreNode();
        let coreNode3: CoreImageEnt = helper.createCoreNode();
        let coreNode4: CoreImageEnt = helper.createCoreNode();
        let coreNode5: CoreImageEnt = helper.createCoreNode();

        coreNode1.sequence.id = "-1";
        coreNode2.sequence.id = sequenceKey;
        coreNode3.sequence.id = "1";
        coreNode4.sequence.id = null;
        coreNode5.sequence.id = undefined;

        let node1: Node = new Node(coreNode1);
        let node2: Node = new Node(coreNode2);
        let node3: Node = new Node(coreNode3);
        let node4: Node = new Node(coreNode4);
        let node5: Node = new Node(coreNode4);

        expect(filter(node1)).toBe(false);
        expect(filter(node2)).toBe(true);
        expect(filter(node3)).toBe(false);
        expect(filter(node4)).toBe(false);
        expect(filter(node5)).toBe(false);
    });

    it("should test in, null", () => {
        let creator: FilterCreator = new FilterCreator();

        let filter: FilterFunction = creator.createFilter(["in", "sequenceId", null]);

        let coreNode1: CoreImageEnt = helper.createCoreNode();
        let coreNode2: CoreImageEnt = helper.createCoreNode();
        let coreNode3: CoreImageEnt = helper.createCoreNode();

        coreNode1.sequence.id = "1";
        coreNode2.sequence.id = null;
        coreNode3.sequence.id = undefined;

        let node1: Node = new Node(coreNode1);
        let node2: Node = new Node(coreNode2);
        let node3: Node = new Node(coreNode3);

        expect(filter(node1)).toBe(false);
        expect(filter(node2)).toBe(true);
        expect(filter(node3)).toBe(false);
    });

    it("should test in, multiple", () => {
        let creator: FilterCreator = new FilterCreator();

        let filter: FilterFunction = creator.createFilter(["in", "capturedAt", 0, 1]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());

        let fillNode1: SpatialImageEnt = helper.createFillNode();
        let fillNode2: SpatialImageEnt = helper.createFillNode();
        let fillNode3: SpatialImageEnt = helper.createFillNode();

        fillNode1.captured_at = 0;
        fillNode2.captured_at = 1;
        fillNode3.captured_at = 2;

        node1.makeFull(fillNode1);
        node2.makeFull(fillNode2);
        node3.makeFull(fillNode3);

        expect(filter(node1)).toBe(true);
        expect(filter(node2)).toBe(true);
        expect(filter(node3)).toBe(false);
    });

    it("should test in, large multiple", () => {
        let creator: FilterCreator = new FilterCreator();

        let numbers: number[] = Array.apply(null, { length: 2000 }).map(Number.call, Number);
        let filterDefinition: (string | number)[] = [].concat(["in", "capturedAt"]).concat(numbers);

        let filter: FilterFunction = creator.createFilter(filterDefinition);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());

        let fillNode1: SpatialImageEnt = helper.createFillNode();
        let fillNode2: SpatialImageEnt = helper.createFillNode();
        let fillNode3: SpatialImageEnt = helper.createFillNode();
        let fillNode4: SpatialImageEnt = helper.createFillNode();

        fillNode1.captured_at = 0;
        fillNode2.captured_at = 1;
        fillNode3.captured_at = 1999;
        fillNode4.captured_at = 2000;

        node1.makeFull(fillNode1);
        node2.makeFull(fillNode2);
        node3.makeFull(fillNode3);
        node4.makeFull(fillNode4);

        expect(filter(node1)).toBe(true);
        expect(filter(node2)).toBe(true);
        expect(filter(node3)).toBe(true);
        expect(filter(node4)).toBe(false);
    });
});

describe("FilterCreator.createFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should test !in, number", () => {
        let creator: FilterCreator = new FilterCreator();

        let capturedAt: number = 1;
        let filter: FilterFunction = creator.createFilter(["!in", "capturedAt", capturedAt]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());
        let node5: Node = new Node(helper.createCoreNode());

        let fillNode1: SpatialImageEnt = helper.createFillNode();
        let fillNode2: SpatialImageEnt = helper.createFillNode();
        let fillNode3: SpatialImageEnt = helper.createFillNode();
        let fillNode4: SpatialImageEnt = helper.createFillNode();
        let fillNode5: SpatialImageEnt = helper.createFillNode();

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
        expect(filter(node3)).toBe(true);
        expect(filter(node4)).toBe(true);
        expect(filter(node5)).toBe(true);
    });

    it("should test !in, string", () => {
        let creator: FilterCreator = new FilterCreator();

        let sequenceKey: string = "0";
        let filter: FilterFunction = creator.createFilter(["!in", "sequenceId", sequenceKey]);

        let coreNode1: CoreImageEnt = helper.createCoreNode();
        let coreNode2: CoreImageEnt = helper.createCoreNode();
        let coreNode3: CoreImageEnt = helper.createCoreNode();
        let coreNode4: CoreImageEnt = helper.createCoreNode();
        let coreNode5: CoreImageEnt = helper.createCoreNode();

        coreNode1.sequence.id = "-1";
        coreNode2.sequence.id = sequenceKey;
        coreNode3.sequence.id = "1";
        coreNode4.sequence.id = null;
        coreNode5.sequence.id = undefined;

        let node1: Node = new Node(coreNode1);
        let node2: Node = new Node(coreNode2);
        let node3: Node = new Node(coreNode3);
        let node4: Node = new Node(coreNode4);
        let node5: Node = new Node(coreNode4);

        expect(filter(node1)).toBe(true);
        expect(filter(node2)).toBe(false);
        expect(filter(node3)).toBe(true);
        expect(filter(node4)).toBe(true);
        expect(filter(node5)).toBe(true);
    });

    it("should test !in, null", () => {
        let creator: FilterCreator = new FilterCreator();

        let filter: FilterFunction = creator.createFilter(["!in", "sequenceId", null]);

        let coreNode1: CoreImageEnt = helper.createCoreNode();
        let coreNode2: CoreImageEnt = helper.createCoreNode();
        let coreNode3: CoreImageEnt = helper.createCoreNode();

        coreNode1.sequence.id = "1";
        coreNode2.sequence.id = null;
        coreNode3.sequence.id = undefined;

        let node1: Node = new Node(coreNode1);
        let node2: Node = new Node(coreNode2);
        let node3: Node = new Node(coreNode3);

        expect(filter(node1)).toBe(true);
        expect(filter(node2)).toBe(false);
        expect(filter(node3)).toBe(true);
    });

    it("should test !in, multiple", () => {
        let creator: FilterCreator = new FilterCreator();

        let filter: FilterFunction = creator.createFilter(["!in", "capturedAt", 0, 1]);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());

        let fillNode1: SpatialImageEnt = helper.createFillNode();
        let fillNode2: SpatialImageEnt = helper.createFillNode();
        let fillNode3: SpatialImageEnt = helper.createFillNode();

        fillNode1.captured_at = 0;
        fillNode2.captured_at = 1;
        fillNode3.captured_at = 2;

        node1.makeFull(fillNode1);
        node2.makeFull(fillNode2);
        node3.makeFull(fillNode3);

        expect(filter(node1)).toBe(false);
        expect(filter(node2)).toBe(false);
        expect(filter(node3)).toBe(true);
    });

    it("should test !in, large multiple", () => {
        let creator: FilterCreator = new FilterCreator();

        let numbers: number[] = Array.apply(null, { length: 2000 }).map(Number.call, Number);
        let filterDefinition: (string | number)[] = [].concat(["!in", "capturedAt"]).concat(numbers);

        let filter: FilterFunction = creator.createFilter(filterDefinition);

        let node1: Node = new Node(helper.createCoreNode());
        let node2: Node = new Node(helper.createCoreNode());
        let node3: Node = new Node(helper.createCoreNode());
        let node4: Node = new Node(helper.createCoreNode());

        let fillNode1: SpatialImageEnt = helper.createFillNode();
        let fillNode2: SpatialImageEnt = helper.createFillNode();
        let fillNode3: SpatialImageEnt = helper.createFillNode();
        let fillNode4: SpatialImageEnt = helper.createFillNode();

        fillNode1.captured_at = 0;
        fillNode2.captured_at = 1;
        fillNode3.captured_at = 1999;
        fillNode4.captured_at = 2000;

        node1.makeFull(fillNode1);
        node2.makeFull(fillNode2);
        node3.makeFull(fillNode3);
        node4.makeFull(fillNode4);

        expect(filter(node1)).toBe(false);
        expect(filter(node2)).toBe(false);
        expect(filter(node3)).toBe(false);
        expect(filter(node4)).toBe(true);
    });
});

describe("FilterCreator.createFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should test all", () => {
        let creator: FilterCreator = new FilterCreator();

        let node: Node = new Node(helper.createCoreNode());
        let fillNode: SpatialImageEnt = helper.createFillNode();
        fillNode.captured_at = 1;
        node.makeFull(fillNode);

        let filter1: FilterFunction = creator.createFilter(["all"]);
        expect(filter1(node)).toBe(true);

        let filter2: FilterFunction = creator.createFilter(["all", ["==", "capturedAt", 1]]);
        expect(filter2(node)).toBe(true);

        let filter3: FilterFunction = creator.createFilter(["all", ["==", "capturedAt", 0]]);
        expect(filter3(node)).toBe(false);

        let filter4: FilterFunction = creator.createFilter(["all", ["==", "capturedAt", 0], ["==", "capturedAt", 1]]);
        expect(filter4(node)).toBe(false);
    });
});

describe("FilterCreator.createFilter", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should default to true", () => {
        let creator: FilterCreator = new FilterCreator();

        let node: Node = new Node(helper.createCoreNode());

        let filter1: FilterFunction = creator.createFilter(null);
        expect(filter1(node)).toBe(true);

        let filter2: FilterFunction = creator.createFilter(undefined);
        expect(filter2(node)).toBe(true);

        let filter3: FilterFunction = creator.createFilter(["test"]);
        expect(filter3(node)).toBe(true);
    });
});
