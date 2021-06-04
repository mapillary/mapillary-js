import { ClusterContract } from "../../../src/api/contracts/ClusterContract";
import { GraphDataProvider } from "../../../src/api/provider/GraphDataProvider";
import { GraphContract }
    from "../../../src/api/provider/GraphContracts";

import { GraphQueryCreator } from "../../../src/api/provider/GraphQueryCreator";
import { GraphDataProviderOptions }
    from "../../../src/api/provider/GraphDataProviderOptions";
import { CoreImagesContract }
    from "../../../src/api/contracts/CoreImagesContract";

import {
    decompress,
    fetchArrayBuffer,
    readMeshPbf,
    xhrFetch,
} from "../../../src/api/Common";
import {
    GraphCoreImageEnt,
    GraphImageEnt,
} from "../../../src/api/provider/GraphEnts";
import { ImagesContract } from "../../../src/api/contracts/ImagesContract";
import { ImageTileEnt } from "../../../src/api/ents/ImageTileEnt";
import { ImageTilesContract } from "../../../src/api/contracts/ImageTilesContract";
import { SpatialImagesContract } from "../../../src/api/contracts/SpatialImagesContract";
import { MeshContract } from "../../../src/api/contracts/MeshContract";
import { IDEnt, SequenceContract } from "../../../src/mapillary";


jest.mock("../../../src/api/Common", () => ({
    __esModule: true,
    decompress: jest.fn(),
    fetchArrayBuffer: jest.fn(),
    readMeshPbf: jest.fn(),
    xhrFetch: jest.fn(),
}));

beforeEach(() => {
    (<jest.Mock>decompress).mockClear();
    (<jest.Mock>fetchArrayBuffer).mockClear();
    (<jest.Mock>readMeshPbf).mockClear();
    (<jest.Mock>xhrFetch).mockClear();
});

describe("GraphDataProvider.ctor", () => {
    test("should create a data provider", () => {
        const provider = new GraphDataProvider();
        expect(provider).toBeDefined();
    });
});

describe("GraphDataProvider.getCluster", () => {
    it("should return cluster reconstruction on successful load", (done) => {
        const compressed = [{
            points: {},
            reference_lla: { altitude: 1, latitude: 2, longitude: 3 },
        }];
        const fetchMock = (<jest.Mock>fetchArrayBuffer)
            .mockReturnValue(Promise.resolve(compressed));
        const decompressMock = (<jest.Mock>decompress)
            .mockReturnValue(compressed);

        const provider = new GraphDataProvider();

        provider.getCluster("url")
            .then(
                (r: ClusterContract): void => {
                    expect(r.points).toEqual({});
                    expect(r.reference.alt).toBe(1);
                    expect(r.reference.lat).toBe(2);
                    expect(r.reference.lng).toBe(3);

                    expect(fetchMock).toHaveBeenCalledTimes(1);
                    expect(decompressMock).toHaveBeenCalledTimes(1);

                    done();
                });
    });
});

describe("GraphDataProvider.getCoreImages", () => {
    it("should query and fetch", (done) => {
        const contract: GraphContract<GraphCoreImageEnt[]> = {
            data: [],
        };

        const xhrFetchMock = (<jest.Mock>xhrFetch)
            .mockReturnValue(Promise.resolve(contract));

        const query = new GraphQueryCreator();
        const querySpy = spyOn(query, "imagesS2")
            .and.returnValue('query-s2');

        const options: GraphDataProviderOptions = {
            endpoint: 'http://mjs-test.com',
        };
        const provider = new GraphDataProvider(options, null, null, query);

        const cellId = "cell-id";
        provider.getCoreImages(cellId)
            .then(
                (response: CoreImagesContract): void => {
                    expect(response.cell_id).toBe(cellId);
                    expect(response.images.length).toBe(0);

                    expect(querySpy.calls.count()).toBe(1);

                    expect(xhrFetchMock).toHaveBeenCalledTimes(1);

                    const url = xhrFetchMock.mock.calls[0][0];
                    expect(url).toMatch("http://mjs-test.com");
                    expect(url).toMatch("query-s2");

                    done();
                });
    });
});

describe("GraphDataProvider.getImageBuffer", () => {
    it("should query and fetch", (done) => {
        const buffer = new ArrayBuffer(1024);
        const fetchMock = (<jest.Mock>fetchArrayBuffer);

        fetchMock.mockReturnValue(Promise.resolve(buffer));

        const provider = new GraphDataProvider();

        const url = "image-url";
        provider.getImageBuffer(url)
            .then(
                (response: ArrayBuffer): void => {
                    expect(response.byteLength).toBe(1024);
                    expect(response).toBe(buffer);


                    expect(fetchMock).toHaveBeenCalledTimes(1);
                    const imageUrl = fetchMock.mock.calls[0][0];
                    expect(imageUrl).toMatch("image-url");

                    done();
                });
    });
});

describe("GraphDataProvider.getImages", () => {
    it("should query and fetch", (done) => {
        const contract: GraphContract<GraphImageEnt[]> = {
            data: [],
        };

        const xhrFetchMock = (<jest.Mock>xhrFetch)
            .mockReturnValue(Promise.resolve(contract));

        const query = new GraphQueryCreator();
        const querySpy = spyOn(query, "images")
            .and.returnValue('query-images');

        const options: GraphDataProviderOptions = {
            endpoint: 'http://mjs-test.com',
        };
        const provider = new GraphDataProvider(options, null, null, query);

        const imageId = "image-id";
        provider.getImages([imageId])
            .then(
                (response: ImagesContract): void => {
                    expect(response.length).toBe(0);

                    expect(querySpy.calls.count()).toBe(1);

                    expect(xhrFetchMock).toHaveBeenCalledTimes(1);
                    const url = xhrFetchMock.mock.calls[0][0];
                    expect(url).toMatch("http://mjs-test.com");
                    expect(url).toMatch("query-images");

                    done();
                });
    });
});

describe("GraphDataProvider.getImageTiles", () => {
    it("should query and fetch", (done) => {
        const contract: GraphContract<ImageTileEnt[]> = {
            data: [{
                url: "image-tile-url",
                x: 0,
                y: 1,
                z: 11,
            }],
        };

        const xhrFetchMock = (<jest.Mock>xhrFetch)
            .mockReturnValue(Promise.resolve(contract));

        const query = new GraphQueryCreator();
        const querySpy = spyOn(query, "imageTiles")
            .and.returnValue('query-image-tiles');

        const options: GraphDataProviderOptions = {
            endpoint: 'http://mjs-test.com',
        };
        const provider = new GraphDataProvider(options, null, null, query);

        const imageId = "image-id";
        provider.getImageTiles({ imageId, z: 11 })
            .then(
                (response: ImageTilesContract): void => {
                    expect(response.node_id).toBe("image-id");
                    expect(response.node.length).toBe(1);

                    expect(querySpy.calls.count()).toBe(1);

                    expect(xhrFetchMock).toHaveBeenCalledTimes(1);
                    const url = xhrFetchMock.mock.calls[0][0];
                    expect(url).toMatch("http://mjs-test.com");
                    expect(url).toMatch("query-image-tiles");

                    done();
                });
    });
});

describe("GraphDataProvider.getSpatialImages", () => {
    it("should query and fetch", (done) => {
        const contract: GraphContract<ImageTileEnt[]> = {
            data: [],
        };

        const xhrFetchMock = (<jest.Mock>xhrFetch)
            .mockReturnValue(Promise.resolve(contract));

        const query = new GraphQueryCreator();
        const querySpy = spyOn(query, "images")
            .and.returnValue('query-spatial-images');

        const options: GraphDataProviderOptions = {
            endpoint: 'http://mjs-test.com',
        };
        const provider = new GraphDataProvider(options, null, null, query);

        const imageId = "image-id";
        provider.getSpatialImages([imageId])
            .then(
                (response: SpatialImagesContract): void => {
                    expect(response.length).toBe(0);

                    expect(querySpy.calls.count()).toBe(1);

                    expect(xhrFetchMock).toHaveBeenCalledTimes(1);
                    const url = xhrFetchMock.mock.calls[0][0];
                    expect(url).toMatch("http://mjs-test.com");
                    expect(url).toMatch("query-spatial-images");

                    done();
                });
    });
});

describe("GraphDataProvider.getMesh", () => {
    it("should query and fetch", (done) => {
        const buffer = new ArrayBuffer(1024);
        const fetchMock = (<jest.Mock>fetchArrayBuffer);
        fetchMock.mockReturnValue(Promise.resolve(buffer));

        const mesh: MeshContract = { faces: [], vertices: [] };
        const readMock = (<jest.Mock>readMeshPbf);
        readMock.mockReturnValue(mesh);

        const provider = new GraphDataProvider();

        const url = "mesh-url";
        provider.getMesh(url)
            .then(
                (response: MeshContract): void => {
                    expect(response.faces.length).toBe(0);
                    expect(response.vertices.length).toBe(0);

                    expect(fetchMock).toHaveBeenCalledTimes(1);
                    const meshUrl = fetchMock.mock.calls[0][0];
                    expect(meshUrl).toMatch("mesh-url");

                    expect(readMock).toHaveBeenCalledTimes(1);
                    const pbf = readMock.mock.calls[0][0];
                    expect(pbf).toBe(buffer);

                    done();
                });
    });
});

describe("GraphDataProvider.getSequence", () => {
    it("should query and fetch", (done) => {
        const contract: GraphContract<IDEnt[]> = {
            data: [{ id: "image-id" }],
        };

        const xhrFetchMock = (<jest.Mock>xhrFetch)
            .mockReturnValue(Promise.resolve(contract));

        const query = new GraphQueryCreator();
        const querySpy = spyOn(query, "sequence")
            .and.returnValue('query-sequence');

        const options: GraphDataProviderOptions = {
            endpoint: 'http://mjs-test.com',
        };
        const provider = new GraphDataProvider(options, null, null, query);

        const sequenceId = "sequence-id";
        provider.getSequence(sequenceId)
            .then(
                (response: SequenceContract): void => {
                    expect(response.id).toBe("sequence-id");
                    expect(response.image_ids.length).toBe(1);
                    expect(response.image_ids[0]).toBe("image-id");

                    expect(querySpy.calls.count()).toBe(1);

                    expect(xhrFetchMock).toHaveBeenCalledTimes(1);
                    const url = xhrFetchMock.mock.calls[0][0];
                    expect(url).toMatch("http://mjs-test.com");
                    expect(url).toMatch("query-sequence");

                    done();
                });
    });
});
