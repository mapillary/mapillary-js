/// <reference path="../../typings/jasmine/jasmine.d.ts" />

import {AssetCache, AssetService} from "../../src/Graph";

describe("AssetService", () => {
    var assetService: AssetService;

    beforeEach(() => {
        assetService = new AssetService();
    });

    it("exists", () => {
        expect(assetService).toBeDefined();
    });

    it("can cache a node", (done) => {
        assetService.cache("TQiOw3g0PDxyJrVdfqaYYQ").subscribe((key: string) => {
            console.log(key);
            done();
        });
    });
});
