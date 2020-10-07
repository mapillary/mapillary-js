import { Urls } from "../../src/Utils";
import { IUrlOptions } from "../../src/Viewer";

describe("Urls.setOptions", () => {
    it("should set all option properties", () => {
        const options: IUrlOptions = {
            exploreHost: "test-explore",
            scheme: "test-scheme",
        };

        Urls.setOptions(options);

        expect(Urls.explore).toContain(options.exploreHost);
        expect(Urls.explore).toContain(options.scheme);
    });
});
