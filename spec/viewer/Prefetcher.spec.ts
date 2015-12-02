/// <reference path="../../typings/jasmine/jasmine.d.ts" />

import {Prefetcher} from "../../src/Viewer";

describe("Prefetcher", () => {
    var prefetcher: Prefetcher;

    beforeEach(() => {
        prefetcher = new Prefetcher("MkJKbDA0bnZuZlcxeTJHTmFqN3g1dzo5NWEzOTg3OWUxZDI3MjM4");
    });

    it("exists", () => {
        expect(prefetcher).toBeDefined();
    });

    it("should handle a cached hash", (done) => {
        prefetcher.loadFromHash('9q5f57x').then((data: any) => {
            prefetcher.loadFromHash('9q5f57x').then((data: any) => {
                done();
            });
        });
    });
});
