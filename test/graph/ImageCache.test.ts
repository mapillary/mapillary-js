import {
    first,
    skip,
} from "rxjs/operators";
import { FalcorDataProvider } from "../../src/api/falcor/FalcorDataProvider";
import { NavigationDirection } from "../../src/graph/edge/NavigationDirection";
import { NavigationEdge } from "../../src/graph/edge/interfaces/NavigationEdge";
import { NavigationEdgeStatus }
    from "../../src/graph/interfaces/NavigationEdgeStatus";
import { ImageCache } from "../../src/graph/ImageCache";
import { MockCreator } from "../helper/MockCreator";
import { ImageHelper } from "../helper/ImageHelper";

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

        const dataProvider = new FalcorDataProvider({ clientId: "cid" });
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

        const dataProvider = new FalcorDataProvider({ clientId: "cid" });
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

        const dataProvider = new FalcorDataProvider({ clientId: "cid" });
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
