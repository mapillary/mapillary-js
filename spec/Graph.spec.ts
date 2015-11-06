/// <reference path="../typings/jasmine/jasmine.d.ts" />

declare var Mapillary: any;
var viewer = new Mapillary.Viewer('mapillary', 'MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzozODVmNDk5ODE2ZDFiZWZm');

describe("Graph", () => {
    var graph = viewer.graph;

    it("exists", () => {
        expect(graph).toBeDefined();
    });
});

describe("Graph.insertNodes", () => {
    var graph = viewer.graph;

    it("should have the correct sequence and skey", () => {
        var key1 = 'key1';
        var skey1 = 'skey1';

        var data = {
            ims: [
                {key: key1}
            ],
            ss: [
                {key: skey1, keys: [key1]}
            ]
        }

        graph.insertNodes(data);
        var node = graph.node(key1);

        expect(node.key).toEqual(key1);
        expect(node.sequence.key).toEqual(skey1);
    });
});
