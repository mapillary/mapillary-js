/// <reference path="../../typings/browser.d.ts" />

import {LoadingService} from "../../src/Viewer";

describe("LoadingService", () => {
    var loadingService: LoadingService;

    beforeEach(() => {
        loadingService = new LoadingService();
    });

    it("should be initialized to not loading", (done) => {
        loadingService.loading$
            .subscribe((loading: boolean) => {
                expect(loading).toBe(false);
                done();
            });
    });
});
