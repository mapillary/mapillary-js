import { FalcorDataProviderOptions } from "../../../src/api/falcor/FalcorDataProviderOptions";
import { FalcorDataProviderUrls } from "../../../src/api/falcor/FalcorDataProviderUrls";

describe("DataProviderUrls.ctor", () => {
    it("should set all option properties", () => {
        const options: FalcorDataProviderOptions = {
            apiHost: "test-api",
            clientId: "ct",
            reconstructionHost: "test-cluster",
            imageHost: "test-image",
            imageTileHost: "test-image-tile",
            meshHost: "test-mesh",
            scheme: "test-scheme",
        };

        const urls = new FalcorDataProviderUrls(options);

        expect(urls.falcorModel).toContain(options.apiHost);
        expect(urls.falcorModel).toContain(options.scheme);
        expect(urls.falcorModel).toContain(options.clientId);
        expect(urls.thumbnail("key", 640)).toContain(options.imageHost);
        expect(urls.tileDomain).toContain(options.imageTileHost);
        expect(urls.protoMesh("key")).toContain(options.meshHost);
        expect(urls.tileScheme).toContain(options.scheme);
    });
});
