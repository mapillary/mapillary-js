/// <reference path="../../typings/jasmine/jasmine.d.ts" />

import {IAPINavIm, IAPINavImS, IAPINavImIm, APIv2} from "../../src/API";
import {GraphService, MyGraph, Node} from "../../src/Graph";

describe("GraphService", () => {
    var graphService: GraphService;

    beforeEach(() => {
        graphService = new GraphService("MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4");
    });

    it("exists", () => {
        expect(graphService).toBeDefined();
    });

    it("can subscribe to the graph", (done) => {
        graphService.getNode("gAktPQ48LwONPDLyODMkbA").subscribe((node: Node): void => {
            graphService.getNode("gAktPQ48LwONPDLyODMkbA").subscribe((node: Node): void => {
                done();
            });
        });
    });
});
