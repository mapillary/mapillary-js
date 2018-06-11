import {Urls} from "../../src/Utils";
import {IUrlOptions} from "../../src/Viewer";

describe("Urls.setOptions", () => {
    it("should set all option properties", () => {
        const options: IUrlOptions = {
            apiHost: "test-api",
            exploreHost: "test-explore",
            imageHost: "test-image",
            imageTileHost: "test-imageTile",
            meshHost: "test-mesh",
            scheme: "test-scheme",
        };

        Urls.setOptions(options);

        expect(Urls.falcorModel("client-id")).toContain(options.apiHost);
        expect(Urls.explore).toContain(options.exploreHost);
        expect(Urls.thumbnail("key", 640)).toContain(options.imageHost);
        expect(Urls.tileDomain).toContain(options.imageTileHost);
        expect(Urls.protoMesh("key")).toContain(options.meshHost);
        expect(Urls.tileScheme).toContain(options.scheme);
    });
});
