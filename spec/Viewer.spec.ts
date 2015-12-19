///<reference path="../typings/jasmine/jasmine.d.ts" />

import {EdgeConstants} from "../src/Edge";
import {Node} from "../src/Graph";
import {Viewer} from "../src/Viewer";

describe("Viewer", () => {
    var viewer: Viewer;

    beforeEach(() => {
        viewer = new Viewer("mapillary", "MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4", {ui: "none", uiList: ["none"]})
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
        viewer.moveToKey("TQiOw3g0PDxyJrVdfqaYYQ").first().subscribe((node: Node) => {
            expect(node.key).toBe("TQiOw3g0PDxyJrVdfqaYYQ");
            viewer.moveDir(EdgeConstants.Direction.NEXT).first().subscribe((node: Node) => {
                expect(node.key).toBe("sY_oYi8xaFME4coAB2Rl1w");
                done();
            });
        });
    });
});
