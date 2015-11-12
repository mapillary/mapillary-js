/// <reference path="../../typings/jasmine/jasmine.d.ts" />

declare var Mapillary: any;

describe("EdgeCalculator", () => {
    var graph: any;
    var edgeCalculator: any;

    beforeEach(() => {
        graph = new Mapillary.Graph()
    });

    it("should create an edgeCalculator", () => {
        expect(graph.edgeCalculator).toBeDefined();
    });

    it("should create the simplest sequence graph", () => {
        var key1 = "key1";
        var key2 = "key2";
        var key3 = "key3";
        var skey1 = "skey1";

        var data = {
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

        let nextEdges = edges[Mapillary.GraphConstants.DirEnum.NEXT];
        let prevEdges = edges[Mapillary.GraphConstants.DirEnum.PREV];

        expect(prevEdges.length).toBe(1);
        expect(nextEdges.length).toBe(1);

        expect(prevEdges[0]).toBe(key1);
        expect(nextEdges[0]).toBe(key3);
    });
});
