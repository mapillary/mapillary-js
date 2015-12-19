/// <reference path="../../typings/jasmine/jasmine.d.ts" />

import {CachedAsset, AssetCache} from "../../src/Graph";

describe("AssetCache", () => {
    var assetCache: AssetCache;

    beforeEach(() => {
        assetCache = new AssetCache();
    });

    it("exists", () => {
        expect(assetCache).toBeDefined();
    });

    it("can cache an asset", (done) => {
        let cachedAsset: CachedAsset = new CachedAsset();
        cachedAsset.cacheAssets("TQiOw3g0PDxyJrVdfqaYYQ").subscribe((key: string) => {
            done();
        });
    });
});
