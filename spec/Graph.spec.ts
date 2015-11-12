/// <reference path="../typings/jasmine/jasmine.d.ts" />

declare var Mapillary: any;
describe("Graph", () => {
    it("exists", () => {
        var viewer = new Mapillary.Viewer("mapillary", "MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4");
        var graph = viewer.graph;
        expect(graph).toBeDefined();
    });
});

describe("Graph.insertNodes", () => {
    var graph: any;

    beforeEach(() => {
        graph = new Mapillary.Graph()
    });

    it("should have the correct sequence and skey", () => {
        var key1 = "key1";
        var skey1 = "skey1";

        var data = {
            ims: [
                {key: key1}
            ],
            ss: [
                {key: skey1, keys: [key1]}
            ]
        };

        graph.insertNodes(data);
        var node = graph.node(key1);

        expect(node.key).toEqual(key1);
        expect(node.sequence.key).toEqual(skey1);
    });


    it("should have the same sequence key", () => {
        var key1 = "key1";
        var key2 = "key2";
        var skey1 = "skey1";

        var data = {
            ims: [
                { key: key1 },
                { key: key2 }
            ],
            ss: [
                { key: skey1, keys: [key1, key2] }
            ]
        };

        graph.insertNodes(data);

        var node = graph.node(key1);
        expect(node.key).toEqual(key1);
        expect(node.sequence.key).toEqual(skey1);

        node = graph.node(key2);
        expect(node.key).toEqual(key2);
        expect(node.sequence.key).toEqual(skey1);
    });


    it("should have different sequence keys", () => {
        var key1 = "key1";
        var key2 = "key2";
        var skey1 = "skey1";
        var skey2 = "skey2";

        var data = {
            ims: [
                { key: key1 },
                { key: key2 }
            ],
            ss: [
                { key: skey1, keys: [key1] },
                { key: skey2, keys: [key2] }
            ]
        };

        graph.insertNodes(data);

        var node = graph.node(key1);

        expect(node.key).toEqual(key1);
        expect(node.sequence.key).toEqual(skey1);

        node = graph.node(key2);

        expect(node.key).toEqual(key2);
        expect(node.sequence.key).toEqual(skey2);
    });
});
