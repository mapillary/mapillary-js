/// <reference path="../../typings/index.d.ts" />

import {LoadingService} from "../../src/Viewer";

describe("LoadingService", () => {
    let loadingService: LoadingService;

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
