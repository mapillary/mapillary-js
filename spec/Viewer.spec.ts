///<reference path="../typings/jasmine/jasmine.d.ts" />

declare var Mapillary: any;

import {Viewer} from "../src/Viewer";
var viewer = new Mapillary.Viewer('test', {'node': 'testing'});

describe("Viewer", () => {
    it("exists", () => {
        expect(viewer).toBeDefined();
    });
});

describe("Viewer.moveToKey", () => {
    it("should throw error if key is not set", () => {
        expect(() => {
            viewer.moveToKey(null);
        }).toThrowError("The function was not called with correct parameters");
    });

    it("should move to a key", () => {
        viewer.moveToKey("h_tzkTklF6DZfU5plCA9Cw");
    });
});
