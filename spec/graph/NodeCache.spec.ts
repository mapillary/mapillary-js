import {EdgeDirection, IEdge} from "../../src/Edge";
import {
    IEdgeStatus,
    NewNodeCache,
} from "../../src/Graph";

describe("NodeCache.ctor", () => {
    it("should create a node cache", () => {
        let nodeCache: NewNodeCache = new NewNodeCache();
        expect(nodeCache).toBeDefined();
    });
});

describe("NodeCache.image", () => {
    it("should be null initially", () => {
        let nodeCache: NewNodeCache = new NewNodeCache();
        expect(nodeCache.image).toBeNull();
    });
});

describe("NodeCache.image$", () => {
    it("should emit null initially", (done) => {
        let nodeCache: NewNodeCache = new NewNodeCache();

        nodeCache.image$
            .first()
            .subscribe(
                (image: HTMLImageElement): void => {
                    expect(image).toBeNull();

                    done();
                });
    });
});

describe("NodeCache.mesh", () => {
    it("should be null initially", () => {
        let nodeCache: NewNodeCache = new NewNodeCache();
        expect(nodeCache.mesh).toBeNull();
    });
});

describe("NodeCache.sequenceEdges$", () => {
    it("should emit uncached empty edge status initially", (done) => {
        let nodeCache: NewNodeCache = new NewNodeCache();

        nodeCache.sequenceEdges$
            .first()
            .subscribe(
                (edgeStatus: IEdgeStatus): void => {
                    expect(edgeStatus.cached).toBe(false);
                    expect(edgeStatus.edges.length).toBe(0);

                    done();
                });
    });

    it("should emit cached non empty edge status when sequence edges cached", (done) => {
        let nodeCache: NewNodeCache = new NewNodeCache();

        let sequenceEdge: IEdge = {
            data: {
                direction: EdgeDirection.Next,
                worldMotionAzimuth: 0,
            },
            from: "key1",
            to: "key2",
        };

        nodeCache.sequenceEdges$
            .skip(1)
            .first()
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

describe("NodeCache.spatialEdges$", () => {
    it("should emit uncached empty edge status initially", (done) => {
        let nodeCache: NewNodeCache = new NewNodeCache();

        nodeCache.spatialEdges$
            .first()
            .subscribe(
                (edgeStatus: IEdgeStatus): void => {
                    expect(edgeStatus.cached).toBe(false);
                    expect(edgeStatus.edges.length).toBe(0);

                    done();
                });
    });

    it("should emit cached non empty edge status when spatial edges cached", (done) => {
        let nodeCache: NewNodeCache = new NewNodeCache();

        let spatialEdge: IEdge = {
            data: {
                direction: EdgeDirection.StepForward,
                worldMotionAzimuth: 0,
            },
            from: "key1",
            to: "key2",
        };

        nodeCache.spatialEdges$
            .skip(1)
            .first()
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
