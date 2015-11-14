/// <reference path="../../typings/jasmine/jasmine.d.ts" />

declare var Mapillary: any;

describe("Prefetcher", () => {
    var prefetcher: any;

    beforeEach(() => {
        var viewer = new Mapillary.Viewer('mapillary', 'MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4', {ui: "none", uiList: ["none"]});
        prefetcher = viewer.prefetcher;
    });

    it("exists", () => {
        expect(prefetcher).toBeDefined();
    });

    it("should handle a cached hash", (done) => {
        prefetcher.loadFromHash('u3ck26t').then((data: any) => {
            prefetcher.loadFromHash('u3ck26t').then((data: any) => {
                done();
            });
        });
    });
});
