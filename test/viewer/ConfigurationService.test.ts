import { ConfigurationService } from "../../src/viewer/ConfigurationService";
import { ViewerOptions } from "../../src/viewer/options/ViewerOptions";

describe("ConfigurationService.ctor", () => {
    it("should set all option properties", () => {
        const options: ViewerOptions = { container: "container-id" };
        const service = new ConfigurationService(options);

        expect(service).toBeDefined();

    });
});

describe("ConfigurationService.exploreHost$", () => {
    it("should emit default URL on each subscription", () => {
        const options: ViewerOptions = { container: "container-id" };

        const service = new ConfigurationService(options);

        let count = 0;
        service.exploreUrl$.subscribe(
            url => {
                count++;
                expect(url).toBe("https://www.mapillary.com");
            });
        service.exploreUrl$.subscribe(
            url => {
                count++;
                expect(url).toBe("https://www.mapillary.com");
            });

        expect(count).toBe(2);
    });

    it("should emit configured URL", (done: Function) => {
        const options: ViewerOptions = {
            container: "container-id",
            url: {
                exploreHost: "test-explore",
                scheme: "test-scheme",
            },
        };

        const service = new ConfigurationService(options);

        service.exploreUrl$.subscribe(
            url => {
                expect(url).toBe("test-scheme://test-explore");
                done();
            });
    });
});

describe("ConfigurationService.imageTiling$", () => {
    it("should emit default value on each subscription", () => {
        const options: ViewerOptions = { container: "container-id" };

        const service = new ConfigurationService(options);

        let count = 0;
        service.imageTiling$.subscribe(
            active => {
                count++;
                expect(active).toBe(true);
            });
        service.imageTiling$.subscribe(
            active => {
                count++;
                expect(active).toBe(true);
            });

        expect(count).toBe(2);
    });

    it("should emit configured value", (done: Function) => {
        const options: ViewerOptions = {
            container: "container-id",
            imageTiling: false,
        };

        const service = new ConfigurationService(options);

        service.imageTiling$.subscribe(
            active => {
                expect(active).toBe(false);
                done();
            });
    });
});
