/// <reference path="../../typings/jasmine/jasmine.d.ts" />

import {LoadingService} from "../../src/Viewer";

describe("LoadingService", () => {
    var loadingService: LoadingService;

    beforeEach(() => {
        loadingService = new LoadingService();
    });

    it("should be able to set loading", (done) => {
        loadingService.startLoading("test");

        let i: number = 0;
        let ib: boolean[] = [false, true, false];
        loadingService.loading$.subscribe((loading: boolean) => {
            expect(loading).toBe(ib[i]);
            i++;
            done();
        });

        let k: number = 0;
        let kb: boolean[] = [false, true, false];
        loadingService.taskLoading$("test").subscribe((loading: boolean) => {
            expect(loading).toBe(kb[k]);
            k++;
            done();
        });

        loadingService.stopLoading("test");
        loadingService.startLoading("test");
        loadingService.startLoading("test2");
        loadingService.stopLoading("test");
        loadingService.stopLoading("test2");
    });
});
