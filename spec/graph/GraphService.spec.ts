/// <reference path="../../typings/browser.d.ts" />

import * as when from "when";

import {IAPINavIm, APIv2, APIv3} from "../../src/API";
import {GraphService, Graph, Node} from "../../src/Graph";

describe("GraphService", () => {
    var apiV2: APIv2;
    var apiV3: APIv3;
    var graphService: GraphService;

    beforeEach(() => {
        apiV2 = new APIv2("MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4");
        apiV3 = new APIv3("MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4");
        graphService = new GraphService(apiV2, apiV3);

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

    it("contains an empty graph from the start", (done) => {
        graphService.graph$.subscribe((graph: Graph) => {
            done();
        })
    });

//    it("should get a key", (done) => {
//        graphService.getNode("A").subscribe((node: Node): void => {
//            done();
//        });
//    });
});
