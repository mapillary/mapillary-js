import {EdgeDirection, IEdge} from "../../src/Edge";
import {
    IEdgeStatus,
    NodeCache,
} from "../../src/Graph";

describe("NodeCache.ctor", () => {
    it("should create a node cache", () => {
        let nodeCache: NodeCache = new NodeCache();
        expect(nodeCache).toBeDefined();
    });
});

describe("NodeCache.mesh", () => {
    it("should be null initially", () => {
        let nodeCache: NodeCache = new NodeCache();
        expect(nodeCache.mesh).toBeNull();
    });
});

describe("NodeCache.sequenceEdges$", () => {
    it("should emit uncached empty edge status initially", (done) => {
        let nodeCache: NodeCache = new NodeCache();

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
        let nodeCache: NodeCache = new NodeCache();

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


    describe("NodeCache.resetSequenc eEdges", () => {
        it("should reset the sequence edges", () => {
            let nodeCache: NodeCache = new NodeCache();

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
});

describe("NodeCache.spatialEdges$", () => {
    it("should emit uncached empty edge status initially", (done) => {
        let nodeCache: NodeCache = new NodeCache();

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
        let nodeCache: NodeCache = new NodeCache();

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

    describe("NodeCache.resetSpatialEdges", () => {
        it("should reset the spatial edges", () => {
            let nodeCache: NodeCache = new NodeCache();

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
            let nodeCache: NodeCache = new NodeCache();

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
        });
    });
});
