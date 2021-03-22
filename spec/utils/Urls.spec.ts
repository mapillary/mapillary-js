import { Urls } from "../../src/utils/Urls";
import { UrlOptions } from "../../src/viewer/options/UrlOptions";

describe("Urls.setOptions", () => {
    it("should set all option properties", () => {
        const options: UrlOptions = {
            exploreHost: "test-explore",
            scheme: "test-scheme",
        };

        Urls.setOptions(options);

        expect(Urls.explore).toContain(options.exploreHost);
        expect(Urls.explore).toContain(options.scheme);
    });
});
