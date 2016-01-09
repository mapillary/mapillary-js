/// <reference path="../../typings/jasmine/jasmine.d.ts" />
/// <reference path="../../typings/when/when.d.ts" />

import {IAPINavIm} from "../../src/API";
import {EdgeConstants} from "../../src/Edge";
import {Node} from "../../src/Graph";
import {Viewer} from "../../src/Viewer";

describe("Viewer", () => {
    var viewer: Viewer;

    beforeEach(() => {
        spyOn(document, 'getElementById').and.callFake(() => { return document.createElement('div'); });

        viewer = new Viewer("mapillary", "MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4", {uis: ["none"], uiList: ["none"]})
    });

    it("exists", () => {
        expect(viewer).toBeDefined();
    });

    // it("should throw error if key is not set", () => {
    //     expect(() => {
    //         viewer.moveToKey(null);
    //     }).toThrowError("The function was not called with correct parameters");
    // });

    // it("should move to a key", (done) => {
    //     spyOn(viewer.navigator.apiV2.nav, 'im').and.callFake(() => {
    //         let result: IAPINavIm = {
    //             hs: ["u3ck26d"],
    //             ims: [{key: "A", rotation: [0, -Math.PI / 2, 0], merge_version: 1, merge_cc: 1, lat: 0, lon: 0}],
    //             ss: [{key: "SA", keys: ["A", "B"]}],
    //         };
    //         return when(result);
    //     });
    //
    //     viewer.moveToKey("A").then((node: Node) => {
    //         expect(node.key).toBe("A");
    //         done();
    //         // viewer.moveDir(EdgeConstants.Direction.NEXT).first().subscribe((node: Node) => {
    //         //     expect(node.key).toBe("B");
    //         //     done();
    //         // });
    //     });
    // });
});
