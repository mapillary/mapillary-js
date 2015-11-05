///<reference path="../typings/jasmine/jasmine.d.ts" />

declare var Mapillary: any;

import {API} from "../src/API";
var viewer = new Mapillary.Viewer('CLIENT_ID');

describe("API", () => {
    it("exists", () => {
        expect(viewer.api).toBeDefined();
    });
});
