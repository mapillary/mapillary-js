import { FalcorDataProviderUrls } from "../../src/api/FalcorDataProvider";
import { FalcorDataProviderOptions } from "../../src/api/interfaces/FalcorDataProviderOptions";

describe("DataProviderUrls.ctor", () => {
    it("should set all option properties", () => {
        const options: FalcorDataProviderOptions = {
            apiHost: "test-api",
            clientToken: "ct",
            reconstructionHost: "test-cluster",
            imageHost: "test-image",
            imageTileHost: "test-image-tile",
            meshHost: "test-mesh",
            scheme: "test-scheme",
        };

        const urls: FalcorDataProviderUrls = new FalcorDataProviderUrls(options);

        expect(urls.falcorModel).toContain(options.apiHost);
        expect(urls.falcorModel).toContain(options.scheme);
        expect(urls.falcorModel).toContain(options.clientToken);
        expect(urls.thumbnail("key", 640)).toContain(options.imageHost);
        expect(urls.tileDomain).toContain(options.imageTileHost);
        expect(urls.protoMesh("key")).toContain(options.meshHost);
        expect(urls.tileScheme).toContain(options.scheme);
    });
});
