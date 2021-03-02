import { first, skip } from "rxjs/operators";
import { FalcorDataProvider } from "../../src/api/FalcorDataProvider";
import { EdgeDirection } from "../../src/graph/edge/EdgeDirection";
import { IEdge } from "../../src/graph/edge/interfaces/IEdge";
import { IEdgeStatus } from "../../src/graph/interfaces/IEdgeStatus";
import { NodeCache } from "../../src/graph/NodeCache";
import { ImageSize } from "../../src/viewer/ImageSize";
import { MockCreator } from "../helper/MockCreator.spec";

describe("NodeCache.ctor", () => {
    it("should create a node cache", () => {
        let nodeCache: NodeCache = new NodeCache(undefined);
        expect(nodeCache).toBeDefined();
    });
});

describe("NodeCache.mesh", () => {
    it("should be null initially", () => {
        let nodeCache: NodeCache = new NodeCache(undefined);
        expect(nodeCache.mesh).toBeNull();
    });
});

describe("NodeCache.image", () => {
    it("should be null initially", () => {
        let nodeCache: NodeCache = new NodeCache(undefined);
        expect(nodeCache.image).toBeNull();
    });
});

describe("NodeCache.sequenceEdges$", () => {
    it("should emit uncached empty edge status initially", (done: Function) => {
        let nodeCache: NodeCache = new NodeCache(undefined);

        nodeCache.sequenceEdges$.pipe(
            first())
            .subscribe(
                (edgeStatus: IEdgeStatus): void => {
                    expect(edgeStatus.cached).toBe(false);
                    expect(edgeStatus.edges.length).toBe(0);

                    done();
                });
    });

    it("should emit cached non empty edge status when sequence edges cached", (done: Function) => {
        let nodeCache: NodeCache = new NodeCache(undefined);

        let sequenceEdge: IEdge = {
            data: {
                direction: EdgeDirection.Next,
                worldMotionAzimuth: 0,
            },
            from: "key1",
            to: "key2",
        };

        nodeCache.sequenceEdges$.pipe(
            skip(1),
            first())
            .subscribe(
                (edgeStatus: IEdgeStatus): void => {
                    expect(edgeStatus.cached).toBe(true);
                    expect(edgeStatus.edges.length).toBe(1);
                    expect(edgeStatus.edges[0].from).toBe(sequenceEdge.from);
                    expect(edgeStatus.edges[0].to).toBe(sequenceEdge.to);
                    expect(edgeStatus.edges[0].data.direction).toBe(sequenceEdge.data.direction);
                    expect(edgeStatus.edges[0].data.worldMotionAzimuth).toBe(sequenceEdge.data.worldMotionAzimuth);

                    done();
                });

        nodeCache.cacheSequenceEdges([sequenceEdge]);
    });
});

describe("NodeCache.resetSequenceEdges", () => {
    it("should reset the sequence edges", () => {
        let nodeCache: NodeCache = new NodeCache(undefined);

        let sequenceEdge: IEdge = {
            data: {
                direction: EdgeDirection.Next,
                worldMotionAzimuth: null,
            },
            from: "key1",
            to: "key2",
        };

        nodeCache.cacheSequenceEdges([sequenceEdge]);

        expect(nodeCache.sequenceEdges.cached).toBe(true);
        expect(nodeCache.sequenceEdges.edges.length).toBe(1);
        expect(nodeCache.sequenceEdges.edges[0].from).toBe(sequenceEdge.from);

        nodeCache.resetSequenceEdges();

        expect(nodeCache.sequenceEdges.cached).toBe(false);
        expect(nodeCache.sequenceEdges.edges.length).toBe(0);
    });
});

describe("NodeCache.spatialEdges$", () => {
    it("should emit uncached empty edge status initially", (done: Function) => {
        let nodeCache: NodeCache = new NodeCache(undefined);

        nodeCache.spatialEdges$.pipe(
            first())
            .subscribe(
                (edgeStatus: IEdgeStatus): void => {
                    expect(edgeStatus.cached).toBe(false);
                    expect(edgeStatus.edges.length).toBe(0);

                    done();
                });
    });

    it("should emit cached non empty edge status when spatial edges cached", (done: Function) => {
        let nodeCache: NodeCache = new NodeCache(undefined);

        let spatialEdge: IEdge = {
            data: {
                direction: EdgeDirection.StepForward,
                worldMotionAzimuth: 0,
            },
            from: "key1",
            to: "key2",
        };

        nodeCache.spatialEdges$.pipe(
            skip(1),
            first())
            .subscribe(
                (edgeStatus: IEdgeStatus): void => {
                    expect(edgeStatus.cached).toBe(true);
                    expect(edgeStatus.edges.length).toBe(1);
                    expect(edgeStatus.edges[0].from).toBe(spatialEdge.from);
                    expect(edgeStatus.edges[0].to).toBe(spatialEdge.to);
                    expect(edgeStatus.edges[0].data.direction).toBe(spatialEdge.data.direction);
                    expect(edgeStatus.edges[0].data.worldMotionAzimuth).toBe(spatialEdge.data.worldMotionAzimuth);

                    done();
                });

        nodeCache.cacheSpatialEdges([spatialEdge]);
    });
});

describe("NodeCache.resetSpatialEdges", () => {
    it("should reset the spatial edges", () => {
        let nodeCache: NodeCache = new NodeCache(undefined);

        let spatialEdge: IEdge = {
            data: {
                direction: EdgeDirection.StepForward,
                worldMotionAzimuth: 0,
            },
            from: "key1",
            to: "key2",
        };

        nodeCache.cacheSpatialEdges([spatialEdge]);

        expect(nodeCache.spatialEdges.cached).toBe(true);
        expect(nodeCache.spatialEdges.edges.length).toBe(1);
        expect(nodeCache.spatialEdges.edges[0].from).toBe(spatialEdge.from);

        nodeCache.resetSpatialEdges();

        expect(nodeCache.spatialEdges.cached).toBe(false);
        expect(nodeCache.spatialEdges.edges.length).toBe(0);
    });
});

describe("NodeCache.dispose", () => {
    it("should clear all properties", () => {
        let nodeCache: NodeCache = new NodeCache(undefined);

        let sequencEdge: IEdge = {
            data: {
                direction: EdgeDirection.StepForward,
                worldMotionAzimuth: 0,
            },
            from: "key1",
            to: "key2",
        };

        let spatialEdge: IEdge = {
            data: {
                direction: EdgeDirection.StepForward,
                worldMotionAzimuth: 0,
            },
            from: "key1",
            to: "key2",
        };

        nodeCache.cacheSequenceEdges([sequencEdge]);
        nodeCache.cacheSpatialEdges([spatialEdge]);

        nodeCache.dispose();

        expect(nodeCache.sequenceEdges.cached).toBe(false);
        expect(nodeCache.sequenceEdges.edges.length).toBe(0);

        expect(nodeCache.spatialEdges.cached).toBe(false);
        expect(nodeCache.spatialEdges.edges.length).toBe(0);

        expect(nodeCache.image).toBeNull();
    });
});

describe("NodeCache.cacheImage$", () => {
    it("should return the node cache with a cached image", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        const dataProvider = new FalcorDataProvider({ clientToken: "cid" });
        spyOn(dataProvider, "getImage").and.returnValue(promise);

        const imageMock: HTMLImageElement = new Image();
        spyOn(window, <keyof Window>"Image").and.returnValue(imageMock);

        new MockCreator().mockProperty(imageMock, "src", "");

        spyOn(window, "Blob").and.returnValue(<Blob>{});
        spyOn(window.URL, "createObjectURL").and.returnValue("url");

        const nodeCache: NodeCache = new NodeCache(dataProvider);

        expect(nodeCache.image).toBeNull();

        nodeCache.cacheImage$({}, ImageSize.Size640)
            .subscribe(
                (nc: NodeCache): void => {
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

        const dataProvider = new FalcorDataProvider({ clientToken: "cid" });
        spyOn(dataProvider, "getImage").and.returnValue(promise);

        const imageMock: HTMLImageElement = new Image();
        spyOn(window, <keyof Window>"Image").and.returnValue(imageMock);

        new MockCreator().mockProperty(imageMock, "src", "");

        spyOn(window, "Blob").and.returnValue(<Blob>{});
        spyOn(window.URL, "createObjectURL").and.returnValue("url");

        const nodeCache: NodeCache = new NodeCache(dataProvider);

        expect(nodeCache.image).toBeNull();

        nodeCache.cacheImage$({}, ImageSize.Size640).subscribe();

        imageMock.dispatchEvent(new CustomEvent("load"));

        expect(nodeCache.image).not.toBeNull();
        expect(nodeCache.image).toBe(imageMock);
    });

    it("should emit the cached image", (done: Function) => {
        const promise: any = {
            then: (resolve: (result: any) => void, reject: (error: Error) => void): void => {
                resolve(undefined);
            },
        };

        const dataProvider = new FalcorDataProvider({ clientToken: "cid" });
        spyOn(dataProvider, "getImage").and.returnValue(promise);

        const imageMock: HTMLImageElement = new Image();
        spyOn(window, <keyof Window>"Image").and.returnValue(imageMock);

        new MockCreator().mockProperty(imageMock, "src", "");

        spyOn(window, "Blob").and.returnValue(<Blob>{});
        spyOn(window.URL, "createObjectURL").and.returnValue("url");

        const nodeCache: NodeCache = new NodeCache(dataProvider);

        expect(nodeCache.image).toBeNull();

        nodeCache.image$.pipe(
            skip(1))
            .subscribe(
                (image: HTMLImageElement): void => {
                    expect(image).not.toBeNull();
                    expect(image).toBe(imageMock);

                    done();
                });

        nodeCache.cacheImage$({}, ImageSize.Size640).subscribe();
        imageMock.dispatchEvent(new CustomEvent("load"));
    });
});
