/// <reference path="../typings/jasmine/jasmine.d.ts" />
/// <reference path="../typings/when/when.d.ts" />

import * as when from "when";

import {Graph, Prefetcher, Node} from "../src/Graph";
import {IAPINavIm} from "../src/API";

describe("Graph", () => {
    var graph: Graph;

    beforeEach(() => {
        graph = new Graph("clientId")
    });

    it("exists", () => {
        expect(graph).toBeDefined();
    });

    it("should have the correct sequence and skey", () => {
        var key1: string = "key1";
        var skey1: string = "skey1";

        var data: IAPINavIm = {
            hs: [],
            ims: [
                { key: key1 }
            ],
            ss: [
                { key: skey1, keys: [key1] }
            ]
        };

        graph.insertNodes(data);
        var node = graph.node(key1);

        expect(node.key).toEqual(key1);
        expect(node.sequence.key).toEqual(skey1);
    });


    it("should have the same sequence key", () => {
        var key1: string = "key1";
        var key2: string = "key2";
        var skey1: string = "skey1";

        var data: IAPINavIm = {
            hs: [],
            ims: [
                { key: key1 },
                { key: key2 }
            ],
            ss: [
                { key: skey1, keys: [key1, key2] }
            ]
        };

        graph.insertNodes(data);

        var node: Node = graph.node(key1);
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

        var data: IAPINavIm = {
            hs: [],
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

        var node: Node = graph.node(key1);

        expect(node.key).toEqual(key1);
        expect(node.sequence.key).toEqual(skey1);

        node = graph.node(key2);

        expect(node.key).toEqual(key2);
        expect(node.sequence.key).toEqual(skey2);
    });
});

describe("Graph.getNode", () => {
    let prefetcher: Prefetcher;
    let graph: Graph;

    beforeEach(() => {
        prefetcher = new Prefetcher("clientId");
        graph = new Graph("clientId", prefetcher);
    });

    it("should prefetch and return node", (done) => {
        let key: string = "key";

        spyOn(prefetcher, 'loadFromKey').and.callFake(() => {
            let deferred: when.Deferred<IAPINavIm> = when.defer<IAPINavIm>();
            let result: IAPINavIm = {
                hs: [],
                ims: [{key: key}],
                ss: [],
            };

            deferred.resolve(result);
            return deferred.promise;
        });

        graph.getNode(key).then((node: Node) => {
            expect(node.apiNavImIm.key).toBe(key);
            expect(prefetcher.loadFromKey).toHaveBeenCalled();

            done();
        });
    });
});
