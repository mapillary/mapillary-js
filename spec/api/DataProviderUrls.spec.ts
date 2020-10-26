import IFalcorDataProviderOptions from "../../src/api/interfaces/IFalcorDataProviderOptions";
import { DataProviderUrls } from "../../src/api/FalcorDataProvider";

describe("DataProviderUrls.ctor", () => {
    it("should set all option properties", () => {
        const options: IFalcorDataProviderOptions = {
            apiHost: "test-api",
            clientId: "cid",
            clusterReconstructionHost: "test-cluster",
            imageHost: "test-image",
            imageTileHost: "test-image-tile",
            meshHost: "test-mesh",
            scheme: "test-scheme",
        };

        const urls: DataProviderUrls = new DataProviderUrls(options);

        expect(urls.falcorModel).toContain(options.apiHost);
        expect(urls.falcorModel).toContain(options.scheme);
        expect(urls.falcorModel).toContain(options.clientId);
        expect(urls.thumbnail("key", 640)).toContain(options.imageHost);
        expect(urls.tileDomain).toContain(options.imageTileHost);
        expect(urls.protoMesh("key")).toContain(options.meshHost);
        expect(urls.tileScheme).toContain(options.scheme);
    });
});
