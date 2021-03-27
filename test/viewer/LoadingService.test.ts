import { LoadingService } from "../../src/viewer/LoadingService";

describe("LoadingService", () => {
    let loadingService: LoadingService;

    beforeEach(() => {
        loadingService = new LoadingService();
    });

    it("should be initialized to not loading", (done: Function) => {
        loadingService.loading$
            .subscribe((loading: boolean) => {
                expect(loading).toBe(false);
                done();
            });
    });
});
