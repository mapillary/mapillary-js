import { ViewerConfiguration } from "../../src/viewer/ViewerConfiguration";
import { ViewerOptions } from "../../src/viewer/options/ViewerOptions";

describe("Urls.setOptions", () => {
    it("should set all option properties", () => {
        const options: ViewerOptions = {
            apiClient: "api-client",
            container: "container-id",
            imageTiling: false,
            url: {
                exploreHost: "test-explore",
                scheme: "test-scheme",
            },
        };

        expect(ViewerConfiguration.imageTiling).toBe(true);
        expect(ViewerConfiguration.explore).toBe("https://www.mapillary.com");

        ViewerConfiguration.setOptions(options);

        expect(ViewerConfiguration.imageTiling).toBe(false);
        expect(ViewerConfiguration.explore).not.toContain("https");
        expect(ViewerConfiguration.explore).not.toContain("mapillary");
        expect(ViewerConfiguration.explore).toContain(options.url.scheme);
        expect(ViewerConfiguration.explore).toContain(options.url.exploreHost);
    });
});
