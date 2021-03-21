import { bootstrap } from "../Bootstrap";
bootstrap();

import {
    from as observableFrom,
    merge as observableMerge,
    of as observableOf,
    Observable,
    Subject,
} from "rxjs";
import {
    first,
    mergeAll,
} from "rxjs/operators";
import { NodeHelper } from "../helper/NodeHelper";
import { Node } from "../../src/graph/Node";
import { APIWrapper } from "../../src/api/APIWrapper";
import { FalcorDataProvider } from "../../src/api/falcor/FalcorDataProvider";
import { GeohashGeometryProvider } from "../../src/api/GeohashGeometryProvider";
import { CoreImageEnt } from "../../src/api/ents/CoreImageEnt";
import { SpatialImageEnt } from "../../src/api/ents/SpatialImageEnt";
import { ImageEnt } from "../../src/api/ents/ImageEnt";
import { GraphMapillaryError } from "../../src/error/GraphMapillaryError";
import { EdgeCalculator } from "../../src/graph/edge/EdgeCalculator";
import {
    Graph,
    NodeIndexItem,
} from "../../src/graph/Graph";
import { GraphCalculator } from "../../src/graph/GraphCalculator";
import { GraphConfiguration } from "../../src/graph/interfaces/GraphConfiguration";
import { Sequence } from "../../src/graph/Sequence";
import { DataProvider, GeometryProvider } from "../helper/ProviderHelper";
import { SequenceEnt } from "../../src/api/ents/SequenceEnt";
import { SpatialImagesContract } from "../../src/api/contracts/SpatialImagesContract";
import { SequencesContract } from "../../src/api/contracts/SequencesContract";
import { ImagesContract } from "../../src/api/contracts/ImagesContract";

describe("Graph.ctor", () => {
    it("should create a graph", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));

        const graph = new Graph(api);

        expect(graph).toBeDefined();
    });

    it("should create a graph with all ctor params", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const graph = new Graph(api, undefined, calculator);

        expect(graph).toBeDefined();
    });
});

describe("Graph.cacheBoundingBox$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    test("should cache one node in the bounding box", (done: Function) => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "bboxToCellIds").and.returnValue([h]);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const id = "id";
        const getSpatialImages = new Subject<SpatialImagesContract>();
        spyOn(api, "getSpatialImages$").and.returnValue(getSpatialImages);

        const fullNode = helper.createFullNode();
        fullNode.id = id;
        fullNode.computed_geometry.lat = 0.5;
        fullNode.computed_geometry.lon = 0.5;

        const graph = new Graph(api, undefined, calculator);

        graph.cacheBoundingBox$({ lat: 0, lon: 0 }, { lat: 1, lon: 1 })
            .subscribe(
                (nodes: Node[]): void => {
                    expect(nodes.length).toBe(1);
                    expect(nodes[0].id).toBe(fullNode.id);
                    expect(nodes[0].full).toBe(true);

                    expect(graph.hasNode(id)).toBe(true);

                    done();
                });

        const tileResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        tileResult[h] = {};
        tileResult[h]["0"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        const spatialImages: SpatialImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getSpatialImages.next(spatialImages);
        getSpatialImages.complete();
    });

    it("should not cache tile of fill node if already cached", (done: Function) => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "bboxToCellIds").and.returnValue([h]);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        const imagesByHSpy = spyOn(api, "getCoreImages$");
        imagesByHSpy.and.returnValue(imagesByH);

        const id = "id";
        const getSpatialImages = new Subject<SpatialImagesContract>();
        const getSpatialImagesSpy = spyOn(api, "getSpatialImages$");
        getSpatialImagesSpy.and.returnValue(getSpatialImages);

        const getImages = new Subject<ImagesContract>();
        const getImagesSpy = spyOn(api, "getImages$");
        getImagesSpy.and.returnValue(getImages);

        const fullNode = helper.createFullNode();
        fullNode.id = id;
        fullNode.computed_geometry.lat = 0.5;
        fullNode.computed_geometry.lon = 0.5;

        const graph = new Graph(api, undefined, calculator);

        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fullResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fullResult);
        getImages.complete();

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const tileResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        tileResult[h] = {};
        tileResult[h]["0"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);
        expect(graph.hasTiles(fullNode.id)).toBe(true);

        expect(imagesByHSpy.calls.count()).toBe(1);
        expect(getSpatialImagesSpy.calls.count()).toBe(0);
        expect(getImagesSpy.calls.count()).toBe(1);

        graph.cacheBoundingBox$({ lat: 0, lon: 0 }, { lat: 1, lon: 1 })
            .subscribe(
                (nodes: Node[]): void => {
                    expect(nodes.length).toBe(1);
                    expect(nodes[0].id).toBe(fullNode.id);
                    expect(nodes[0].full).toBe(true);

                    expect(graph.hasNode(id)).toBe(true);

                    expect(imagesByHSpy.calls.count()).toBe(1);
                    expect(getSpatialImagesSpy.calls.count()).toBe(0);
                    expect(getImagesSpy.calls.count()).toBe(1);

                    done();
                });
    });

    test("should only cache tile once for two similar calls", (done: Function) => {
        const dataProvider = new DataProvider();
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(dataProvider.geometry, "bboxToCellIds").and.returnValue([h]);
        spyOn(dataProvider.geometry, "latLonToCellIds").and.returnValue([h]);
        spyOn(dataProvider.geometry, "latLonToCellId").and.returnValue(h);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        const imagesByHSpy = spyOn(api, "getCoreImages$");
        imagesByHSpy.and.returnValue(imagesByH);

        const id = "id";
        const getSpatialImages = new Subject<SpatialImagesContract>();
        spyOn(api, "getSpatialImages$").and.returnValue(getSpatialImages);

        const fullNode = helper.createFullNode();
        fullNode.id = id;
        fullNode.computed_geometry.lat = 0.5;
        fullNode.computed_geometry.lon = 0.5;

        const graph = new Graph(api, undefined, calculator);

        let count: number = 0;
        observableMerge(
            graph.cacheBoundingBox$({ lat: 0, lon: 0 }, { lat: 1, lon: 1 }),
            graph.cacheBoundingBox$({ lat: 0, lon: 0 }, { lat: 1, lon: 1 }))
            .subscribe(
                (nodes: Node[]): void => {
                    expect(nodes.length).toBe(1);
                    expect(nodes[0].id).toBe(fullNode.id);
                    expect(nodes[0].full).toBe(true);

                    expect(graph.hasNode(id)).toBe(true);

                    count++;
                },
                undefined,
                (): void => {
                    expect(count).toBe(2);
                    expect(imagesByHSpy.calls.count()).toBe(1);

                    done();
                });

        const tileResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        tileResult[h] = {};
        tileResult[h]["0"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        const spatialImages: SpatialImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getSpatialImages.next(spatialImages);
        getSpatialImages.complete();
    });
});

describe("Graph.cacheFull$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should be fetching", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const fullNode = helper.createFullNode();
        const getImages = new Subject<ImagesContract>();

        spyOn(api, "getImages$").and.returnValue(getImages);

        const graph = new Graph(api, undefined, calculator);
        graph.cacheFull$(fullNode.id);

        expect(graph.isCachingFull(fullNode.id)).toBe(true);
        expect(graph.hasNode(fullNode.id)).toBe(false);
        expect(graph.getNode(fullNode.id)).toBeUndefined();
    });

    it("should fetch", (done: Function) => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id)
            .subscribe(
                (g: Graph): void => {
                    expect(g.isCachingFull(fullNode.id)).toBe(false);
                    expect(g.hasNode(fullNode.id)).toBe(true);
                    expect(g.getNode(fullNode.id)).toBeDefined();
                    expect(g.getNode(fullNode.id).id).toBe(fullNode.id);

                    done();
                });

        getImages.next(result);
        getImages.complete();

        expect(graph.isCachingFull(fullNode.id)).toBe(false);
        expect(graph.hasNode(fullNode.id)).toBe(true);
        expect(graph.getNode(fullNode.id)).toBeDefined();
        expect(graph.getNode(fullNode.id).id).toBe(fullNode.id);
    });

    it("should not make additional calls when fetching same node twice", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const fullNode = helper.createFullNode();
        const getImages = new Subject<ImagesContract>();

        const getImagesSpy = spyOn(api, "getImages$");
        getImagesSpy.and.returnValue(getImages);

        const graph = new Graph(api, undefined, calculator);

        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        expect(getImagesSpy.calls.count()).toBe(1);
    });

    it("should throw when fetching node already in graph", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();

        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(result);
        getImages.complete();

        expect(graph.isCachingFull(fullNode.id)).toBe(false);
        expect(() => { graph.cacheFull$(fullNode.id); }).toThrowError(Error);
    });

    it("should throw if sequence key is missing", (done: Function) => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        fullNode.sequence.id = undefined;

        graph.cacheFull$(fullNode.id)
            .subscribe(
                (): void => { return; },
                (): void => {
                    done();
                });

        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(result);
        getImages.complete();
    });

    it("should make full when fetched node has been retrieved in tile in parallell", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const id = "id";
        const otherKey = "otherKey";
        const getImages = new Subject<ImagesContract>();
        const getImagesOther = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.callFake(
            (imageIds: string[]): Observable<ImagesContract> => {
                if (imageIds[0] === id) {
                    return getImages;
                } else if (imageIds[0] === otherKey) {
                    return getImagesOther;
                }

                throw new GraphMapillaryError("Wrong key.");
            });

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const graph = new Graph(api, undefined, calculator);

        const otherNode = helper.createFullNode();
        otherNode.id = otherKey;
        graph.cacheFull$(otherNode.id).subscribe(() => { /*noop*/ });

        const otherFullResult: ImagesContract = [{
            node: otherNode,
            node_id: otherNode.id,
        }];
        getImagesOther.next(otherFullResult);
        getImagesOther.complete();

        graph.hasTiles(otherNode.id);
        observableFrom(graph.cacheTiles$(otherNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const fullNode = helper.createFullNode();
        fullNode.id = id;
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        expect(graph.hasNode(fullNode.id)).toBe(false);
        expect(graph.isCachingFull(fullNode.id)).toBe(true);

        const tileResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        tileResult[h] = {};
        tileResult[h]["0"] = otherNode;
        tileResult[h]["1"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);
        expect(graph.getNode(fullNode.id).full).toBe(false);

        const fullResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fullResult);
        getImages.complete();

        expect(graph.getNode(fullNode.id).full).toBe(true);
    });
});

describe("Graph.cacheFill$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should be filling", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const getSpatialImages = new Subject<SpatialImagesContract>();
        spyOn(api, "getSpatialImages$").and.returnValue(getSpatialImages);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const tileNode: CoreImageEnt = helper.createCoreNode();
        tileNode.id = "tileNodeKey";
        const result: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        result[h] = {};
        result[h]["0"] = tileNode;
        imagesByH.next(result);

        expect(graph.getNode(tileNode.id).full).toBe(false);
        expect(graph.isCachingFill(tileNode.id)).toBe(false);

        graph.cacheFill$(tileNode.id).subscribe(() => { /*noop*/ });

        expect(graph.getNode(tileNode.id).full).toBe(false);
        expect(graph.isCachingFill(tileNode.id)).toBe(true);
    });

    it("should fill", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const getSpatialImages = new Subject<SpatialImagesContract>();
        spyOn(api, "getSpatialImages$").and.returnValue(getSpatialImages);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const tileNode: CoreImageEnt = helper.createCoreNode();
        tileNode.id = "tileNodeKey";
        const result: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        result[h] = {};
        result[h]["0"] = tileNode;
        imagesByH.next(result);

        expect(graph.getNode(tileNode.id).full).toBe(false);
        expect(graph.isCachingFill(tileNode.id)).toBe(false);

        graph.cacheFill$(tileNode.id).subscribe(() => { /*noop*/ });

        const fillTileNode = helper.createFullNode();
        fillTileNode.id = tileNode.id;
        const spatialImages: SpatialImagesContract = [{
            node: fillTileNode,
            node_id: fillTileNode.id,
        }];
        getSpatialImages.next(spatialImages);

        expect(graph.getNode(tileNode.id).full).toBe(true);
        expect(graph.isCachingFill(tileNode.id)).toBe(false);
    });

    it("should not make additional calls when filling same node twice", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const getSpatialImages = new Subject<SpatialImagesContract>();
        const getSpatialImagesSpy = spyOn(api, "getSpatialImages$");
        getSpatialImagesSpy.and.returnValue(getSpatialImages);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const tileNode: CoreImageEnt = helper.createCoreNode();
        tileNode.id = "tileNodeKey";
        const result: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        result[h] = {};
        result[h]["0"] = tileNode;
        imagesByH.next(result);

        expect(graph.getNode(tileNode.id).full).toBe(false);
        expect(graph.isCachingFill(tileNode.id)).toBe(false);

        graph.cacheFill$(tileNode.id).subscribe(() => { /*noop*/ });
        graph.cacheFill$(tileNode.id).subscribe(() => { /*noop*/ });

        expect(getSpatialImagesSpy.calls.count()).toBe(1);
    });

    it("should throw if already fetching", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.id);

        expect(graph.isCachingFull(fullNode.id)).toBe(true);

        expect(() => { graph.cacheFill$(fullNode.id); }).toThrowError(Error);
    });

    it("should throw if node does not exist", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getSpatialImages = new Subject<SpatialImagesContract>();
        spyOn(api, "getSpatialImages$").and.returnValue(getSpatialImages);

        const graph = new Graph(api, undefined, calculator);

        expect(() => { graph.cacheFill$("key"); }).toThrowError(Error);
    });

    it("should throw if already full", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const getSpatialImages = new Subject<SpatialImagesContract>();
        spyOn(api, "getSpatialImages$").and.returnValue(getSpatialImages);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.id);

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);

        expect(() => { graph.cacheFill$(fullNode.id); }).toThrowError(Error);
    });
});

describe("Graph.cacheTiles$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should be caching tiles", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const node = helper.createNode();

        spyOn(geometryProvider, "latLonToCellIds").and.returnValue(["h"]);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const graph = new Graph(api, undefined, calculator);

        spyOn(graph, "hasNode").and.returnValue(true);
        spyOn(graph, "getNode").and.returnValue(node);

        expect(graph.hasTiles(node.id)).toBe(false);
        expect(graph.isCachingTiles(node.id)).toBe(false);

        graph.cacheTiles$(node.id);

        expect(graph.hasTiles(node.id)).toBe(false);
        expect(graph.isCachingTiles(node.id)).toBe(true);
    });

    it("should cache tiles", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const fullNode = helper.createFullNode();

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imageByKeyResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        const getImages: Observable<ImagesContract> = observableOf<ImagesContract>(imageByKeyResult);
        spyOn(api, "getImages$").and.returnValue(getImages);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const graph = new Graph(api, undefined, calculator);
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        expect(graph.hasTiles(fullNode.id)).toBe(false);
        expect(graph.isCachingTiles(fullNode.id)).toBe(false);

        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const result: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        result[h] = {};
        result[h]["0"] = fullNode;
        imagesByH.next(result);

        expect(graph.hasTiles(fullNode.id)).toBe(true);
        expect(graph.isCachingTiles(fullNode.id)).toBe(false);
    });

    it("should encode hs only once when checking tiles cache", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const node = helper.createNode();

        const h = "h";
        const encodeHsSpy = spyOn(geometryProvider, "latLonToCellIds");
        encodeHsSpy.and.returnValue([h]);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const graph = new Graph(api, undefined, calculator);

        spyOn(graph, "hasNode").and.returnValue(true);
        spyOn(graph, "getNode").and.returnValue(node);

        expect(graph.hasTiles(node.id)).toBe(false);
        expect(graph.hasTiles(node.id)).toBe(false);

        expect(encodeHsSpy.calls.count()).toBe(1);
    });

    it("should encode hs only once when caching tiles", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const fullNode = helper.createFullNode();

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        const encodeHsSpy = spyOn(geometryProvider, "latLonToCellIds");
        encodeHsSpy.and.returnValue([h]);

        const imageByKeyResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        const getImages: Observable<ImagesContract> = observableOf<ImagesContract>(imageByKeyResult);
        spyOn(api, "getImages$").and.returnValue(getImages);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const graph = new Graph(api, undefined, calculator);
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        expect(graph.hasTiles(fullNode.id)).toBe(false);

        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const result: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        result[h] = {};
        result[h]["0"] = fullNode;
        imagesByH.next(result);

        expect(graph.hasTiles(fullNode.id)).toBe(true);

        expect(encodeHsSpy.calls.count()).toBe(1);
    });
});

describe("Graph.cacheSequenceNodes$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should throw when sequence does not exist", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);

        expect(() => { graph.cacheSequenceNodes$("sequenceId"); }).toThrowError(Error);
    });

    it("should not be cached", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);

        const sequenceId = "sequenceId";
        const id = "id";

        graph.cacheSequence$(sequenceId).subscribe();

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [id] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        expect(graph.hasSequenceNodes(sequenceId)).toBe(false);
    });

    it("should start caching", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);

        const sequenceId = "sequenceId";
        const id = "id";

        graph.cacheSequence$(sequenceId).subscribe();

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [id] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceId)).toBe(true);
    });

    it("should be cached and not caching", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);

        const sequenceId = "sequenceId";
        const nodeKey = "nodeKey";

        graph.cacheSequence$(sequenceId).subscribe();

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [nodeKey] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId).subscribe();

        const fullNode = helper.createFullNode();
        fullNode.id = nodeKey;
        const imageResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        imageByKey.next(imageResult);
        imageByKey.complete();

        expect(graph.hasSequenceNodes(sequenceId)).toBe(true);
        expect(graph.isCachingSequenceNodes(sequenceId)).toBe(false);
        expect(graph.hasNode(nodeKey)).toBe(true);
        expect(graph.getNode(nodeKey).id).toBe(nodeKey);
    });

    it("should not be cached after uncaching sequence node", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const graphCalculator = new GraphCalculator(null);
        spyOn(geometryProvider, "latLonToCellId").and.returnValue("h");

        const edgeCalculator = new EdgeCalculator();
        const configuration: GraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator, undefined, configuration);

        const sequenceId = "sequenceId";
        const nodeKey = "nodeKey";

        graph.cacheSequence$(sequenceId).subscribe();

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [nodeKey] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId).subscribe();

        const fullNode = helper.createFullNode();
        fullNode.id = nodeKey;
        fullNode.sequence.id = sequenceId;
        const imageResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        imageByKey.next(imageResult);
        imageByKey.complete();

        expect(graph.hasSequenceNodes(sequenceId)).toBe(true);

        graph.uncache([]);

        expect(graph.hasSequenceNodes(sequenceId)).toBe(false);
    });

    it("should not be cached after uncaching sequence", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const graphCalculator = new GraphCalculator(null);
        spyOn(geometryProvider, "latLonToCellId").and.returnValue("h");

        const edgeCalculator = new EdgeCalculator();
        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator, undefined, configuration);

        const sequenceId = "sequenceId";
        const nodeKey = "nodeKey";

        graph.cacheSequence$(sequenceId).subscribe();

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [nodeKey] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId).subscribe();

        const fullNode = helper.createFullNode();
        fullNode.id = nodeKey;
        fullNode.sequence.id = sequenceId;
        const imageResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        imageByKey.next(imageResult);
        imageByKey.complete();

        graph.initializeCache(fullNode.id);

        expect(graph.hasSequenceNodes(sequenceId)).toBe(true);

        graph.uncache([]);

        expect(graph.hasSequenceNodes(sequenceId)).toBe(false);
    });

    it("should be cached after uncaching if sequence is kept", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const graphCalculator = new GraphCalculator(null);
        spyOn(geometryProvider, "latLonToCellId").and.returnValue("h");

        const edgeCalculator = new EdgeCalculator();
        const configuration: GraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator, undefined, configuration);

        const sequenceId = "sequenceId";
        const nodeKey = "nodeKey";

        graph.cacheSequence$(sequenceId).subscribe();

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [nodeKey] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId).subscribe();

        const fullNode = helper.createFullNode();
        fullNode.id = nodeKey;
        fullNode.sequence.id = sequenceId;
        const imageResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        imageByKey.next(imageResult);
        imageByKey.complete();

        expect(graph.hasSequenceNodes(sequenceId)).toBe(true);

        graph.uncache([], sequenceId);

        expect(graph.hasSequenceNodes(sequenceId)).toBe(true);
    });

    it("should be cached after uncaching if all nodes are kept", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const graphCalculator = new GraphCalculator(null);
        spyOn(geometryProvider, "latLonToCellId").and.returnValue("h");

        const edgeCalculator = new EdgeCalculator();
        const configuration: GraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator, undefined, configuration);

        const sequenceId = "sequenceId";
        const nodeKey = "nodeKey";

        graph.cacheSequence$(sequenceId).subscribe();

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [nodeKey] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId).subscribe();

        const fullNode = helper.createFullNode();
        fullNode.id = nodeKey;
        fullNode.sequence.id = sequenceId;
        const imageResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        imageByKey.next(imageResult);
        imageByKey.complete();

        expect(graph.hasSequenceNodes(sequenceId)).toBe(true);

        graph.uncache([fullNode.id]);

        expect(graph.hasSequenceNodes(sequenceId)).toBe(true);
    });

    it("should not be cached after uncaching tile", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const graphCalculator = new GraphCalculator(null);
        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const edgeCalculator = new EdgeCalculator();
        const configuration: GraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator, undefined, configuration);

        const sequenceId = "sequenceId";
        const nodeKey = "nodeKey";

        graph.cacheSequence$(sequenceId).subscribe();

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [nodeKey] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId).subscribe();

        const fullNode = helper.createFullNode();
        fullNode.id = nodeKey;
        fullNode.sequence.id = sequenceId;
        const imageResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        imageByKey.next(imageResult);
        imageByKey.complete();

        graph.initializeCache(fullNode.id);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.id)).toBe(true);

        expect(graph.hasSequenceNodes(sequenceId)).toBe(true);

        const node = graph.getNode(fullNode.id);
        const nodeUncacheSpy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasSequenceNodes(sequenceId)).toBe(false);
    });

    it("should be cached after uncaching tile if sequence is kept", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const graphCalculator = new GraphCalculator(null);
        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const edgeCalculator = new EdgeCalculator();
        const configuration: GraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator, undefined, configuration);

        const sequenceId = "sequenceId";
        const nodeKey = "nodeKey";

        graph.cacheSequence$(sequenceId).subscribe();

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [nodeKey] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId).subscribe();

        const fullNode = helper.createFullNode();
        fullNode.id = nodeKey;
        fullNode.sequence.id = sequenceId;
        const imageResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        imageByKey.next(imageResult);
        imageByKey.complete();

        graph.initializeCache(fullNode.id);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.id)).toBe(true);

        expect(graph.hasSequenceNodes(sequenceId)).toBe(true);

        const node = graph.getNode(fullNode.id);
        const nodeUncacheSpy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy = spyOn(node, "dispose").and.stub();

        graph.uncache([], sequenceId);

        expect(nodeUncacheSpy.calls.count()).toBe(1);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasSequenceNodes(sequenceId)).toBe(true);
    });

    it("should throw if caching already cached sequence nodes", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);

        const sequenceId = "sequenceId";
        const nodeKey = "nodeKey";

        graph.cacheSequence$(sequenceId).subscribe();

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [nodeKey] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId).subscribe();

        const fullNode = helper.createFullNode();
        fullNode.id = nodeKey;
        const imageResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        imageByKey.next(imageResult);
        imageByKey.complete();

        expect(() => { graph.cacheSequenceNodes$(sequenceId); }).toThrowError(Error);
    });

    it("should only call API once if caching multiple times before response", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        const imageByKeySpy = spyOn(api, "getImages$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);

        const sequenceId = "sequenceId";
        const nodeKey = "nodeKey";

        graph.cacheSequence$(sequenceId).subscribe();

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [nodeKey] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId).subscribe();
        graph.cacheSequenceNodes$(sequenceId).subscribe();

        const fullNode = helper.createFullNode();
        fullNode.id = nodeKey;
        const imageResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        imageByKey.next(imageResult);
        imageByKey.complete();

        expect(imageByKeySpy.calls.count()).toBe(1);
    });

    it("should not be cached and not caching on error", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);

        const sequenceId = "sequenceId";
        const nodeKey = "nodeKey";

        graph.cacheSequence$(sequenceId).subscribe();

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [nodeKey] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId)
            .subscribe(
                (): void => { /*noop*/ },
                (): void => { /*noop*/ });

        imageByKey.error(new Error("404"));

        expect(graph.hasSequenceNodes(sequenceId)).toBe(false);
        expect(graph.isCachingSequenceNodes(sequenceId)).toBe(false);
        expect(graph.hasNode(nodeKey)).toBe(false);
    });

    it("should start caching in with single batch when lass than or equal to 200 nodes", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        const imageByKeySpy = spyOn(api, "getImages$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);

        const sequenceId = "sequenceId";

        graph.cacheSequence$(sequenceId).subscribe();

        const result: SequencesContract = [{
            node: {
                id: sequenceId,
                image_ids: Array(200)
                    .fill(undefined)
                    .map((_, i) => i.toString())
            },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceId)).toBe(true);

        expect(imageByKeySpy.calls.count()).toBe(1);
        expect(imageByKeySpy.calls.argsFor(0)[0].length).toBe(200);
        expect(
            imageByKeySpy.calls.allArgs()
                .map((args: string[][]): number => { return args[0].length; })
                .reduce((acc: number, cur: number): number => { return acc + cur; }, 0))
            .toBe(200);
    });

    it("should start caching in batches when more than 200 nodes", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        const imageByKeySpy = spyOn(api, "getImages$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);

        const sequenceId = "sequenceId";

        graph.cacheSequence$(sequenceId).subscribe();

        const result: SequencesContract = [{
            node: {
                id: sequenceId,
                image_ids: Array(201)
                    .fill(undefined)
                    .map((_, i) => i.toString()),
            },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceId)).toBe(true);

        expect(imageByKeySpy.calls.count()).toBe(2);
        expect(imageByKeySpy.calls.argsFor(0)[0].length).toBe(200);
        expect(imageByKeySpy.calls.argsFor(1)[0].length).toBe(1);
        expect(
            imageByKeySpy.calls.allArgs()
                .map((args: string[][]): number => { return args[0].length; })
                .reduce((acc: number, cur: number): number => { return acc + cur; }, 0))
            .toBe(201);
    });

    it("should start caching prioritized batch when reference node key is specified at start", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        const imageByKeySpy = spyOn(api, "getImages$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);

        const sequenceId = "sequenceId";

        graph.cacheSequence$(sequenceId).subscribe();

        const referenceNodeKey = "referenceNodeKey";

        const result: SequencesContract = [{
            node: {
                id: sequenceId,
                image_ids: Array
                    .from(
                        new Array(400),
                        (_, i): string => i.toString())
            },
            node_id: sequenceId,
        }];
        result[0].node.image_ids.splice(0, 1, referenceNodeKey);
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId, referenceNodeKey).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceId)).toBe(true);

        expect(imageByKeySpy.calls.count()).toBe(3);
        expect(imageByKeySpy.calls.argsFor(0)[0].length).toBe(50);
        expect(imageByKeySpy.calls.argsFor(0)[0][0]).toBe(referenceNodeKey);
        expect(imageByKeySpy.calls.argsFor(1)[0].length).toBe(200);
        expect(imageByKeySpy.calls.argsFor(2)[0].length).toBe(400 - 200 - 50);
        expect(
            imageByKeySpy.calls.allArgs()
                .map((args: string[][]): number => { return args[0].length; })
                .reduce((acc: number, cur: number): number => { return acc + cur; }, 0))
            .toBe(400);
    });

    it("should start caching prioritized batch when reference node key is specified at end", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        const imageByKeySpy = spyOn(api, "getImages$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);

        const sequenceId = "sequenceId";

        graph.cacheSequence$(sequenceId).subscribe();

        const referenceNodeKey = "referenceNodeKey";

        const result: SequencesContract = [{
            node: {
                id: sequenceId,
                image_ids: Array
                    .from(
                        new Array(400),
                        (_, i) => i.toString()),
            },
            node_id: sequenceId,
        }];
        result[0].node.image_ids.splice(399, 1, referenceNodeKey);
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId, referenceNodeKey).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceId)).toBe(true);

        expect(imageByKeySpy.calls.count()).toBe(3);
        expect(imageByKeySpy.calls.argsFor(0)[0].length).toBe(50);
        expect(imageByKeySpy.calls.argsFor(0)[0][0]).toBe((400 - 50).toString());
        expect(imageByKeySpy.calls.argsFor(0)[0][49]).toBe(referenceNodeKey);
        expect(imageByKeySpy.calls.argsFor(1)[0].length).toBe(200);
        expect(imageByKeySpy.calls.argsFor(2)[0].length).toBe(400 - 200 - 50);
        expect(
            imageByKeySpy.calls.allArgs()
                .map((args: string[][]): number => { return args[0].length; })
                .reduce((acc: number, cur: number): number => { return acc + cur; }, 0))
            .toBe(400);
    });

    it("should start caching in prioritized batches when reference node key is specified in middle", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        const imageByKeySpy = spyOn(api, "getImages$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);

        const sequenceId = "sequenceId";

        graph.cacheSequence$(sequenceId).subscribe();

        const referenceNodeKey = "referenceNodeKey";

        const result: SequencesContract = [{
            node: {
                id: sequenceId,
                image_ids: Array
                    .from(
                        new Array(400),
                        (_, i) => i.toString()),
            },
            node_id: sequenceId,
        }];
        result[0].node.image_ids.splice(200, 1, referenceNodeKey);
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId, referenceNodeKey).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceId)).toBe(true);

        expect(imageByKeySpy.calls.count()).toBe(3);
        expect(imageByKeySpy.calls.argsFor(0)[0].length).toBe(50);
        expect(imageByKeySpy.calls.argsFor(0)[0][0]).toBe((200 - 25).toString());
        expect(imageByKeySpy.calls.argsFor(0)[0][25]).toBe(referenceNodeKey);
        expect(imageByKeySpy.calls.argsFor(0)[0][49]).toBe((200 + 24).toString());
        expect(imageByKeySpy.calls.argsFor(1)[0].length).toBe(200);
        expect(imageByKeySpy.calls.argsFor(2)[0].length).toBe(400 - 200 - 50);
        expect(
            imageByKeySpy.calls.allArgs()
                .map((args: string[][]): number => { return args[0].length; })
                .reduce((acc: number, cur: number): number => { return acc + cur; }, 0))
            .toBe(400);
    });

    it("should not corrupt sequence when caching in batches", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        const imageByKeySpy = spyOn(api, "getImages$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);

        const sequenceId = "sequenceId";

        graph.cacheSequence$(sequenceId).subscribe();

        const referenceNodeKey = "referenceNodeKey";

        const result: SequencesContract = [{
            node: {
                id: sequenceId,
                image_ids: Array
                    .from(
                        new Array(400),
                        (_, i) => i.toString()),
            },
            node_id: sequenceId,
        }];
        result[0].node.image_ids.splice(200, 1, referenceNodeKey);
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId, referenceNodeKey).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceId)).toBe(true);
        expect(graph.getSequence(sequenceId).imageIds.length).toBe(400);
        expect(graph.getSequence(sequenceId).imageIds)
            .toEqual(result[0].node.image_ids);
    });

    it("should create single batch when fewer than or equal to 50 nodes", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const imageByKey = new Subject<ImagesContract>();
        const imageByKeySpy = spyOn(api, "getImages$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);

        const sequenceId = "sequenceId";

        graph.cacheSequence$(sequenceId).subscribe();

        const referenceNodeKey = "referenceNodeKey";

        const result: SequencesContract = [{
            node: {
                id: sequenceId,
                image_ids: Array
                    .from(
                        new Array(50),
                        (_, i) => i.toString()),
            },
            node_id: sequenceId,
        }];
        result[0].node.image_ids.splice(20, 1, referenceNodeKey);
        getSequences.next(result);
        getSequences.complete();

        graph.cacheSequenceNodes$(sequenceId, referenceNodeKey).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceId)).toBe(true);

        expect(imageByKeySpy.calls.count()).toBe(1);
        expect(imageByKeySpy.calls.argsFor(0)[0].length).toBe(50);
        expect(imageByKeySpy.calls.argsFor(0)[0][0]).toBe((0).toString());
        expect(imageByKeySpy.calls.argsFor(0)[0][20]).toBe(referenceNodeKey);
        expect(imageByKeySpy.calls.argsFor(0)[0][49]).toBe((49).toString());

        expect(
            imageByKeySpy.calls.allArgs()
                .map((args: string[][]): number => { return args[0].length; })
                .reduce((acc: number, cur: number): number => { return acc + cur; }, 0))
            .toBe(50);
    });
});

describe("Graph.cacheSpatialArea$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should be cached", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const fullNode = helper.createFullNode();

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);

        const node = graph.getNode(fullNode.id);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        expect(graph.hasSpatialArea(fullNode.id)).toBe(true);
    });

    test("should not be cached", () => {
        const dataProvider = new DataProvider()
        const api = new APIWrapper(dataProvider);
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const fullNode = helper.createFullNode();

        const h = "h";
        spyOn(dataProvider.geometry, "latLonToCellId").and.returnValue(h);
        spyOn(dataProvider.geometry, "latLonToCellIds").and.returnValue([h]);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);

        const node = graph.getNode(fullNode.id);
        expect(node).toBeDefined();

        spyOn(graphCalculator, "boundingBoxCorners")
            .and.returnValue([{ lat: -0.5, lon: -0.5 }, { lat: 0.5, lon: 0.5 }]);

        const coreNode: CoreImageEnt = helper.createCoreNode();
        coreNode.id = "otherKey";

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const result: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        result[h] = {};
        result[h]["0"] = fullNode;
        result[h]["1"] = coreNode;
        imagesByH.next(result);

        const otherNode = graph.getNode(coreNode.id);
        expect(otherNode).toBeDefined();

        expect(graph.hasSpatialArea(fullNode.id)).toBe(false);
    });
});

describe("Graph.cacheSpatialEdges", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should use fallback keys", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const fullNode = helper.createFullNode();

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);
        getImages.complete();

        graph.cacheNodeSequence$(fullNode.id).subscribe(() => { /*noop*/ });

        const result: SequencesContract = [{
            node: {
                id: fullNode.sequence.id,
                image_ids: ["prev", fullNode.id, "next"],
            },
            node_id: fullNode.sequence.id,
        }];
        getSequences.next(result);
        getSequences.complete();

        const node = graph.getNode(fullNode.id);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        expect(graph.hasSpatialArea(fullNode.id)).toBe(true);

        const getPotentialSpy = spyOn(edgeCalculator, "getPotentialEdges");
        getPotentialSpy.and.returnValue([]);

        spyOn(edgeCalculator, "computeStepEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeTurnEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSphericalEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePerspectiveToSphericalEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSimilarEdges").and.returnValue([]);

        graph.initializeCache(fullNode.id);
        graph.cacheSpatialEdges(fullNode.id);

        expect(getPotentialSpy.calls.first().args.length).toBe(3);
        expect(getPotentialSpy.calls.first().args[2].length).toBe(2);
        expect(getPotentialSpy.calls.first().args[2].indexOf("prev")).not.toBe(-1);
        expect(getPotentialSpy.calls.first().args[2].indexOf("next")).not.toBe(-1);
        expect(getPotentialSpy.calls.first().args[2].indexOf(fullNode.id)).toBe(-1);
    });

    test("should apply filter", () => {
        const cellId = "cell-id";
        const dataProvider = new DataProvider();
        spyOn(dataProvider.geometry, "latLonToCellId")
            .and.returnValue(cellId);
        spyOn(dataProvider.geometry, "latLonToCellIds")
            .and.returnValue([cellId]);
        const api = new APIWrapper(dataProvider);
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const fullNode = helper.createFullNode();
        const otherFullNode = helper.createFullNode();
        otherFullNode.id = "other-key";
        otherFullNode.sequence.id = "otherSequenceKey";

        const getSpatialImages = new Subject<SpatialImagesContract>();
        spyOn(api, "getSpatialImages$").and.returnValue(getSpatialImages);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const graph = new Graph(
            api,
            undefined,
            graphCalculator,
            edgeCalculator);

        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);
        getImages.complete();

        graph.cacheNodeSequence$(fullNode.id).subscribe(() => { /*noop*/ });

        const result: SequencesContract = [{
            node: {
                id: fullNode.sequence.id,
                image_ids: ["prev", fullNode.id, "next"],
            },
            node_id: fullNode.sequence.id,
        }];
        getSequences.next(result);
        getSequences.complete();

        const node = graph.getNode(fullNode.id);
        expect(node).toBeDefined();
        expect(graph.hasNode(fullNode.id)).toBe(true);

        expect(graph.hasTiles(fullNode.id)).toBe(false);
        expect(graph.isCachingTiles(fullNode.id)).toBe(false);

        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const coreResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        coreResult[cellId] = {};
        coreResult[cellId]["0"] = fullNode;
        coreResult[cellId]["1"] = otherFullNode;
        imagesByH.next(coreResult);

        expect(graph.hasTiles(fullNode.id)).toBe(true);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: -0.5, lon: -0.5 }, { lat: 0.5, lon: 0.5 }]);

        graph.cacheFill$(otherFullNode.id).subscribe(() => { /*noop*/ });

        const otherSpatialImages: SpatialImagesContract = [{
            node: otherFullNode,
            node_id: otherFullNode.id,
        }];
        getSpatialImages.next(otherSpatialImages);
        getSpatialImages.complete();

        expect(graph.hasSpatialArea(fullNode.id)).toBe(true);

        const getPotentialSpy = spyOn(edgeCalculator, "getPotentialEdges");
        getPotentialSpy.and.returnValue([]);

        spyOn(edgeCalculator, "computeStepEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeTurnEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSphericalEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePerspectiveToSphericalEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSimilarEdges").and.returnValue([]);

        graph.setFilter(["==", "sequenceId", "otherSequenceKey"]);

        graph.initializeCache(fullNode.id);
        graph.cacheSpatialEdges(fullNode.id);

        expect(getPotentialSpy.calls.first().args.length).toBe(3);
        expect(getPotentialSpy.calls.first().args[1].length).toBe(1);
        expect(getPotentialSpy.calls.first().args[1][0].sequenceId).toBe("otherSequenceKey");
    });

    it("should apply remove by filtering", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const fullNode = helper.createFullNode();

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);
        getImages.complete();

        graph.cacheNodeSequence$(fullNode.id).subscribe(() => { /*noop*/ });

        const result: SequencesContract = [{
            node: {
                id: fullNode.sequence.id,
                image_ids: ["prev", fullNode.id, "next"],
            },
            node_id: fullNode.sequence.id,
        }];
        getSequences.next(result);
        getSequences.complete();

        const node = graph.getNode(fullNode.id);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        const otherFullNode = helper.createFullNode();
        otherFullNode.sequence.id = "otherSequenceKey";
        const otherNode = new Node(otherFullNode);
        otherNode.makeFull(otherFullNode);

        expect(graph.hasSpatialArea(fullNode.id)).toBe(true);

        const getPotentialSpy = spyOn(edgeCalculator, "getPotentialEdges");
        getPotentialSpy.and.returnValue([]);

        spyOn(edgeCalculator, "computeStepEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeTurnEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSphericalEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePerspectiveToSphericalEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSimilarEdges").and.returnValue([]);

        graph.setFilter(["==", "sequenceId", "none"]);

        graph.initializeCache(fullNode.id);
        graph.cacheSpatialEdges(fullNode.id);

        expect(getPotentialSpy.calls.first().args.length).toBe(3);
        expect(getPotentialSpy.calls.first().args[1].length).toBe(0);
    });
});

describe("Graph.cacheNodeSequence$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should not be cached", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();

        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);

        expect(graph.hasNodeSequence(fullNode.id)).toBe(false);
    });

    it("should be caching", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();

        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);
        getImages.complete();

        graph.cacheNodeSequence$(fullNode.id);

        expect(graph.hasNodeSequence(fullNode.id)).toBe(false);
        expect(graph.isCachingNodeSequence(fullNode.id)).toBe(true);
    });

    it("should be cached", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        fullNode.sequence.id = "sequenceId";

        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);

        graph.cacheNodeSequence$(fullNode.id)
            .subscribe(
                (g: Graph): void => {
                    expect(g.hasNodeSequence(fullNode.id)).toBe(true);
                    expect(g.isCachingNodeSequence(fullNode.id)).toBe(false);
                });

        const result: SequencesContract = [{
            node: {
                id: fullNode.sequence.id,
                image_ids: [fullNode.id],
            },
            node_id: fullNode.sequence.id,
        }];
        getSequences.next(result);
        getSequences.complete();

        expect(graph.hasNodeSequence(fullNode.id)).toBe(true);
        expect(graph.isCachingNodeSequence(fullNode.id)).toBe(false);
    });

    it("should throw if node not in graph", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        fullNode.sequence.id = "sequenceId";

        expect(() => { graph.cacheNodeSequence$(fullNode.id); }).toThrowError(Error);
    });

    it("should throw if already cached", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        fullNode.sequence.id = "sequenceId";

        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);

        graph.cacheNodeSequence$(fullNode.id).subscribe(() => { /*noop*/ });

        const result: SequencesContract = [{
            node: {
                id: fullNode.sequence.id,
                image_ids: [fullNode.id],
            },
            node_id: fullNode.sequence.id,
        }];
        getSequences.next(result);
        getSequences.complete();

        expect(graph.hasNodeSequence(fullNode.id)).toBe(true);

        expect(() => { graph.cacheNodeSequence$(fullNode.id); }).toThrowError(Error);
    });

    it("should call api only once when caching the same sequence twice in succession", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const getSequences = new Subject<SequencesContract>();
        const sequenceByKeySpy = spyOn(api, "getSequences$");
        sequenceByKeySpy.and.returnValue(getSequences);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        fullNode.sequence.id = "sequenceId";

        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);

        graph.cacheNodeSequence$(fullNode.id).subscribe(() => { /*noop*/ });
        graph.cacheNodeSequence$(fullNode.id).subscribe(() => { /*noop*/ });

        expect(sequenceByKeySpy.calls.count()).toBe(1);
    });

    it("should emit to changed stream", (done: Function) => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        fullNode.sequence.id = "sequenceId";

        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);

        graph.cacheNodeSequence$(fullNode.id).subscribe(() => { /*noop*/ });

        graph.changed$.pipe(
            first())
            .subscribe(
                (g: Graph): void => {
                    expect(g.hasNodeSequence(fullNode.id)).toBe(true);
                    expect(g.isCachingNodeSequence(fullNode.id)).toBe(false);

                    done();
                });

        const result: SequencesContract = [{
            node: {
                id: fullNode.sequence.id,
                image_ids: [fullNode.id],
            },
            node_id: fullNode.sequence.id,
        }];
        getSequences.next(result);
        getSequences.complete();
    });
});

describe("Graph.cacheSequence$", () => {
    it("should not be cached", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const graph = new Graph(api, undefined, calculator);

        const sequenceId = "sequenceId";

        expect(graph.hasSequence(sequenceId)).toBe(false);
    });

    it("should not be caching", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const graph = new Graph(api, undefined, calculator);

        const sequenceId = "sequenceId";

        expect(graph.isCachingSequence(sequenceId)).toBe(false);
    });

    it("should be caching", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const graph = new Graph(api, undefined, calculator);

        const sequenceId = "sequenceId";

        graph.cacheSequence$(sequenceId).subscribe(() => { /*noop*/ });

        expect(graph.hasSequence(sequenceId)).toBe(false);
        expect(graph.isCachingSequence(sequenceId)).toBe(true);
    });

    it("should cache", (done: Function) => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const graph = new Graph(api, undefined, calculator);

        const sequenceId = "sequenceId";
        const id = "id";

        graph.cacheSequence$(sequenceId)
            .subscribe(
                (g: Graph): void => {
                    expect(g.hasSequence(sequenceId)).toBe(true);
                    expect(g.isCachingSequence(sequenceId)).toBe(false);
                    expect(g.getSequence(sequenceId)).toBeDefined();
                    expect(g.getSequence(sequenceId).id).toBe(sequenceId);
                    expect(g.getSequence(sequenceId).imageIds.length).toBe(1);
                    expect(g.getSequence(sequenceId).imageIds[0]).toBe(id);

                    done();
                });

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [id] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();
    });

    it("should call api only once when caching the same sequence twice in succession", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getSequences = new Subject<SequencesContract>();
        const sequenceByKeySpy = spyOn(api, "getSequences$");
        sequenceByKeySpy.and.returnValue(getSequences);

        const graph = new Graph(api, undefined, calculator);

        const sequenceId = "sequenceId";

        graph.cacheSequence$(sequenceId).subscribe(() => { /*noop*/ });
        graph.cacheSequence$(sequenceId).subscribe(() => { /*noop*/ });

        expect(sequenceByKeySpy.calls.count()).toBe(1);
    });
});

describe("Graph.resetSpatialEdges", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should use fallback keys", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const fullNode = helper.createFullNode();

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);
        getImages.complete();

        graph.cacheNodeSequence$(fullNode.id).subscribe(() => { /*noop*/ });

        const result: SequencesContract = [{
            node: {
                id: fullNode.sequence.id,
                image_ids: ["prev", fullNode.id, "next"]
            },
            node_id: fullNode.sequence.id,
        }];
        getSequences.next(result);
        getSequences.complete();

        const node = graph.getNode(fullNode.id);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        expect(graph.hasSpatialArea(fullNode.id)).toBe(true);

        const getPotentialSpy = spyOn(edgeCalculator, "getPotentialEdges");
        getPotentialSpy.and.returnValue([]);

        spyOn(edgeCalculator, "computeStepEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeTurnEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSphericalEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePerspectiveToSphericalEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSimilarEdges").and.returnValue([]);

        graph.initializeCache(fullNode.id);
        graph.cacheSpatialEdges(fullNode.id);

        const nodeSequenceResetSpy = spyOn(node, "resetSequenceEdges").and.stub();
        const nodeSpatialResetSpy = spyOn(node, "resetSpatialEdges").and.stub();

        graph.resetSpatialEdges();

        expect(nodeSequenceResetSpy.calls.count()).toBe(0);
        expect(nodeSpatialResetSpy.calls.count()).toBe(1);

        expect(graph.hasSpatialArea(fullNode.id)).toBe(true);
    });

    it("should have to re-encode hs after spatial edges reset", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const graphCalculator = new GraphCalculator(null);
        const edgeCalculator = new EdgeCalculator();

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        const encodeHsSpy = spyOn(geometryProvider, "latLonToCellIds");
        encodeHsSpy.and.returnValue([h]);

        const fullNode = helper.createFullNode();

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const graph = new Graph(api, undefined, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fetchResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fetchResult);
        getImages.complete();

        graph.cacheNodeSequence$(fullNode.id).subscribe(() => { /*noop*/ });

        const result: SequencesContract = [{
            node: {
                id: fullNode.sequence.id,
                image_ids: ["prev", fullNode.id, "next"]
            },
            node_id: fullNode.sequence.id,
        }];
        getSequences.next(result);
        getSequences.complete();

        expect(graph.hasTiles(fullNode.id)).toBe(false);
        expect(graph.isCachingTiles(fullNode.id)).toBe(false);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHresult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        imagesByHresult[h] = {};
        imagesByHresult[h]["0"] = fullNode;
        imagesByH.next(imagesByHresult);

        expect(graph.hasTiles(fullNode.id)).toBe(true);
        expect(graph.isCachingTiles(fullNode.id)).toBe(false);

        const node = graph.getNode(fullNode.id);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        expect(graph.hasSpatialArea(fullNode.id)).toBe(true);

        const getPotentialSpy = spyOn(edgeCalculator, "getPotentialEdges");
        getPotentialSpy.and.returnValue([]);

        spyOn(edgeCalculator, "computeStepEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeTurnEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSphericalEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePerspectiveToSphericalEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSimilarEdges").and.returnValue([]);

        graph.initializeCache(fullNode.id);
        graph.cacheSpatialEdges(fullNode.id);

        const nodeSequenceResetSpy = spyOn(node, "resetSequenceEdges").and.stub();
        const nodeSpatialResetSpy = spyOn(node, "resetSpatialEdges").and.stub();

        graph.resetSpatialEdges();

        expect(nodeSequenceResetSpy.calls.count()).toBe(0);
        expect(nodeSpatialResetSpy.calls.count()).toBe(1);

        const countBefore: number = encodeHsSpy.calls.count();
        expect(graph.hasTiles(fullNode.id)).toBe(true);
        const countAfter: number = encodeHsSpy.calls.count();

        expect(countAfter - countBefore).toBe(1);

    });
});

describe("Graph.reset", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should remove node", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        const node = graph.getNode(fullNode.id);

        const nodeDisposeSpy = spyOn(node, "dispose");
        nodeDisposeSpy.and.stub();

        graph.reset([]);

        expect(nodeDisposeSpy.calls.count()).toBe(0);
        expect(graph.hasNode(node.id)).toBe(false);
    });

    it("should dispose cache initialized node", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        const node = graph.getNode(fullNode.id);
        graph.initializeCache(node.id);

        const nodeDisposeSpy = spyOn(node, "dispose");
        nodeDisposeSpy.and.stub();

        graph.reset([]);

        expect(nodeDisposeSpy.calls.count()).toBe(1);
        expect(graph.hasNode(node.id)).toBe(false);
    });

    it("should keep supplied node", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const graph = new Graph(api, undefined, calculator);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        const node = graph.getNode(fullNode.id);
        graph.initializeCache(node.id);

        const nodeDisposeSpy = spyOn(node, "dispose");
        nodeDisposeSpy.and.stub();
        const nodeResetSequenceSpy = spyOn(node, "resetSequenceEdges");
        nodeResetSequenceSpy.and.stub();
        const nodeResetSpatialSpy = spyOn(node, "resetSpatialEdges");
        nodeResetSpatialSpy.and.stub();

        graph.reset([node.id]);

        expect(nodeDisposeSpy.calls.count()).toBe(0);
        expect(nodeResetSequenceSpy.calls.count()).toBe(1);
        expect(nodeResetSpatialSpy.calls.count()).toBe(1);
        expect(graph.hasNode(node.id)).toBe(true);
    });
});

describe("Graph.uncache", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should remove prestored node if not cache initialized", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        const node = graph.getNode(fullNode.id);
        const nodeUncacheSpy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.id)).toBe(false);
    });

    it("should not remove prestored node if in kept sequence", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode = helper.createFullNode();
        fullNode.sequence.id = "sequencKey";
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        const node = graph.getNode(fullNode.id);
        const nodeUncacheSpy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy = spyOn(node, "dispose").and.stub();

        graph.uncache([], fullNode.sequence.id);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.id)).toBe(true);
    });

    it("should remove prestored node if cache initialized", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        graph.initializeCache(fullNode.id);

        const node = graph.getNode(fullNode.id);
        const nodeDisposeSpy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.id)).toBe(false);
    });

    it("should not remove prestored node when in keys to keep", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        graph.initializeCache(fullNode.id);

        const node = graph.getNode(fullNode.id);
        const nodeUncacheSpy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy = spyOn(node, "dispose").and.stub();

        graph.uncache([fullNode.id]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.id)).toBe(true);
    });

    it("should not remove prestored node if below threshold", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 1,
            maxUnusedTiles: 0,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        graph.initializeCache(fullNode.id);

        const node = graph.getNode(fullNode.id);
        const nodeUncacheSpy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.id)).toBe(true);
    });

    it("should remove prestored node accessed earliest", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const getImagesSpy = spyOn(api, "getImages$");

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 1,
            maxUnusedTiles: 0,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode1 = helper.createFullNode();
        fullNode1.id = "key1";
        const result1: ImagesContract = [{
            node: fullNode1,
            node_id: fullNode1.id,
        }];

        const getImages1 = new Subject<ImagesContract>();
        getImagesSpy.and.returnValue(getImages1);

        graph.cacheFull$(fullNode1.id).subscribe(() => { /*noop*/ });

        getImages1.next(result1);
        getImages1.complete();

        expect(graph.hasNode(fullNode1.id)).toBe(true);

        const fullNode2 = helper.createFullNode();
        fullNode2.id = "key2";
        const result2: ImagesContract = [{
            node: fullNode2,
            node_id: fullNode2.id,
        }];
        const getImages2 = new Subject<ImagesContract>();
        getImagesSpy.and.returnValue(getImages2);

        graph.cacheFull$(fullNode2.id).subscribe(() => { /*noop*/ });

        getImages2.next(result2);
        getImages2.complete();

        const node1 = graph.getNode(fullNode1.id);
        graph.initializeCache(node1.id);

        expect(graph.hasInitializedCache(node1.id)).toBe(true);

        const node2 = graph.getNode(fullNode2.id);
        graph.initializeCache(node2.id);

        expect(graph.hasInitializedCache(node2.id)).toBe(true);

        const nodeDisposeSpy1 = spyOn(node1, "dispose").and.stub();
        const nodeDisposeSpy2 = spyOn(node2, "dispose").and.stub();

        const time = new Date().getTime();
        while (new Date().getTime() === time) {
            graph.hasNode(node2.id);
        }

        graph.hasNode(node2.id);

        graph.uncache([]);

        expect(nodeDisposeSpy1.calls.count()).toBe(1);
        expect(nodeDisposeSpy2.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode1.id)).toBe(false);
        expect(graph.hasNode(fullNode2.id)).toBe(true);

    });

    it("should uncache cache initialized node", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        graph.initializeCache(fullNode.id);

        expect(graph.hasInitializedCache(fullNode.id)).toBe(true);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        const node = graph.getNode(fullNode.id);
        const nodeUncacheSpy = spyOn(node, "uncache").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.id)).toBe(true);
        expect(graph.hasInitializedCache(fullNode.id)).toBe(false);
    });

    it("should not uncache cache initialized node if below threshold", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        graph.initializeCache(fullNode.id);

        expect(graph.hasInitializedCache(fullNode.id)).toBe(true);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        const node = graph.getNode(fullNode.id);
        const nodeUncacheSpy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.id)).toBe(true);
        expect(graph.hasInitializedCache(fullNode.id)).toBe(true);
    });

    it("should not uncache cache initialized node if key should be kept", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        const node = graph.getNode(fullNode.id);
        graph.initializeCache(node.id);

        expect(graph.hasInitializedCache(node.id)).toBe(true);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        const nodeUncacheSpy = spyOn(node, "uncache");
        nodeUncacheSpy.and.stub();

        graph.uncache([node.id]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);

        expect(graph.hasNode(node.id)).toBe(true);
        expect(graph.hasInitializedCache(node.id)).toBe(true);
    });

    it("should not uncache cache initialized node if key in use", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        const node = graph.getNode(fullNode.id);
        graph.initializeCache(node.id);

        expect(graph.hasInitializedCache(node.id)).toBe(true);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        graph.hasTiles(node.id);
        observableFrom(graph.cacheTiles$(node.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const nodeUncacheSpy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(node.id)).toBe(true);
        expect(graph.hasInitializedCache(node.id)).toBe(true);
    });

    it("should uncache cache initialized node accessed earliest", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const getImagesSpy = spyOn(api, "getImages$");

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode1 = helper.createFullNode();
        fullNode1.id = "key1";
        const result1: ImagesContract = [{
            node: fullNode1,
            node_id: fullNode1.id,
        }];

        const getImages1 = new Subject<ImagesContract>();
        getImagesSpy.and.returnValue(getImages1);

        graph.cacheFull$(fullNode1.id).subscribe(() => { /*noop*/ });

        getImages1.next(result1);
        getImages1.complete();

        expect(graph.hasNode(fullNode1.id)).toBe(true);

        const fullNode2 = helper.createFullNode();
        fullNode2.id = "key2";
        const result2: ImagesContract = [{
            node: fullNode2,
            node_id: fullNode2.id,
        }];

        const getImages2 = new Subject<ImagesContract>();
        getImagesSpy.and.returnValue(getImages2);

        graph.cacheFull$(fullNode2.id).subscribe(() => { /*noop*/ });

        getImages2.next(result2);
        getImages2.complete();

        expect(graph.hasNode(fullNode2.id)).toBe(true);

        const node1 = graph.getNode(fullNode1.id);
        graph.initializeCache(node1.id);

        expect(graph.hasInitializedCache(node1.id)).toBe(true);

        const node2 = graph.getNode(fullNode2.id);
        graph.initializeCache(node2.id);

        expect(graph.hasInitializedCache(node2.id)).toBe(true);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode1.id);
        observableFrom(graph.cacheTiles$(fullNode1.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode1;
        imagesByHResult[h]["1"] = fullNode2;
        imagesByH.next(imagesByHResult);

        const nodeUncacheSpy1 = spyOn(node1, "uncache").and.stub();
        const nodeUncacheSpy2 = spyOn(node2, "uncache").and.stub();

        const time = new Date().getTime();
        while (new Date().getTime() === time) {
            graph.hasNode(node2.id);
        }

        graph.hasNode(node2.id);

        graph.uncache([]);

        expect(nodeUncacheSpy1.calls.count()).toBe(1);
        expect(graph.hasNode(node1.id)).toBe(true);
        expect(graph.hasInitializedCache(node1.id)).toBe(false);

        expect(nodeUncacheSpy2.calls.count()).toBe(0);
        expect(graph.hasNode(node2.id)).toBe(true);
        expect(graph.hasInitializedCache(node2.id)).toBe(true);
    });

    it("should uncache sequence", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const sequenceId = "sequenceId";

        graph.cacheSequence$(sequenceId).subscribe(() => { /*noop*/ });

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        expect(graph.hasSequence(sequenceId)).toBe(true);

        const sequence = graph.getSequence(sequenceId);

        const sequenceDisposeSpy = spyOn(sequence, "dispose");
        sequenceDisposeSpy.and.stub();

        graph.uncache([]);

        expect(sequenceDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasSequence(sequence.id)).toBe(false);
    });

    it("should not uncache sequence if specified to keep", () => {
        const api = new APIWrapper(new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const sequenceId = "sequenceId";

        graph.cacheSequence$(sequenceId).subscribe(() => { /*noop*/ });

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        expect(graph.hasSequence(sequenceId)).toBe(true);

        const sequence = graph.getSequence(sequenceId);

        const sequenceDisposeSpy = spyOn(sequence, "dispose");
        sequenceDisposeSpy.and.stub();

        graph.uncache([], sequenceId);

        expect(sequenceDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasSequence(sequence.id)).toBe(true);
    });

    it("should not uncache sequence if number below threshold", () => {
        const api = new APIWrapper(
            new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);

        const getSequences = new Subject<SequencesContract>();
        spyOn(api, "getSequences$").and.returnValue(getSequences);

        const configuration: GraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const sequenceId = "sequenceId";

        graph.cacheSequence$(sequenceId).subscribe(() => { /*noop*/ });

        const result: SequencesContract = [{
            node: { id: sequenceId, image_ids: [] },
            node_id: sequenceId,
        }];
        getSequences.next(result);
        getSequences.complete();

        expect(graph.hasSequence(sequenceId)).toBe(true);

        const sequence = graph.getSequence(sequenceId);

        const sequenceDisposeSpy = spyOn(sequence, "dispose");
        sequenceDisposeSpy.and.stub();

        graph.uncache([]);

        expect(sequenceDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasSequence(sequence.id)).toBe(true);
    });

    it("should not uncache sequence accessed last", () => {
        const api = new APIWrapper(
            new FalcorDataProvider({ clientToken: "cid" }));
        const calculator = new GraphCalculator(null);
        const getSequencesSpy = spyOn(api, "getSequences$");
        const configuration: GraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };
        const graph = new Graph(
            api,
            undefined,
            calculator,
            undefined,
            undefined,
            configuration);

        const sequenceId1 = "sequenceId1";
        const sequences1 = new Subject<SequencesContract>();
        getSequencesSpy.and.returnValue(sequences1);

        graph.cacheSequence$(sequenceId1).subscribe(() => { /*noop*/ });

        const result1: SequencesContract = [{
            node_id: sequenceId1,
            node: { id: sequenceId1, image_ids: [] },
        }];
        sequences1.next(result1);
        sequences1.complete();

        expect(graph.hasSequence(sequenceId1)).toBe(true);

        const sequence1 = graph.getSequence(sequenceId1);
        const sequenceDisposeSpy1 = spyOn(sequence1, "dispose").and.stub();

        const sequenceId2 = "sequenceId2";
        const getSequences2 = new Subject<SequencesContract>();
        getSequencesSpy.and.returnValue(getSequences2);

        graph.cacheSequence$(sequenceId2).subscribe(() => { /*noop*/ });

        const result2: SequencesContract = [{
            node_id: sequenceId2,
            node: { id: sequenceId2, image_ids: [] },
        }];
        getSequences2.next(result2);
        getSequences2.complete();

        expect(graph.hasSequence(sequenceId2)).toBe(true);
        const sequence2 = graph.getSequence(sequenceId2);
        const sequenceDisposeSpy2 = spyOn(sequence2, "dispose").and.stub();

        const time = new Date().getTime();
        while (new Date().getTime() === time) {
            graph.hasSequence(sequenceId2);
        }

        graph.getSequence(sequenceId2);
        graph.uncache([]);

        expect(sequenceDisposeSpy1.calls.count()).toBe(1);
        expect(graph.hasSequence(sequence1.id)).toBe(false);

        expect(sequenceDisposeSpy2.calls.count()).toBe(0);
        expect(graph.hasSequence(sequence2.id)).toBe(true);
    });

    it("should uncache node by uncaching tile", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.id)).toBe(true);

        const node = graph.getNode(fullNode.id);

        const nodeDisposeSpy = spyOn(node, "dispose");
        nodeDisposeSpy.and.stub();

        graph.uncache([]);

        expect(nodeDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.id)).toBe(false);
    });

    it("should not dispose node by uncaching tile if in specified sequence", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode = helper.createFullNode();
        fullNode.sequence.id = "sequenceId";
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.id)).toBe(true);

        const node = graph.getNode(fullNode.id);

        const nodeDisposeSpy = spyOn(node, "dispose").and.stub();
        const nodeUncacheSpy = spyOn(node, "uncache").and.stub();

        graph.uncache([], fullNode.sequence.id);

        expect(nodeDisposeSpy.calls.count()).toBe(0);
        expect(nodeUncacheSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.id)).toBe(true);
    });

    it("should not uncache node by uncaching tile when number below threshold", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.id)).toBe(true);

        const node = graph.getNode(fullNode.id);
        const nodeUncacheSpy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.id)).toBe(true);
        expect(graph.hasTiles(fullNode.id)).toBe(true);
    });

    it("should not uncache and dispose node by uncaching tile when tile is related to kept key", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const h = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const getImages = new Subject<ImagesContract>();
        spyOn(api, "getImages$").and.returnValue(getImages);

        const configuration: GraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph = new Graph(api, undefined, calculator, undefined, undefined, configuration);

        const fullNode = helper.createFullNode();
        const result: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        getImages.next(result);
        getImages.complete();

        expect(graph.hasNode(fullNode.id)).toBe(true);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.id)).toBe(true);

        const node = graph.getNode(fullNode.id);
        const nodeUncacheSpy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy = spyOn(node, "dispose").and.stub();

        graph.uncache([node.id]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.id)).toBe(true);
        expect(graph.hasTiles(fullNode.id)).toBe(true);
    });
});

describe("Graph.cacheCell$", () => {
    it("should cache one node in the cell", (done: Function) => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "token" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const cellId = "cellId";
        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        const imagesByHSpy =
            spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const getSpatialImages = new Subject<SpatialImagesContract>();
        const getSpatialImagesSpy =
            spyOn(api, "getSpatialImages$").and.returnValue(getSpatialImages);

        const id = "full-id";
        const fullNode = new NodeHelper().createFullNode();
        fullNode.id = id;

        const graph = new Graph(api, undefined, calculator);

        graph.cacheCell$(cellId)
            .subscribe(
                (nodes: Node[]): void => {
                    expect(nodes.length).toBe(1);
                    expect(nodes[0].id).toBe(id);
                    expect(nodes[0].full).toBe(true);

                    expect(graph.hasNode(id)).toBe(true);

                    expect(imagesByHSpy.calls.count()).toBe(1);
                    expect(getSpatialImagesSpy.calls.count()).toBe(1);

                    done();
                });

        const tileResult: { [key: string]: { [index: string]: CoreImageEnt } } =
            {};
        tileResult[cellId] = {};
        tileResult[cellId]["0"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        const spatialImages: SpatialImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getSpatialImages.next(spatialImages);
        getSpatialImages.complete();
    });

    it("should not cache again if all cell nodes cached", (done: Function) => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "token" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const cellId = "cell-id";
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([cellId]);
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(cellId);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        const imagesByHSpy =
            spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const getImages = new Subject<ImagesContract>();
        const getImagesSpy =
            spyOn(api, "getImages$").and.returnValue(getImages);

        const getSpatialImagesSpy =
            spyOn(api, "getSpatialImages$").and.stub();

        const id = "full-id";
        const fullNode: ImageEnt = new NodeHelper().createFullNode();
        fullNode.id = id;

        const graph = new Graph(api, undefined, calculator);

        graph.cacheFull$(fullNode.id).subscribe(() => { /*noop*/ });

        const fullResult: ImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getImages.next(fullResult);
        getImages.complete();

        graph.hasTiles(fullNode.id);
        observableFrom(graph.cacheTiles$(fullNode.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const tileResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        tileResult[cellId] = {};
        tileResult[cellId]["0"] = fullNode;
        imagesByH.next(tileResult);

        expect(graph.hasNode(fullNode.id)).toBe(true);
        expect(graph.hasTiles(fullNode.id)).toBe(true);

        expect(imagesByHSpy.calls.count()).toBe(1);
        expect(getImagesSpy.calls.count()).toBe(1);

        graph.cacheCell$(cellId)
            .subscribe(
                (nodes: Node[]): void => {
                    expect(nodes.length).toBe(1);
                    expect(nodes[0].id).toBe(id);
                    expect(nodes[0].full).toBe(true);

                    expect(graph.hasNode(id)).toBe(true);

                    expect(imagesByHSpy.calls.count()).toBe(1);
                    expect(getImagesSpy.calls.count()).toBe(1);
                    expect(getSpatialImagesSpy.calls.count()).toBe(0);

                    done();
                });
    });

    it("should cache core cell node", (done: Function) => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "token" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const cellId = "cell-id";
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([cellId]);
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(cellId);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        const imagesByHSpy =
            spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const getImages = new Subject<ImagesContract>();
        const getImagesSpy =
            spyOn(api, "getImages$").and.returnValue(getImages);

        const getSpatialImages = new Subject<SpatialImagesContract>();
        const getSpatialImagesSpy =
            spyOn(api, "getSpatialImages$").and.returnValue(getSpatialImages);

        const key1 = "full-key-1";
        const key2 = "full-key-2";
        const fullNode1 = new NodeHelper().createFullNode();
        fullNode1.id = key1;

        const graph = new Graph(api, undefined, calculator);

        graph.cacheFull$(fullNode1.id).subscribe(() => { /*noop*/ });

        const fullResult: ImagesContract = [{
            node: fullNode1,
            node_id: fullNode1.id,
        }];
        getImages.next(fullResult);
        getImages.complete();

        graph.hasTiles(fullNode1.id);
        observableFrom(graph.cacheTiles$(fullNode1.id)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const fullNode2 = new NodeHelper().createFullNode();
        fullNode2.id = key2;
        const tileResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        tileResult[cellId] = {};
        tileResult[cellId]["0"] = fullNode1;
        tileResult[cellId]["1"] = fullNode2;
        imagesByH.next(tileResult);

        expect(graph.hasNode(fullNode1.id)).toBe(true);
        expect(graph.hasNode(fullNode2.id)).toBe(true);
        expect(graph.hasTiles(fullNode1.id)).toBe(true);
        expect(graph.hasTiles(fullNode2.id)).toBe(true);


        expect(graph.getNode(fullNode1.id).full).toBe(true);
        expect(graph.getNode(fullNode2.id).full).toBe(false);

        expect(imagesByHSpy.calls.count()).toBe(1);
        expect(getImagesSpy.calls.count()).toBe(1);

        graph.cacheCell$(cellId)
            .subscribe(
                (nodes: Node[]): void => {
                    expect(nodes.length).toBe(2);
                    expect([key1, key2].includes(nodes[0].id)).toBe(true);
                    expect([key1, key2].includes(nodes[1].id)).toBe(true);
                    expect(nodes[0].full).toBe(true);
                    expect(nodes[1].full).toBe(true);

                    expect(graph.hasNode(key1)).toBe(true);
                    expect(graph.hasNode(key2)).toBe(true);

                    expect(imagesByHSpy.calls.count()).toBe(1);
                    expect(getImagesSpy.calls.count()).toBe(1);
                    expect(getSpatialImagesSpy.calls.count()).toBe(1);

                    done();
                });

        const spatialImages: SpatialImagesContract = [{
            node: fullNode2,
            node_id: fullNode2.id,
        }];
        getSpatialImages.next(spatialImages);
        getSpatialImages.complete();
    });

    it("should cache cache tile once for the same cell", (done: Function) => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "token" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const cellId = "cell-id";
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([cellId]);
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(cellId);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        const imagesByHSpy =
            spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const getSpatialImages = new Subject<SpatialImagesContract>();
        const getSpatialImagesSpy =
            spyOn(api, "getSpatialImages$").and.returnValue(getSpatialImages);

        const id = "full-id";
        const fullNode = new NodeHelper().createFullNode();
        fullNode.id = id;

        const graph = new Graph(api, undefined, calculator);

        let count: number = 0;
        observableMerge(
            graph.cacheCell$(cellId),
            graph.cacheCell$(cellId))
            .subscribe(
                (nodes: Node[]): void => {
                    count++;

                    expect(nodes.length).toBe(1);
                    expect(nodes[0].id).toBe(fullNode.id);
                    expect(nodes[0].full).toBe(true);

                    expect(graph.hasNode(id)).toBe(true);
                    expect(graph.hasTiles(fullNode.id)).toBe(true);
                    expect(graph.getNode(fullNode.id).full).toBe(true);
                },
                undefined,
                (): void => {
                    expect(count).toBe(2);
                    expect(imagesByHSpy.calls.count()).toBe(1);
                    expect(getSpatialImagesSpy.calls.count()).toBe(2);

                    done();
                });

        const tileResult: { [key: string]: { [index: string]: CoreImageEnt } } = {};
        tileResult[cellId] = {};
        tileResult[cellId]["0"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        const spatialImages: SpatialImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getSpatialImages.next(spatialImages);
        getSpatialImages.complete();
    });
});

describe("Graph.updateCells$", () => {
    it("should not update non-existing cell", (done: Function) => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "token" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const imagesByHSpy = spyOn(api, "getCoreImages$").and.stub();

        const graph = new Graph(api, undefined, calculator);

        const cellId = "cellId";
        let count = 0;
        graph.updateCells$([cellId])
            .subscribe(
                (): void => { count++; },
                undefined,
                (): void => {
                    expect(count).toBe(0);
                    expect(imagesByHSpy.calls.count()).toBe(0);
                    done();
                });
    });

    it("should update existing cell", (done: Function) => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "token" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        const imagesByHSpy =
            spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const getSpatialImages = new Subject<SpatialImagesContract>();
        spyOn(api, "getSpatialImages$").and.returnValue(getSpatialImages);

        const id = "full-id";
        const fullNode = new NodeHelper().createFullNode();
        fullNode.id = id;

        const graph = new Graph(api, undefined, calculator);

        const cellId = "cellId";
        graph.cacheCell$(cellId).subscribe();

        const tileResult: { [key: string]: { [index: string]: CoreImageEnt } } =
            {};
        tileResult[cellId] = {};
        tileResult[cellId]["0"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        const spatialImages: SpatialImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getSpatialImages.next(spatialImages);
        getSpatialImages.complete();

        expect(graph.hasNode(id)).toBe(true);

        const imagesByHUpdate =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        imagesByHSpy.calls.reset();
        imagesByHSpy.and.returnValue(imagesByHUpdate);

        graph.updateCells$([cellId])
            .subscribe(
                (cid: string): void => {
                    expect(cid).toBe(cellId);
                    expect(imagesByHSpy.calls.count()).toBe(1);
                    done();
                });

        imagesByHUpdate.next(tileResult);
        imagesByHUpdate.complete();
    });

    it("should update currently caching cell", (done: Function) => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "token" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        const imagesByHSpy =
            spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const getSpatialImages = new Subject<SpatialImagesContract>();
        spyOn(api, "getSpatialImages$").and.returnValue(getSpatialImages);

        const id = "full-id";
        const fullNode = new NodeHelper().createFullNode();
        fullNode.id = id;

        const graph = new Graph(api, undefined, calculator);

        const cellId = "cellId";
        graph.cacheCell$(cellId).subscribe();

        expect(graph.hasNode(id)).toBe(false);

        const imagesByHUpdate =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        imagesByHSpy.calls.reset();
        imagesByHSpy.and.returnValue(imagesByHUpdate);

        graph.updateCells$([cellId])
            .subscribe(
                (cid: string): void => {
                    expect(cid).toBe(cellId);
                    expect(imagesByHSpy.calls.count()).toBe(1);
                    done();
                });

        const tileResult: { [key: string]: { [index: string]: CoreImageEnt } } =
            {};
        tileResult[cellId] = {};
        tileResult[cellId]["0"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        const spatialImages: SpatialImagesContract = [{
            node: fullNode,
            node_id: fullNode.id,
        }];
        getSpatialImages.next(spatialImages);
        getSpatialImages.complete();

        expect(graph.hasNode(id)).toBe(true);

        imagesByHUpdate.next(tileResult);
        imagesByHUpdate.complete();
    });

    it("should add new nodes to existing cell", (done: Function) => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "token" },
            geometryProvider);
        const api = new APIWrapper(dataProvider);
        const calculator = new GraphCalculator(null);

        const imagesByH =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        const imagesByHSpy =
            spyOn(api, "getCoreImages$").and.returnValue(imagesByH);

        const getSpatialImages = new Subject<SpatialImagesContract>();
        spyOn(api, "getSpatialImages$").and.returnValue(getSpatialImages);

        const key1 = "full-key-1";
        const fullNode1 = new NodeHelper().createFullNode();
        fullNode1.id = key1;

        const graph = new Graph(api, undefined, calculator);

        const cellId = "cellId";
        graph.cacheCell$(cellId).subscribe();

        const tileResult: { [key: string]: { [index: string]: CoreImageEnt } } =
            {};
        tileResult[cellId] = {};
        tileResult[cellId]["0"] = fullNode1;
        imagesByH.next(tileResult);
        imagesByH.complete();

        const spatialImages: SpatialImagesContract = [{
            node: fullNode1,
            node_id: fullNode1.id,
        }];
        getSpatialImages.next(spatialImages);
        getSpatialImages.complete();

        expect(graph.hasNode(key1)).toBe(true);

        const imagesByHUpdate =
            new Subject<{ [key: string]: { [index: string]: CoreImageEnt } }>();
        imagesByHSpy.calls.reset();
        imagesByHSpy.and.returnValue(imagesByHUpdate);

        graph.updateCells$([cellId])
            .subscribe(
                (id: string): void => {
                    expect(id).toBe(cellId);

                    expect(graph.hasNode(key1)).toBe(true);
                    expect(graph.hasNode(key2)).toBe(true);

                    expect(graph.getNode(key2).full).toBe(false);

                    expect(imagesByHSpy.calls.count()).toBe(1);
                    done();
                });

        const key2 = "full-key-2";
        const fullNode2 = new NodeHelper().createFullNode();
        fullNode2.id = key2;
        tileResult[cellId]["1"] = fullNode2;
        imagesByHUpdate.next(tileResult);
        imagesByHUpdate.complete();
    });
});
