/// <reference path="../../typings/jasmine/jasmine.d.ts" />

import {AssetCache} from "../../src/Viewer";
import {Node} from "../../src/Graph"

describe("AssetCache", () => {
    var assetCache: any;
    var node: any;

    beforeEach(() => {
        assetCache = new AssetCache();
        node = new Node("XkK3qsRg9j9UY5jTg8BKGQ", 0, {lon: 0, lat: 0}, true, null, null);
    });

    it("exists", () => {
        expect(assetCache).toBeDefined();
    });

    it("should not be able to enable faulty asset", () => {
        expect(assetCache.enableAsset("faulty")).toBe(false);
    });

    it("should enable image and mesh caches", () => {
        expect(assetCache.enableAsset("image")).toBe(true);
        expect(assetCache.enableAsset("mesh")).toBe(true);
    });

    it("should enable image and mesh caches", (done) => {
        assetCache.enableAsset("image");
        assetCache.cache([node]).then((data: any) => {
            console.log(data);
            done();
        });
    });
});
