/// <reference path="../../typings/jasmine/jasmine.d.ts" />

import {LoadingService} from "../../src/Viewer";

describe("LoadingService", () => {
    var loadingService: LoadingService;

    beforeEach(() => {
        loadingService = new LoadingService();
    });

    it("should emit loading status", (done) => {
        loadingService.loading$.subscribe((loading: boolean) => {
            expect(loading).toBe(true);
            done();
        });

        loadingService.startLoading("task");
    });

    it("should emit not loading status", (done) => {
        loadingService.startLoading("test");

        loadingService.loading$.subscribe((loading: boolean) => {
            expect(loading).toBe(false);
            done();
        });

        loadingService.stopLoading("task");
    });
});
