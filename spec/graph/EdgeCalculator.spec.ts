/// <reference path="../../typings/jasmine/jasmine.d.ts" />

import {EdgeCalculator, IPotentialEdge, Node, Graph, GraphConstants} from "../../src/Graph";
import {IAPINavIm} from "../../src/API";

describe("EdgeCalculator", () => {
    var graph: Graph;

    beforeEach(() => {
        graph = new Graph()
    });

    it("should create an edgeCalculator", () => {
        expect(graph.edgeCalculator).toBeDefined();
    });

    it("should create the simplest sequence graph", () => {
        var key1 = "key1";
        var key2 = "key2";
        var key3 = "key3";
        var skey1 = "skey1";

        var data: IAPINavIm = {
            hs: [],
            ims: [
                { key: key1 },
                { key: key2 },
                { key: key3 }
            ],
            ss: [
                { key: skey1, keys: [key1, key2, key3] }
            ]
        };

        graph.insertNodes(data);
        let edges: any = graph.edgeCalculator.calculateEdges(graph.node(key2));

        let nextEdges = edges[GraphConstants.DirEnum.NEXT];
        let prevEdges = edges[GraphConstants.DirEnum.PREV];

        expect(prevEdges.length).toBe(1);
        expect(nextEdges.length).toBe(1);

        expect(prevEdges[0]).toBe(key1);
        expect(nextEdges[0]).toBe(key3);
    });
});

describe("EdgeCalculator.getPotentialEdges", () => {
    let edgeCalculator: EdgeCalculator;

    beforeEach(() => {
        edgeCalculator = new EdgeCalculator()
    });

    it("should return empty array when node is not worthy", () => {
        let node: Node = new Node("key", 0, null, false, null, null, null);

        let result: IPotentialEdge[] =
            edgeCalculator.getPotentialEdges(node, null, null, null);

        expect(result.length).toBe(0);
    });
});
