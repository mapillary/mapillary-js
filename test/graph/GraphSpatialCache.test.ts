import { bootstrap } from "../Bootstrap";
bootstrap();

import { of as observableOf } from "rxjs";
import { NavigationEdgeStatus } from "../../src/graph/interfaces/NavigationEdgeStatus";
import { ImageHelper } from "../helper/ImageHelper";
import { DataProvider } from "../helper/ProviderHelper";
import { APIWrapper } from "../../src/api/APIWrapper";
import { Graph } from "../../src/graph/Graph";
import { GraphService } from "../../src/graph/GraphService";
import { Image } from "../../src/graph/Image";
import { ImageCache } from "../../src/graph/ImageCache";
import { GraphMapillaryError } from "../../src/error/GraphMapillaryError";

function createGraph(maxUnusedImages: number = 0): Graph {
    const provider = new DataProvider();
    spyOn(provider.geometry, "lngLatToCellId").and.returnValue("cell-id");
    const api = new APIWrapper(provider);
    spyOn(api, "getImages$").and.callFake((ids: string[]) => {
        return observableOf(ids.map((id: string) => {
            const ent = new ImageHelper().createImageEnt();
            ent.id = id;
            return { node: ent, node_id: id };
        }));
    });
    spyOn(api, "getCoreImages$").and.returnValue(observableOf({
        cell_id: "cell-id",
        images: [new ImageHelper().createCoreImageEnt()],
    }));
    spyOn(api, "getSpatialImages$").and.returnValue(observableOf([{
        node: new ImageHelper().createSpatialImageEnt(),
        node_id: "iid",
    }]));
    spyOn(api, "getSequence$").and.returnValue(observableOf({
        id: "sid",
        image_ids: ["first", "second"],
    }));
    return new Graph(api, undefined, undefined, undefined, undefined, undefined, {
        maxSequences: 50,
        maxUnusedImages,
        maxUnusedPreStoredImages: 0,
        maxUnusedTiles: 20,
    });
}

function cacheNode(graph: Graph, id: string): Image {
    if (!graph.hasNode(id)) {
        graph.cacheFull$(id).subscribe();
    }
    if (!graph.hasNodeSequence(id)) {
        graph.cacheNodeSequence$(id).subscribe();
    }
    graph.initializeCache(id);
    expect(graph.hasSpatialArea(id)).toBe(true);
    return graph.getNode(id);
}

function cacheEdges(graph: Graph, id: string): void {
    expect(graph.hasSpatialArea(id)).toBe(true);
    graph.cacheSpatialEdges(id);
}

describe("Graph spatial cache lifecycle", () => {
    it("should forget edges when a prestored image is disposed", () => {
        const graph = createGraph();
        const node = cacheNode(graph, "first");
        cacheEdges(graph, "first");
        graph.uncache([], []);

        expect(node.hasInitializedCache()).toBe(false);
        expect(graph.hasNode("first")).toBe(false);
        expect(() => graph.resetSpatialEdges()).not.toThrow();
    });

    it("should recache a prestored image with the same id after eviction", () => {
        const graph = createGraph();
        cacheNode(graph, "first");
        cacheEdges(graph, "first");
        graph.uncache([], []);

        const node = cacheNode(graph, "first");
        expect(() => cacheEdges(graph, "first")).not.toThrow();
        expect(node.spatialEdges.cached).toBe(true);
    });

    it("should clear edges before disposing a prestored image", () => {
        const graph = createGraph();
        const node = cacheNode(graph, "first");
        cacheEdges(graph, "first");
        const reset = spyOn(node, "resetSpatialEdges").and.callThrough();
        const subscription = node.spatialEdges$.subscribe((status: NavigationEdgeStatus): void => {
            if (!status.cached && reset.calls.count() === 0) {
                graph.resetSpatialEdges();
            }
        });

        graph.uncache([], []);
        subscription.unsubscribe();
        expect(reset.calls.count()).toBe(0);
    });

    it("should forget edges before purging a deleted image", () => {
        const graph = createGraph(100);
        graph.cacheCell$("cell-id").subscribe();
        const node = cacheNode(graph, "iid");
        cacheEdges(graph, "iid");
        graph.deleteClusters$(["clid"]).subscribe();
        graph.uncache([], ["cell-id"]);

        expect(node.hasInitializedCache()).toBe(false);
        expect(() => graph.resetSpatialEdges()).not.toThrow();
        const reset = spyOn(node, "resetSpatialEdges").and.callThrough();
        graph.resetSpatialEdges();
        expect(reset.calls.count()).toBe(0);
    });

    it("should reset a deleted image while it remains in use", () => {
        const graph = createGraph(100);
        graph.cacheCell$("cell-id").subscribe();
        const node = cacheNode(graph, "iid");
        cacheEdges(graph, "iid");
        graph.deleteClusters$(["clid"]).subscribe();
        graph.uncache(["iid"], ["cell-id"]);

        expect(node.hasInitializedCache()).toBe(true);
        graph.resetSpatialEdges();
        expect(node.spatialEdges.cached).toBe(false);
    });

    it("should retain edges when uncaching keeps the image", () => {
        const graph = createGraph();
        const node = cacheNode(graph, "first");
        cacheEdges(graph, "first");
        graph.uncache(["first"], ["cell-id"]);

        expect(node.spatialEdges.cached).toBe(true);
        graph.resetSpatialEdges();
        expect(node.spatialEdges.cached).toBe(false);
    });

    it("should reset edges cached during a cache notification", () => {
        const graph = createGraph();
        const node = cacheNode(graph, "first");
        const subscription = node.spatialEdges$.subscribe((status: NavigationEdgeStatus): void => {
            if (status.cached) {
                graph.resetSpatialEdges();
            }
        });

        cacheEdges(graph, "first");
        subscription.unsubscribe();
        expect(node.spatialEdges.cached).toBe(false);
        expect(() => cacheEdges(graph, "first")).not.toThrow();
    });

    it("should preserve edges recached during a reset notification", () => {
        const graph = createGraph();
        const node = cacheNode(graph, "first");
        cacheEdges(graph, "first");
        const errors: Error[] = [];
        const subscription = node.spatialEdges$.subscribe((status: NavigationEdgeStatus): void => {
            if (!status.cached) {
                try {
                    cacheEdges(graph, "first");
                } catch (error) {
                    errors.push(error);
                }
            }
        });

        graph.resetSpatialEdges();
        subscription.unsubscribe();
        expect(errors).toEqual([]);
        expect(node.spatialEdges.cached).toBe(true);
        graph.resetSpatialEdges();
        expect(node.spatialEdges.cached).toBe(false);
    });

    it("should tolerate a nested reset without resetting twice", () => {
        const graph = createGraph();
        const node = cacheNode(graph, "first");
        cacheEdges(graph, "first");
        const reset = spyOn(node, "resetSpatialEdges").and.callThrough();
        const subscription = node.spatialEdges$.subscribe((status: NavigationEdgeStatus): void => {
            if (!status.cached && reset.calls.count() === 1) {
                graph.resetSpatialEdges();
            }
        });

        graph.resetSpatialEdges();
        subscription.unsubscribe();
        expect(reset.calls.count()).toBe(1);
    });

    it("should tolerate another image being uncached during reset", () => {
        const graph = createGraph();
        const first = cacheNode(graph, "first");
        const second = cacheNode(graph, "second");
        cacheEdges(graph, "first");
        cacheEdges(graph, "second");
        const subscription = first.spatialEdges$.subscribe((status: NavigationEdgeStatus): void => {
            if (!status.cached) {
                second.uncache();
            }
        });

        expect(() => graph.resetSpatialEdges()).not.toThrow();
        subscription.unsubscribe();
    });

    it("should not reset another image recached during a reset notification", () => {
        const graph = createGraph();
        const first = cacheNode(graph, "first");
        const second = cacheNode(graph, "second");
        cacheEdges(graph, "first");
        cacheEdges(graph, "second");
        const errors: Error[] = [];
        const subscription = first.spatialEdges$.subscribe((status: NavigationEdgeStatus): void => {
            if (!status.cached) {
                try {
                    cacheEdges(graph, "second");
                } catch (error) {
                    errors.push(error);
                }
            }
        });

        graph.resetSpatialEdges();
        subscription.unsubscribe();
        expect(errors).toEqual([]);
        expect(second.spatialEdges.cached).toBe(true);
        graph.resetSpatialEdges();
        expect(second.spatialEdges.cached).toBe(false);
    });

    it("should not record spatial edges when the image cache is uninitialized", () => {
        const graph = createGraph();
        graph.cacheFull$("first").subscribe();
        graph.cacheNodeSequence$("first").subscribe();
        expect(graph.hasSpatialArea("first")).toBe(true);

        expect(() => graph.cacheSpatialEdges("first"))
            .toThrowError(GraphMapillaryError);
        graph.initializeCache("first");
        expect(() => cacheEdges(graph, "first")).not.toThrow();
    });

    it("should still reject a genuinely duplicate cache operation", () => {
        const graph = createGraph();
        cacheNode(graph, "first");
        cacheEdges(graph, "first");

        expect(() => graph.cacheSpatialEdges("first"))
            .toThrowError(GraphMapillaryError);
    });

    it("should apply a filter after an evicted image is disposed", () => {
        const graph = createGraph();
        cacheNode(graph, "first");
        cacheEdges(graph, "first");
        const service = new GraphService(graph);
        graph.uncache([], []);
        let completed = false;
        const error = jasmine.createSpy("filterError");

        service.setFilter$(["==", "sequenceId", "sid"]).subscribe({
            complete: () => { completed = true; },
            error,
        });

        expect(error).not.toHaveBeenCalled();
        expect(completed).toBe(true);
        service.dispose();
    });
});

describe("Image.resetSpatialEdges lifecycle", () => {
    it("should be a no-op before cache initialization", () => {
        const image = new Image(new ImageHelper().createCoreImageEnt());
        expect(() => image.resetSpatialEdges()).not.toThrow();
        expect(image.hasInitializedCache()).toBe(false);
    });

    it("should be a no-op after uncaching or disposing", () => {
        const image = new Image(new ImageHelper().createCoreImageEnt());
        image.initializeCache(new ImageCache(undefined));
        image.uncache();
        expect(() => image.resetSpatialEdges()).not.toThrow();
        image.dispose();
        expect(() => image.resetSpatialEdges()).not.toThrow();
    });

    it("should reset a new cache after reinitialization", () => {
        const image = new Image(new ImageHelper().createCoreImageEnt());
        image.initializeCache(new ImageCache(undefined));
        image.uncache();
        image.initializeCache(new ImageCache(undefined));
        image.cacheSpatialEdges([]);
        image.resetSpatialEdges();
        expect(image.spatialEdges).toEqual({ cached: false, edges: [] });
    });
});
