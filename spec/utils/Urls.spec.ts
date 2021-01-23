import { Urls } from "../../src/utils/Urls";
import { IUrlOptions } from "../../src/viewer/interfaces/IUrlOptions";

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
