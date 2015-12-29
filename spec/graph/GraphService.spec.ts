/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/when/when.d.ts" />

import * as when from "when";

import {IAPINavIm} from "../../src/API";
import {GraphService, MyGraph, Node} from "../../src/Graph";

describe("GraphService", () => {
    var graphService: GraphService;

    beforeEach(() => {
        graphService = new GraphService("MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4");

//        spyOn(graphService.tilesService.apiV2.nav, 'im').and.callFake(() => {
//            let result: IAPINavIm = {
//                hs: ["H"],
//                ims: [{key: "A"}],
//                ss: [],
//            };
//
//            return when(result);
//        });

    });

    it("exists", () => {
        expect(graphService).toBeDefined();
    });

//    it("gets an error on faulty key", (done) => {
//        graphService.getNode(key).subscribe((node: Node): void => {
//            console.log("SHOULD NOT BE REACHED OOOO");
//            done();
//        });
//    });
});
