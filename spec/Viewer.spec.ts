///<reference path="../typings/jasmine/jasmine.d.ts" />

import {Viewer} from "../src/Viewer";
import {GraphConstants} from "../src/Graph";

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
        var response: any = viewer.moveToKey("TQiOw3g0PDxyJrVdfqaYYQ");

        response.then((node: any) => {
            expect(node.key).toBe("TQiOw3g0PDxyJrVdfqaYYQ");
            response = viewer.moveDir(GraphConstants.DirEnum.NEXT);

            response.then((node: any) => {
                expect(node.key).toBe("sY_oYi8xaFME4coAB2Rl1w");
                done();
            });
        });
    });
});
