/// <reference path="../../typings/jasmine/jasmine.d.ts" />

declare var Mapillary: any;

describe("Prefetcher", () => {
    console.log(Mapillary.Viewer);
    it("exists", () => {
        var viewer = new Mapillary.Viewer('mapillary', 'MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzozODVmNDk5ODE2ZDFiZWZm');
        var prefetcher = viewer.prefetcher;
        expect(prefetcher).toBeDefined();
    });

    it("should handle a cached hash", (done) => {
        var viewer = new Mapillary.Viewer('mapillary', 'MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzozODVmNDk5ODE2ZDFiZWZm');
        var prefetcher = viewer.prefetcher;
        prefetcher.loadFromHash('u3ck26t').then((data: any) => {
            prefetcher.loadFromHash('u3ck26t').then((data: any) => {
                done();
            });
        });
    });
});
