import {
    first,
    skip,
} from "rxjs/operators";
import { firstValueFrom } from "rxjs";
import { MeshContract } from "../../src/api/contracts/MeshContract";
import { SpatialImageEnt } from "../../src/api/ents/SpatialImageEnt";
import { NavigationDirection } from "../../src/graph/edge/NavigationDirection";
import { NavigationEdge } from "../../src/graph/edge/interfaces/NavigationEdge";
import { NavigationEdgeStatus }
    from "../../src/graph/interfaces/NavigationEdgeStatus";
import { ImageCache } from "../../src/graph/ImageCache";
import { MockCreator } from "../helper/MockCreator";
import { ImageHelper } from "../helper/ImageHelper";
import { DataProvider } from "../helper/ProviderHelper";

global.URL.createObjectURL = jest.fn();

describe("ImageCache.ctor", () => {
    it("should create a image cache", () => {
        let cache = new ImageCache(undefined);
        expect(cache).toBeDefined();
    });
});

describe("ImageCache.mesh", () => {
    it("should be null initially", () => {
        let cache = new ImageCache(undefined);
        expect(cache.mesh).toBeNull();
    });
});

describe("ImageCache.image", () => {
    it("should be null initially", () => {
        let cache = new ImageCache(undefined);
        expect(cache.image).toBeNull();
    });
});

describe("ImageCache.sequenceEdges$", () => {
    it("should emit uncached empty edge status initially", (done: Function) => {
        let cache = new ImageCache(undefined);

        cache.sequenceEdges$.pipe(
            first())
            .subscribe(
                (edgeStatus: NavigationEdgeStatus): void => {
                    expect(edgeStatus.cached).toBe(false);
                    expect(edgeStatus.edges.length).toBe(0);

                    done();
                });
    });

    it("should emit cached non empty edge status when sequence edges cached", (done: Function) => {
        let cache = new ImageCache(undefined);

        let sequenceEdge: NavigationEdge = {
            data: {
                direction: NavigationDirection.Next,
                worldMotionAzimuth: 0,
            },
            source: "key1",
            target: "key2",
        };

        cache.sequenceEdges$.pipe(
            skip(1),
            first())
            .subscribe(
                (edgeStatus: NavigationEdgeStatus): void => {
                    expect(edgeStatus.cached).toBe(true);
                    expect(edgeStatus.edges.length).toBe(1);
                    expect(edgeStatus.edges[0].source).toBe(sequenceEdge.source);
                    expect(edgeStatus.edges[0].target).toBe(sequenceEdge.target);
                    expect(edgeStatus.edges[0].data.direction).toBe(sequenceEdge.data.direction);
                    expect(edgeStatus.edges[0].data.worldMotionAzimuth).toBe(sequenceEdge.data.worldMotionAzimuth);

                    done();
                });

        cache.cacheSequenceEdges([sequenceEdge]);
    });
});

describe("ImageCache.resetSequenceEdges", () => {
    it("should reset the sequence edges", () => {
        let cache = new ImageCache(undefined);

        let sequenceEdge: NavigationEdge = {
            data: {
                direction: NavigationDirection.Next,
                worldMotionAzimuth: null,
            },
            source: "key1",
            target: "key2",
        };

        cache.cacheSequenceEdges([sequenceEdge]);

        expect(cache.sequenceEdges.cached).toBe(true);
        expect(cache.sequenceEdges.edges.length).toBe(1);
        expect(cache.sequenceEdges.edges[0].source).toBe(sequenceEdge.source);

        cache.resetSequenceEdges();

        expect(cache.sequenceEdges.cached).toBe(false);
        expect(cache.sequenceEdges.edges.length).toBe(0);
    });
});

describe("ImageCache.spatialEdges$", () => {
    it("should emit uncached empty edge status initially", (done: Function) => {
        let cache = new ImageCache(undefined);

        cache.spatialEdges$.pipe(
            first())
            .subscribe(
                (edgeStatus: NavigationEdgeStatus): void => {
                    expect(edgeStatus.cached).toBe(false);
                    expect(edgeStatus.edges.length).toBe(0);

                    done();
                });
    });

    it("should emit cached non empty edge status when spatial edges cached", (done: Function) => {
        let cache = new ImageCache(undefined);

        let spatialEdge: NavigationEdge = {
            data: {
                direction: NavigationDirection.StepForward,
                worldMotionAzimuth: 0,
            },
            source: "key1",
            target: "key2",
        };

        cache.spatialEdges$.pipe(
            skip(1),
            first())
            .subscribe(
                (edgeStatus: NavigationEdgeStatus): void => {
                    expect(edgeStatus.cached).toBe(true);
                    expect(edgeStatus.edges.length).toBe(1);
                    expect(edgeStatus.edges[0].source).toBe(spatialEdge.source);
                    expect(edgeStatus.edges[0].target).toBe(spatialEdge.target);
                    expect(edgeStatus.edges[0].data.direction).toBe(spatialEdge.data.direction);
                    expect(edgeStatus.edges[0].data.worldMotionAzimuth).toBe(spatialEdge.data.worldMotionAzimuth);

                    done();
                });

        cache.cacheSpatialEdges([spatialEdge]);
    });
});

describe("ImageCache.resetSpatialEdges", () => {
    it("should reset the spatial edges", () => {
        let cache = new ImageCache(undefined);

        let spatialEdge: NavigationEdge = {
            data: {
                direction: NavigationDirection.StepForward,
                worldMotionAzimuth: 0,
            },
            source: "key1",
            target: "key2",
        };

        cache.cacheSpatialEdges([spatialEdge]);

        expect(cache.spatialEdges.cached).toBe(true);
        expect(cache.spatialEdges.edges.length).toBe(1);
        expect(cache.spatialEdges.edges[0].source).toBe(spatialEdge.source);

        cache.resetSpatialEdges();

        expect(cache.spatialEdges.cached).toBe(false);
        expect(cache.spatialEdges.edges.length).toBe(0);
    });
});

describe("ImageCache.dispose", () => {
    it("should clear all properties", () => {
        let cache = new ImageCache(undefined);

        let sequencEdge: NavigationEdge = {
            data: {
                direction: NavigationDirection.StepForward,
                worldMotionAzimuth: 0,
            },
            source: "key1",
            target: "key2",
        };

        let spatialEdge: NavigationEdge = {
            data: {
                direction: NavigationDirection.StepForward,
                worldMotionAzimuth: 0,
            },
            source: "key1",
            target: "key2",
        };

        cache.cacheSequenceEdges([sequencEdge]);
        cache.cacheSpatialEdges([spatialEdge]);

        cache.dispose();

        expect(cache.sequenceEdges.cached).toBe(false);
        expect(cache.sequenceEdges.edges.length).toBe(0);

        expect(cache.spatialEdges.cached).toBe(false);
        expect(cache.spatialEdges.edges.length).toBe(0);

        expect(cache.image).toBeNull();
    });
});

describe("ImageCache.cacheImage$", () => {
    it("should return the image cache with a cached image", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        const dataProvider = new DataProvider();
        spyOn(dataProvider, "getImageBuffer").and.returnValue(promise);

        const imageMock: HTMLImageElement = new Image();
        spyOn(window, <keyof Window>"Image").and.returnValue(imageMock);

        new MockCreator().mockProperty(imageMock, "src", "");

        spyOn(window, "Blob").and.returnValue(<Blob>{});
        spyOn(window.URL, "createObjectURL").and.returnValue("url");

        const cache = new ImageCache(dataProvider);

        expect(cache.image).toBeNull();

        cache.cacheImage$(new ImageHelper().createSpatialImageEnt())
            .subscribe(
                (nc: ImageCache): void => {
                    expect(nc.image).not.toBeNull();
                    expect(nc.image).toBe(imageMock);

                    done();
                });

        imageMock.dispatchEvent(new CustomEvent("load"));
    });

    it("should cache an image", () => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        const dataProvider = new DataProvider();
        spyOn(dataProvider, "getImageBuffer").and.returnValue(promise);

        const imageMock: HTMLImageElement = new Image();
        spyOn(window, <keyof Window>"Image").and.returnValue(imageMock);

        new MockCreator().mockProperty(imageMock, "src", "");

        spyOn(window, "Blob").and.returnValue(<Blob>{});
        spyOn(window.URL, "createObjectURL").and.returnValue("url");

        const cache = new ImageCache(dataProvider);

        expect(cache.image).toBeNull();

        cache.cacheImage$(new ImageHelper().createSpatialImageEnt()).subscribe();

        imageMock.dispatchEvent(new CustomEvent("load"));

        expect(cache.image).not.toBeNull();
        expect(cache.image).toBe(imageMock);
    });

    it("should emit the cached image", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        const dataProvider = new DataProvider();
        spyOn(dataProvider, "getImageBuffer").and.returnValue(promise);

        const imageMock: HTMLImageElement = new Image();
        spyOn(window, <keyof Window>"Image").and.returnValue(imageMock);

        new MockCreator().mockProperty(imageMock, "src", "");

        spyOn(window, "Blob").and.returnValue(<Blob>{});
        spyOn(window.URL, "createObjectURL").and.returnValue("url");

        const cache = new ImageCache(dataProvider);

        expect(cache.image).toBeNull();

        cache.image$.pipe(
            skip(1))
            .subscribe(
                (image: HTMLImageElement): void => {
                    expect(image).not.toBeNull();
                    expect(image).toBe(imageMock);

                    done();
                });

        cache.cacheImage$(new ImageHelper().createSpatialImageEnt()).subscribe();
        imageMock.dispatchEvent(new CustomEvent("load"));
    });
});

type MeshFixture = {
    cache: ImageCache;
    provider: DataProvider;
    spatial: SpatialImageEnt;
    image: HTMLImageElement;
    getMesh: jasmine.Spy;
};

function createMeshFixture(): MeshFixture {
    const provider = new DataProvider();
    spyOn(provider, "getImageBuffer").and.returnValue(Promise.resolve(new ArrayBuffer(0)));
    const getMesh = spyOn(provider, "getMesh").and.returnValue(Promise.resolve({ faces: [], vertices: [] }));
    const image = new Image();
    spyOn(window, <keyof Window>"Image").and.returnValue(image);
    new MockCreator().mockProperty(image, "src", "");
    spyOn(window, "Blob").and.returnValue(<Blob>{});
    spyOn(window.URL, "createObjectURL").and.returnValue("image-url");
    return {
        cache: new ImageCache(provider),
        provider,
        spatial: new ImageHelper().createSpatialImageEnt(),
        image,
        getMesh,
    };
}

async function cacheMesh(fixture: MeshFixture, merged: boolean = true): Promise<ImageCache> {
    const result = firstValueFrom(fixture.cache.cacheAssets$(fixture.spatial, merged));
    await Promise.resolve();
    fixture.image.dispatchEvent(new CustomEvent("load"));
    return result;
}

const absentMeshValues: (string | null | undefined)[] = [null, undefined];

describe("ImageCache mesh metadata and downloads", () => {
    for (const meshId of absentMeshValues) {
        for (const url of absentMeshValues) {
            it(`should quietly use an empty mesh for absent metadata (${meshId}, ${url})`, async () => {
                const fixture = createMeshFixture();
                fixture.spatial.mesh = { id: meshId, url };
                const warn = spyOn(console, "warn").and.stub();
                const error = spyOn(console, "error").and.stub();

                const cached = await cacheMesh(fixture);

                expect(cached).toBe(fixture.cache);
                expect(cached.mesh).toEqual({ faces: [], vertices: [] });
                expect(cached.image).toBe(fixture.image);
                expect(fixture.getMesh).not.toHaveBeenCalled();
                expect(warn).not.toHaveBeenCalled();
                expect(error).not.toHaveBeenCalled();
            });
        }
    }

    for (const url of absentMeshValues) {
        it(`should warn when an advertised mesh has no URL (${url})`, async () => {
            const fixture = createMeshFixture();
            fixture.spatial.mesh = { id: "advertised-mesh", url };
            const warn = spyOn(console, "warn").and.stub();

            const cached = await cacheMesh(fixture);

            expect(cached.mesh).toEqual({ faces: [], vertices: [] });
            expect(fixture.getMesh).not.toHaveBeenCalled();
            expect(warn.calls.count()).toBe(1);
            expect(warn.calls.first().args).toEqual([
                `Incorrect mesh URL for ${fixture.spatial.id} (advertised-mesh, ${url})`,
            ]);
        });
    }

    for (const meshId of [null, "advertised-mesh"]) {
        it(`should warn for a malformed empty URL even with mesh id ${meshId}`, async () => {
            const fixture = createMeshFixture();
            fixture.spatial.mesh = { id: meshId, url: "" };
            const warn = spyOn(console, "warn").and.stub();

            const cached = await cacheMesh(fixture);

            expect(cached.mesh).toEqual({ faces: [], vertices: [] });
            expect(fixture.getMesh).not.toHaveBeenCalled();
            expect(warn.calls.count()).toBe(1);
            expect(warn.calls.first().args).toEqual([
                `Incorrect mesh URL for ${fixture.spatial.id} (${meshId}, )`,
            ]);
        });
    }

    it("should not request or warn about a mesh for an unmerged image", async () => {
        const fixture = createMeshFixture();
        const warn = spyOn(console, "warn").and.stub();
        const error = spyOn(console, "error").and.stub();

        const cached = await cacheMesh(fixture, false);

        expect(cached.mesh).toEqual({ faces: [], vertices: [] });
        expect(fixture.getMesh).not.toHaveBeenCalled();
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
    });

    it("should retain a successfully downloaded mesh", async () => {
        const fixture = createMeshFixture();
        const mesh: MeshContract = { faces: [0, 1, 2], vertices: [1, 2, 3] };
        fixture.getMesh.and.returnValue(Promise.resolve(mesh));
        const warn = spyOn(console, "warn").and.stub();
        const error = spyOn(console, "error").and.stub();

        const cached = await cacheMesh(fixture);

        expect(cached.mesh).toBe(mesh);
        expect(fixture.getMesh.calls.count()).toBe(1);
        expect(fixture.getMesh.calls.first().args[0]).toBe(fixture.spatial.mesh.url);
        expect(fixture.getMesh.calls.first().args[1]).toBeInstanceOf(Promise);
        expect(warn).not.toHaveBeenCalled();
        expect(error).not.toHaveBeenCalled();
    });

    it("should log a failed download and retain the empty-mesh fallback", async () => {
        const fixture = createMeshFixture();
        const downloadError = new Error("mesh download failed");
        fixture.getMesh.and.returnValue(Promise.reject(downloadError));
        const warn = spyOn(console, "warn").and.stub();
        const error = spyOn(console, "error").and.stub();

        const cached = await cacheMesh(fixture);

        expect(cached.mesh).toEqual({ faces: [], vertices: [] });
        expect(fixture.getMesh.calls.count()).toBe(1);
        expect(warn).not.toHaveBeenCalled();
        expect(error.calls.count()).toBe(1);
        expect(error.calls.first().args).toEqual([downloadError]);
    });
});
