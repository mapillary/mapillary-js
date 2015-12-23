///<reference path="../typings/jasmine/jasmine.d.ts" />

import {EdgeConstants} from "../src/Edge";
import {MyGraph, Node} from "../src/Graph";
import {Viewer} from "../src/Viewer";

describe("Viewer", () => {
    var viewer: Viewer;

    beforeEach(() => {
        viewer = new Viewer("mapillary", "MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4", {uis: ["none"], uiList: ["none"]})
    });

    it("exists", () => {
        expect(viewer).toBeDefined();
    });

    it("should throw error if key is not set", () => {
        expect(() => {
            viewer.moveToKey(null);
        }).toThrowError("The function was not called with correct parameters");
    });

    it("should move to a key", (done) => {
        // viewer.thisLoading.subscribe((loading: boolean) => {
        //     console.log(`Loading Viewer: ${loading}`);
        // });

        viewer.moveToKey("TQiOw3g0PDxyJrVdfqaYYQ").first().subscribe((node: Node) => {
            expect(node.key).toBe("TQiOw3g0PDxyJrVdfqaYYQ");
            viewer.thisNode.first().subscribe((node: Node) => {
                expect(node.key).toBe("TQiOw3g0PDxyJrVdfqaYYQ");
                viewer.moveDir(EdgeConstants.Direction.NEXT).first().subscribe((node: Node) => {
                    expect(node.key).toBe("sY_oYi8xaFME4coAB2Rl1w");
                    viewer.thisNode.first().subscribe((node: Node) => {
                        expect(node.key).toBe("sY_oYi8xaFME4coAB2Rl1w");
                        done();
                    });
                });
            });
        });
    });

    it("should emulate a simple playbot", (done) => {
        let cNode: Node = null;

        viewer.moveToKey("TQiOw3g0PDxyJrVdfqaYYQ").first().subscribe();
        viewer.graphService.graph.combineLatest(viewer.thisNode, (myGraph: MyGraph, node: Node) => {
            // if (node !== cNode) {
            //     cNode = node;
            //     // console.log("################## NOT IGNORING");
            //     if (node != null) {
            //         console.log(node.key);
            //     }
            // } else {
            //     console.log("IGNORING");
            // }
            done();
        }).subscribe();
    });
});
