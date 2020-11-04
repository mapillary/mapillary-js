import { from as observableFrom, of as observableOf, merge as observableMerge, Observable, Subject } from "rxjs";

import { first, mergeAll } from "rxjs/operators";

import { NodeHelper } from "../helper/NodeHelper.spec";

import {
    ICoreNode,
    IFillNode,
    IFullNode,
    ISequence,
    IDataProvider,
} from "../../src/API";
import { EdgeCalculator } from "../../src/Edge";
import { GraphMapillaryError } from "../../src/Error";
import { GeoRBush } from "../../src/Geo";
import {
    GraphCalculator,
    Graph,
    IGraphConfiguration,
    Node,
    Sequence,
} from "../../src/Graph";
import API from "../../src/api/API";
import FalcorDataProvider from "../../src/api/FalcorDataProvider";
import IGeometryProvider from "../../src/api/interfaces/IGeometryProvider";
import GeohashGeometryProvider from "../../src/api/GeohashGeometryProvider";

describe("Graph.ctor", () => {
    it("should create a graph", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));

        const graph: Graph = new Graph(api);

        expect(graph).toBeDefined();
    });

    it("should create a graph with all ctor params", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const graph: Graph = new Graph(api, index, calculator);

        expect(graph).toBeDefined();
    });
});

describe("Graph.cacheBoundingBox$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should cache one node in the bounding box", (done: Function) => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "bboxToCellIds").and.returnValue([h]);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        const key: string = "key";
        const imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(api, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        const fullNode: IFullNode = helper.createFullNode();
        fullNode.key = key;
        fullNode.l.lat = 0.5;
        fullNode.l.lon = 0.5;

        const graph: Graph = new Graph(api, index, calculator);

        graph.cacheBoundingBox$({ lat: 0, lon: 0 }, { lat: 1, lon: 1 })
            .subscribe(
                (nodes: Node[]): void => {
                    expect(nodes.length).toBe(1);
                    expect(nodes[0].key).toBe(fullNode.key);
                    expect(nodes[0].full).toBe(true);

                    expect(graph.hasNode(key)).toBe(true);

                    done();
                });

        const tileResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        tileResult[h] = {};
        tileResult[h]["0"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        const fillResult: { [key: string]: IFillNode } = {};
        fillResult[key] = fullNode;
        imageByKeyFill.next(fillResult);
        imageByKeyFill.complete();
    });

    it("should not cache tile of fill node if already cached", (done: Function) => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "bboxToCellIds").and.returnValue([h]);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        const imagesByHSpy: jasmine.Spy = spyOn(api, "imagesByH$");
        imagesByHSpy.and.returnValue(imagesByH);

        const key: string = "key";
        const imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        const imageByKeyFillSpy: jasmine.Spy = spyOn(api, "imageByKeyFill$");
        imageByKeyFillSpy.and.returnValue(imageByKeyFill);

        const imageByKeyFull: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        const imageByKeyFullSpy: jasmine.Spy = spyOn(api, "imageByKeyFull$");
        imageByKeyFullSpy.and.returnValue(imageByKeyFull);

        const fullNode: IFullNode = helper.createFullNode();
        fullNode.key = key;
        fullNode.l.lat = 0.5;
        fullNode.l.lon = 0.5;

        const graph: Graph = new Graph(api, index, calculator);

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fullResult: { [key: string]: IFullNode } = {};
        fullResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fullResult);
        imageByKeyFull.complete();

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const tileResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        tileResult[h] = {};
        tileResult[h]["0"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);
        expect(graph.hasTiles(fullNode.key)).toBe(true);

        expect(imagesByHSpy.calls.count()).toBe(1);
        expect(imageByKeyFillSpy.calls.count()).toBe(0);
        expect(imageByKeyFullSpy.calls.count()).toBe(1);

        graph.cacheBoundingBox$({ lat: 0, lon: 0 }, { lat: 1, lon: 1 })
            .subscribe(
                (nodes: Node[]): void => {
                    expect(nodes.length).toBe(1);
                    expect(nodes[0].key).toBe(fullNode.key);
                    expect(nodes[0].full).toBe(true);

                    expect(graph.hasNode(key)).toBe(true);

                    expect(imagesByHSpy.calls.count()).toBe(1);
                    expect(imageByKeyFillSpy.calls.count()).toBe(0);
                    expect(imageByKeyFullSpy.calls.count()).toBe(1);

                    done();
                });
    });

    it("should only cache tile once for two similar calls", (done: Function) => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "bboxToCellIds").and.returnValue([h]);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        const imagesByHSpy: jasmine.Spy = spyOn(api, "imagesByH$");
        imagesByHSpy.and.returnValue(imagesByH);

        const key: string = "key";
        const imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(api, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        const fullNode: IFullNode = helper.createFullNode();
        fullNode.key = key;
        fullNode.l.lat = 0.5;
        fullNode.l.lon = 0.5;

        const graph: Graph = new Graph(api, index, calculator);

        let count: number = 0;
        observableMerge(
            graph.cacheBoundingBox$({ lat: 0, lon: 0 }, { lat: 1, lon: 1 }),
            graph.cacheBoundingBox$({ lat: 0, lon: 0 }, { lat: 1, lon: 1 }))
            .subscribe(
                (nodes: Node[]): void => {
                    expect(nodes.length).toBe(1);
                    expect(nodes[0].key).toBe(fullNode.key);
                    expect(nodes[0].full).toBe(true);

                    expect(graph.hasNode(key)).toBe(true);

                    count++;
                },
                undefined,
                (): void => {
                    expect(count).toBe(2);
                    expect(imagesByHSpy.calls.count()).toBe(1);

                    done();
                });

        const tileResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        tileResult[h] = {};
        tileResult[h]["0"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        const fillResult: { [key: string]: IFillNode } = {};
        fillResult[key] = fullNode;
        imageByKeyFill.next(fillResult);
        imageByKeyFill.complete();
    });
});

describe("Graph.cacheFull$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should be fetching", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const fullNode: IFullNode = helper.createFullNode();
        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();

        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const graph: Graph = new Graph(api, index, calculator);
        graph.cacheFull$(fullNode.key);

        expect(graph.isCachingFull(fullNode.key)).toBe(true);
        expect(graph.hasNode(fullNode.key)).toBe(false);
        expect(graph.getNode(fullNode.key)).toBeUndefined();
    });

    it("should fetch", (done: Function) => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key)
            .subscribe(
                (g: Graph): void => {
                    expect(g.isCachingFull(fullNode.key)).toBe(false);
                    expect(g.hasNode(fullNode.key)).toBe(true);
                    expect(g.getNode(fullNode.key)).toBeDefined();
                    expect(g.getNode(fullNode.key).key).toBe(fullNode.key);

                    done();
                });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.isCachingFull(fullNode.key)).toBe(false);
        expect(graph.hasNode(fullNode.key)).toBe(true);
        expect(graph.getNode(fullNode.key)).toBeDefined();
        expect(graph.getNode(fullNode.key).key).toBe(fullNode.key);
    });

    it("should not make additional calls when fetching same node twice", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const fullNode: IFullNode = helper.createFullNode();
        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();

        const imageByKeyFullSpy: jasmine.Spy = spyOn(api, "imageByKeyFull$");
        imageByKeyFullSpy.and.returnValue(imageByKeyFull);

        const graph: Graph = new Graph(api, index, calculator);

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        expect(imageByKeyFullSpy.calls.count()).toBe(1);
    });

    it("should throw when fetching node already in graph", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.isCachingFull(fullNode.key)).toBe(false);
        expect(() => { graph.cacheFull$(fullNode.key); }).toThrowError(Error);
    });

    it("should throw if sequence key is missing", (done: Function) => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = undefined;

        graph.cacheFull$(fullNode.key)
            .subscribe(
                (g: Graph): void => { return; },
                (e: GraphMapillaryError): void => {
                    done();
                });

        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        imageByKeyFull.next(result);
        imageByKeyFull.complete();
    });

    it("should make full when fetched node has been retrieved in tile in parallell", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const key: string = "key";
        const otherKey: string = "otherKey";
        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeyFullOther: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.callFake(
            (keys: string[]): Observable<{ [key: string]: IFullNode }> => {
                if (keys[0] === key) {
                    return imageByKeyFull;
                } else if (keys[0] === otherKey) {
                    return imageByKeyFullOther;
                }

                throw new GraphMapillaryError("Wrong key.");
            });

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        const graph: Graph = new Graph(api, index, calculator);

        const otherNode: IFullNode = helper.createFullNode();
        otherNode.key = otherKey;
        graph.cacheFull$(otherNode.key).subscribe(() => { /*noop*/ });

        const otherFullResult: { [key: string]: IFullNode } = {};
        otherFullResult[otherNode.key] = otherNode;
        imageByKeyFullOther.next(otherFullResult);
        imageByKeyFullOther.complete();

        graph.hasTiles(otherNode.key);
        observableFrom(graph.cacheTiles$(otherNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const fullNode: IFullNode = helper.createFullNode();
        fullNode.key = key;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        expect(graph.hasNode(fullNode.key)).toBe(false);
        expect(graph.isCachingFull(fullNode.key)).toBe(true);

        const tileResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        tileResult[h] = {};
        tileResult[h]["0"] = otherNode;
        tileResult[h]["1"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);
        expect(graph.getNode(fullNode.key).full).toBe(false);

        const fullResult: { [key: string]: IFullNode } = {};
        fullResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fullResult);
        imageByKeyFull.complete();

        expect(graph.getNode(fullNode.key).full).toBe(true);
    });
});

describe("Graph.cacheFill$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should be filling", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        const imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(api, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const tileNode: ICoreNode = helper.createCoreNode();
        tileNode.key = "tileNodeKey";
        const result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = tileNode;
        imagesByH.next(result);

        expect(graph.getNode(tileNode.key).full).toBe(false);
        expect(graph.isCachingFill(tileNode.key)).toBe(false);

        graph.cacheFill$(tileNode.key).subscribe(() => { /*noop*/ });

        expect(graph.getNode(tileNode.key).full).toBe(false);
        expect(graph.isCachingFill(tileNode.key)).toBe(true);
    });

    it("should fill", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        const imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(api, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const tileNode: ICoreNode = helper.createCoreNode();
        tileNode.key = "tileNodeKey";
        const result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = tileNode;
        imagesByH.next(result);

        expect(graph.getNode(tileNode.key).full).toBe(false);
        expect(graph.isCachingFill(tileNode.key)).toBe(false);

        graph.cacheFill$(tileNode.key).subscribe(() => { /*noop*/ });

        const fillTileNode: IFillNode = helper.createFullNode();
        const fillResult: { [key: string]: IFillNode } = {};
        fillResult[tileNode.key] = fillTileNode;
        imageByKeyFill.next(fillResult);

        expect(graph.getNode(tileNode.key).full).toBe(true);
        expect(graph.isCachingFill(tileNode.key)).toBe(false);
    });

    it("should not make additional calls when filling same node twice", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        const imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        const imageByKeyFillSpy: jasmine.Spy = spyOn(api, "imageByKeyFill$");
        imageByKeyFillSpy.and.returnValue(imageByKeyFill);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const tileNode: ICoreNode = helper.createCoreNode();
        tileNode.key = "tileNodeKey";
        const result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = tileNode;
        imagesByH.next(result);

        expect(graph.getNode(tileNode.key).full).toBe(false);
        expect(graph.isCachingFill(tileNode.key)).toBe(false);

        graph.cacheFill$(tileNode.key).subscribe(() => { /*noop*/ });
        graph.cacheFill$(tileNode.key).subscribe(() => { /*noop*/ });

        expect(imageByKeyFillSpy.calls.count()).toBe(1);
    });

    it("should throw if already fetching", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.key);

        expect(graph.isCachingFull(fullNode.key)).toBe(true);

        expect(() => { graph.cacheFill$(fullNode.key); }).toThrowError(Error);
    });

    it("should throw if node does not exist", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(api, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        const graph: Graph = new Graph(api, index, calculator);

        expect(() => { graph.cacheFill$("key"); }).toThrowError(Error);
    });

    it("should throw if already full", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(api, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.key);

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        expect(() => { graph.cacheFill$(fullNode.key); }).toThrowError(Error);
    });
});

describe("Graph.cacheTiles$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should be caching tiles", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const node: Node = helper.createNode();

        spyOn(geometryProvider, "latLonToCellIds").and.returnValue(["h"]);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        const graph: Graph = new Graph(api, index, calculator);

        spyOn(graph, "hasNode").and.returnValue(true);
        spyOn(graph, "getNode").and.returnValue(node);

        expect(graph.hasTiles(node.key)).toBe(false);
        expect(graph.isCachingTiles(node.key)).toBe(false);

        graph.cacheTiles$(node.key);

        expect(graph.hasTiles(node.key)).toBe(false);
        expect(graph.isCachingTiles(node.key)).toBe(true);
    });

    it("should cache tiles", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const fullNode: IFullNode = helper.createFullNode();

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imageByKeyResult: { [key: string]: IFullNode } = {};
        imageByKeyResult[fullNode.key] = fullNode;
        const imageByKeyFull: Observable<{ [key: string]: IFullNode }> = observableOf<{ [key: string]: IFullNode }>(imageByKeyResult);
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        const graph: Graph = new Graph(api, index, calculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        expect(graph.hasTiles(fullNode.key)).toBe(false);
        expect(graph.isCachingTiles(fullNode.key)).toBe(false);

        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = fullNode;
        imagesByH.next(result);

        expect(graph.hasTiles(fullNode.key)).toBe(true);
        expect(graph.isCachingTiles(fullNode.key)).toBe(false);
    });

    it("should encode hs only once when checking tiles cache", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const node: Node = helper.createNode();

        const h: string = "h";
        const encodeHsSpy: jasmine.Spy = spyOn(geometryProvider, "latLonToCellIds");
        encodeHsSpy.and.returnValue([h]);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        const graph: Graph = new Graph(api, index, calculator);

        spyOn(graph, "hasNode").and.returnValue(true);
        spyOn(graph, "getNode").and.returnValue(node);

        expect(graph.hasTiles(node.key)).toBe(false);
        expect(graph.hasTiles(node.key)).toBe(false);

        expect(encodeHsSpy.calls.count()).toBe(1);
    });

    it("should encode hs only once when caching tiles", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const fullNode: IFullNode = helper.createFullNode();

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        const encodeHsSpy: jasmine.Spy = spyOn(geometryProvider, "latLonToCellIds");
        encodeHsSpy.and.returnValue([h]);

        const imageByKeyResult: { [key: string]: IFullNode } = {};
        imageByKeyResult[fullNode.key] = fullNode;
        const imageByKeyFull: Observable<{ [key: string]: IFullNode }> = observableOf<{ [key: string]: IFullNode }>(imageByKeyResult);
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        const graph: Graph = new Graph(api, index, calculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        expect(graph.hasTiles(fullNode.key)).toBe(false);

        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = fullNode;
        imagesByH.next(result);

        expect(graph.hasTiles(fullNode.key)).toBe(true);

        expect(encodeHsSpy.calls.count()).toBe(1);
    });
});

describe("Graph.cacheSequenceNodes$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should throw when sequence does not exist", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);

        expect(() => { graph.cacheSequenceNodes$("sequenceKey"); }).toThrowError(Error);
    });

    it("should not be cached", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);

        const sequenceKey: string = "sequenceKey";
        const key: string = "key";

        graph.cacheSequence$(sequenceKey).subscribe();

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [key] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(false);
    });

    it("should start caching", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);

        const sequenceKey: string = "sequenceKey";
        const key: string = "key";

        graph.cacheSequence$(sequenceKey).subscribe();

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [key] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceKey)).toBe(true);
    });

    it("should be cached and not caching", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);

        const sequenceKey: string = "sequenceKey";
        const nodeKey: string = "nodeKey";

        graph.cacheSequence$(sequenceKey).subscribe();

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [nodeKey] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey).subscribe();

        const imageResult: { [key: string]: IFullNode } = {};
        imageResult[nodeKey] = helper.createFullNode();
        imageResult[nodeKey].key = nodeKey;
        imageByKey.next(imageResult);
        imageByKey.complete();

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(true);
        expect(graph.isCachingSequenceNodes(sequenceKey)).toBe(false);
        expect(graph.hasNode(nodeKey)).toBe(true);
        expect(graph.getNode(nodeKey).key).toBe(nodeKey);
    });

    it("should not be cached after uncaching sequence node", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        spyOn(geometryProvider, "latLonToCellId").and.returnValue("h");

        const edgeCalculator: EdgeCalculator = new EdgeCalculator();
        const configuration: IGraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator, undefined, configuration);

        const sequenceKey: string = "sequenceKey";
        const nodeKey: string = "nodeKey";

        graph.cacheSequence$(sequenceKey).subscribe();

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [nodeKey] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey).subscribe();

        const imageResult: { [key: string]: IFullNode } = {};
        const fullNode: IFullNode = helper.createFullNode();
        fullNode.key = nodeKey;
        fullNode.sequence_key = sequenceKey;
        imageResult[fullNode.key] = fullNode;
        imageByKey.next(imageResult);
        imageByKey.complete();

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(true);

        graph.uncache([]);

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(false);
    });

    it("should not be cached after uncaching sequence", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        spyOn(geometryProvider, "latLonToCellId").and.returnValue("h");

        const edgeCalculator: EdgeCalculator = new EdgeCalculator();
        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator, undefined, configuration);

        const sequenceKey: string = "sequenceKey";
        const nodeKey: string = "nodeKey";

        graph.cacheSequence$(sequenceKey).subscribe();

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [nodeKey] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey).subscribe();

        const imageResult: { [key: string]: IFullNode } = {};
        const fullNode: IFullNode = helper.createFullNode();
        fullNode.key = nodeKey;
        fullNode.sequence_key = sequenceKey;
        imageResult[fullNode.key] = fullNode;
        imageByKey.next(imageResult);
        imageByKey.complete();

        graph.initializeCache(fullNode.key);

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(true);

        graph.uncache([]);

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(false);
    });

    it("should be cached after uncaching if sequence is kept", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        spyOn(geometryProvider, "latLonToCellId").and.returnValue("h");

        const edgeCalculator: EdgeCalculator = new EdgeCalculator();
        const configuration: IGraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator, undefined, configuration);

        const sequenceKey: string = "sequenceKey";
        const nodeKey: string = "nodeKey";

        graph.cacheSequence$(sequenceKey).subscribe();

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [nodeKey] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey).subscribe();

        const imageResult: { [key: string]: IFullNode } = {};
        const fullNode: IFullNode = helper.createFullNode();
        fullNode.key = nodeKey;
        fullNode.sequence_key = sequenceKey;
        imageResult[fullNode.key] = fullNode;
        imageByKey.next(imageResult);
        imageByKey.complete();

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(true);

        graph.uncache([], sequenceKey);

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(true);
    });

    it("should be cached after uncaching if all nodes are kept", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        spyOn(geometryProvider, "latLonToCellId").and.returnValue("h");

        const edgeCalculator: EdgeCalculator = new EdgeCalculator();
        const configuration: IGraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator, undefined, configuration);

        const sequenceKey: string = "sequenceKey";
        const nodeKey: string = "nodeKey";

        graph.cacheSequence$(sequenceKey).subscribe();

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [nodeKey] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey).subscribe();

        const imageResult: { [key: string]: IFullNode } = {};
        const fullNode: IFullNode = helper.createFullNode();
        fullNode.key = nodeKey;
        fullNode.sequence_key = sequenceKey;
        imageResult[fullNode.key] = fullNode;
        imageByKey.next(imageResult);
        imageByKey.complete();

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(true);

        graph.uncache([fullNode.key]);

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(true);
    });

    it("should not be cached after uncaching tile", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const edgeCalculator: EdgeCalculator = new EdgeCalculator();
        const configuration: IGraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator, undefined, configuration);

        const sequenceKey: string = "sequenceKey";
        const nodeKey: string = "nodeKey";

        graph.cacheSequence$(sequenceKey).subscribe();

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [nodeKey] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey).subscribe();

        const imageResult: { [key: string]: IFullNode } = {};
        const fullNode: IFullNode = helper.createFullNode();
        fullNode.key = nodeKey;
        fullNode.sequence_key = sequenceKey;
        imageResult[fullNode.key] = fullNode;
        imageByKey.next(imageResult);
        imageByKey.complete();

        graph.initializeCache(fullNode.key);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.key)).toBe(true);

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(true);

        const node: Node = graph.getNode(fullNode.key);
        const nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(false);
    });

    it("should be cached after uncaching tile if sequence is kept", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const edgeCalculator: EdgeCalculator = new EdgeCalculator();
        const configuration: IGraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator, undefined, configuration);

        const sequenceKey: string = "sequenceKey";
        const nodeKey: string = "nodeKey";

        graph.cacheSequence$(sequenceKey).subscribe();

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [nodeKey] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey).subscribe();

        const imageResult: { [key: string]: IFullNode } = {};
        const fullNode: IFullNode = helper.createFullNode();
        fullNode.key = nodeKey;
        fullNode.sequence_key = sequenceKey;
        imageResult[fullNode.key] = fullNode;
        imageByKey.next(imageResult);
        imageByKey.complete();

        graph.initializeCache(fullNode.key);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.key)).toBe(true);

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(true);

        const node: Node = graph.getNode(fullNode.key);
        const nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([], sequenceKey);

        expect(nodeUncacheSpy.calls.count()).toBe(1);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(true);
    });

    it("should throw if caching already cached sequence nodes", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);

        const sequenceKey: string = "sequenceKey";
        const nodeKey: string = "nodeKey";

        graph.cacheSequence$(sequenceKey).subscribe();

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [nodeKey] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey).subscribe();

        const imageResult: { [key: string]: IFullNode } = {};
        imageResult[nodeKey] = helper.createFullNode();
        imageResult[nodeKey].key = nodeKey;
        imageByKey.next(imageResult);
        imageByKey.complete();

        expect(() => { graph.cacheSequenceNodes$(sequenceKey); }).toThrowError(Error);
    });

    it("should only call API once if caching multiple times before response", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(api, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);

        const sequenceKey: string = "sequenceKey";
        const nodeKey: string = "nodeKey";

        graph.cacheSequence$(sequenceKey).subscribe();

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [nodeKey] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey).subscribe();
        graph.cacheSequenceNodes$(sequenceKey).subscribe();

        const imageResult: { [key: string]: IFullNode } = {};
        imageResult[nodeKey] = helper.createFullNode();
        imageResult[nodeKey].key = nodeKey;
        imageByKey.next(imageResult);
        imageByKey.complete();

        expect(imageByKeySpy.calls.count()).toBe(1);
    });

    it("should not be cached and not caching on error", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);

        const sequenceKey: string = "sequenceKey";
        const nodeKey: string = "nodeKey";

        graph.cacheSequence$(sequenceKey).subscribe();

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [nodeKey] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey)
            .subscribe(
                (): void => { /*noop*/ },
                (e: Error): void => { /*noop*/ });

        imageByKey.error(new Error("404"));

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(false);
        expect(graph.isCachingSequenceNodes(sequenceKey)).toBe(false);
        expect(graph.hasNode(nodeKey)).toBe(false);
    });

    it("should start caching in with single batch when lass than or equal to 200 nodes", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(api, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);

        const sequenceKey: string = "sequenceKey";
        const key: string = "key";

        graph.cacheSequence$(sequenceKey).subscribe();

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: Array(200).fill(undefined).map((value, i) => { return i.toString(); }) };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceKey)).toBe(true);

        expect(imageByKeySpy.calls.count()).toBe(1);
        expect(imageByKeySpy.calls.argsFor(0)[0].length).toBe(200);
        expect(
            imageByKeySpy.calls.allArgs()
                .map((args: string[][]): number => { return args[0].length; })
                .reduce((acc: number, cur: number): number => { return acc + cur; }, 0))
            .toBe(200);
    });

    it("should start caching in batches when more than 200 nodes", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(api, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);

        const sequenceKey: string = "sequenceKey";
        const key: string = "key";

        graph.cacheSequence$(sequenceKey).subscribe();

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: Array(201).fill(undefined).map((value, i) => { return i.toString(); }) };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceKey)).toBe(true);

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
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(api, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);

        const sequenceKey: string = "sequenceKey";
        const key: string = "key";

        graph.cacheSequence$(sequenceKey).subscribe();

        const referenceNodeKey: string = "referenceNodeKey";

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: Array.from(new Array(400), (x, i): string => i.toString()) };
        result[sequenceKey].keys.splice(0, 1, referenceNodeKey);
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey, referenceNodeKey).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceKey)).toBe(true);

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
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(api, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);

        const sequenceKey: string = "sequenceKey";
        const key: string = "key";

        graph.cacheSequence$(sequenceKey).subscribe();

        const referenceNodeKey: string = "referenceNodeKey";

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: Array.from(new Array(400), (x, i): string => i.toString()) };
        result[sequenceKey].keys.splice(399, 1, referenceNodeKey);
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey, referenceNodeKey).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceKey)).toBe(true);

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
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(api, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);

        const sequenceKey: string = "sequenceKey";
        const key: string = "key";

        graph.cacheSequence$(sequenceKey).subscribe();

        const referenceNodeKey: string = "referenceNodeKey";

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: Array.from(new Array(400), (x, i): string => i.toString()) };
        result[sequenceKey].keys.splice(200, 1, referenceNodeKey);
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey, referenceNodeKey).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceKey)).toBe(true);

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
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(api, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);

        const sequenceKey: string = "sequenceKey";
        const key: string = "key";

        graph.cacheSequence$(sequenceKey).subscribe();

        const referenceNodeKey: string = "referenceNodeKey";

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: Array.from(new Array(400), (x, i): string => i.toString()) };
        result[sequenceKey].keys.splice(200, 1, referenceNodeKey);
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey, referenceNodeKey).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceKey)).toBe(true);
        expect(graph.getSequence(sequenceKey).keys.length).toBe(400);
        expect(graph.getSequence(sequenceKey).keys).toEqual(result[sequenceKey].keys);
    });

    it("should create single batch when fewer than or equal to 50 nodes", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(api, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);

        const sequenceKey: string = "sequenceKey";
        const key: string = "key";

        graph.cacheSequence$(sequenceKey).subscribe();

        const referenceNodeKey: string = "referenceNodeKey";

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: Array.from(new Array(50), (x, i): string => i.toString()) };
        result[sequenceKey].keys.splice(20, 1, referenceNodeKey);
        sequenceByKey.next(result);
        sequenceByKey.complete();

        graph.cacheSequenceNodes$(sequenceKey, referenceNodeKey).subscribe();

        expect(graph.isCachingSequenceNodes(sequenceKey)).toBe(true);

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
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const fullNode: IFullNode = helper.createFullNode();

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        const node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        spyOn(index, "search").and.returnValue([{ node: node }]);

        expect(graph.hasSpatialArea(fullNode.key)).toBe(true);
    });

    it("should not be cached", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const fullNode: IFullNode = helper.createFullNode();

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        const node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        const coreNode: ICoreNode = helper.createCoreNode();
        coreNode.key = "otherKey";

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = fullNode;
        result[h]["1"] = coreNode;
        imagesByH.next(result);

        const otherNode: Node = graph.getNode(coreNode.key);

        spyOn(index, "search").and.returnValue([{ node: node }, { node: otherNode }]);

        expect(graph.hasSpatialArea(fullNode.key)).toBe(false);
    });
});

describe("Graph.cacheSpatialEdges", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should use fallback keys", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const fullNode: IFullNode = helper.createFullNode();

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        const result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: ["prev", fullNode.key, "next"] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        const node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        spyOn(index, "search").and.returnValue([{ node: node }]);

        expect(graph.hasSpatialArea(fullNode.key)).toBe(true);

        const getPotentialSpy: jasmine.Spy = spyOn(edgeCalculator, "getPotentialEdges");
        getPotentialSpy.and.returnValue([]);

        spyOn(edgeCalculator, "computeStepEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeTurnEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePanoEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePerspectiveToPanoEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSimilarEdges").and.returnValue([]);

        graph.initializeCache(fullNode.key);
        graph.cacheSpatialEdges(fullNode.key);

        expect(getPotentialSpy.calls.first().args.length).toBe(3);
        expect(getPotentialSpy.calls.first().args[2].length).toBe(2);
        expect(getPotentialSpy.calls.first().args[2].indexOf("prev")).not.toBe(-1);
        expect(getPotentialSpy.calls.first().args[2].indexOf("next")).not.toBe(-1);
        expect(getPotentialSpy.calls.first().args[2].indexOf(fullNode.key)).toBe(-1);
    });

    it("should apply filter", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const fullNode: IFullNode = helper.createFullNode();

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        const result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: ["prev", fullNode.key, "next"] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        const node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        const otherFullNode: IFullNode = helper.createFullNode();
        otherFullNode.sequence_key = "otherSequenceKey";
        const otherNode: Node = new Node(otherFullNode);
        otherNode.makeFull(otherFullNode);

        spyOn(index, "search").and.returnValue([{ node: node }, { node: otherNode }]);

        expect(graph.hasSpatialArea(fullNode.key)).toBe(true);

        const getPotentialSpy: jasmine.Spy = spyOn(edgeCalculator, "getPotentialEdges");
        getPotentialSpy.and.returnValue([]);

        spyOn(edgeCalculator, "computeStepEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeTurnEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePanoEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePerspectiveToPanoEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSimilarEdges").and.returnValue([]);

        graph.setFilter(["==", "sequenceKey", "otherSequenceKey"]);

        graph.initializeCache(fullNode.key);
        graph.cacheSpatialEdges(fullNode.key);

        expect(getPotentialSpy.calls.first().args.length).toBe(3);
        expect(getPotentialSpy.calls.first().args[1].length).toBe(1);
        expect(getPotentialSpy.calls.first().args[1][0].sequenceKey).toBe("otherSequenceKey");
    });

    it("should apply remove by filtering", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const fullNode: IFullNode = helper.createFullNode();

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        const result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: ["prev", fullNode.key, "next"] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        const node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        const otherFullNode: IFullNode = helper.createFullNode();
        otherFullNode.sequence_key = "otherSequenceKey";
        const otherNode: Node = new Node(otherFullNode);
        otherNode.makeFull(otherFullNode);

        spyOn(index, "search").and.returnValue([{ node: node }, { node: otherNode }]);

        expect(graph.hasSpatialArea(fullNode.key)).toBe(true);

        const getPotentialSpy: jasmine.Spy = spyOn(edgeCalculator, "getPotentialEdges");
        getPotentialSpy.and.returnValue([]);

        spyOn(edgeCalculator, "computeStepEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeTurnEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePanoEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePerspectiveToPanoEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSimilarEdges").and.returnValue([]);

        graph.setFilter(["==", "sequenceKey", "none"]);

        graph.initializeCache(fullNode.key);
        graph.cacheSpatialEdges(fullNode.key);

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
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        expect(graph.hasNodeSequence(fullNode.key)).toBe(false);
    });

    it("should be caching", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key);

        expect(graph.hasNodeSequence(fullNode.key)).toBe(false);
        expect(graph.isCachingNodeSequence(fullNode.key)).toBe(true);
    });

    it("should be cached", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = "sequenceKey";

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.cacheNodeSequence$(fullNode.key)
            .subscribe(
                (g: Graph): void => {
                    expect(g.hasNodeSequence(fullNode.key)).toBe(true);
                    expect(g.isCachingNodeSequence(fullNode.key)).toBe(false);
                });

        const result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: [fullNode.key] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasNodeSequence(fullNode.key)).toBe(true);
        expect(graph.isCachingNodeSequence(fullNode.key)).toBe(false);
    });

    it("should throw if node not in graph", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = "sequenceKey";

        expect(() => { graph.cacheNodeSequence$(fullNode.key); }).toThrowError(Error);
    });

    it("should throw if already cached", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = "sequenceKey";

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        const result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: [fullNode.key] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasNodeSequence(fullNode.key)).toBe(true);

        expect(() => { graph.cacheNodeSequence$(fullNode.key); }).toThrowError(Error);
    });

    it("should call api only once when caching the same sequence twice in succession", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        const sequenceByKeySpy: jasmine.Spy = spyOn(api, "sequenceByKey$");
        sequenceByKeySpy.and.returnValue(sequenceByKey);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = "sequenceKey";

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });
        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        expect(sequenceByKeySpy.calls.count()).toBe(1);
    });

    it("should emit to changed stream", (done: Function) => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = "sequenceKey";

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        graph.changed$.pipe(
            first())
            .subscribe(
                (g: Graph): void => {
                    expect(g.hasNodeSequence(fullNode.key)).toBe(true);
                    expect(g.isCachingNodeSequence(fullNode.key)).toBe(false);

                    done();
                });

        const result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: [fullNode.key] };
        sequenceByKey.next(result);
        sequenceByKey.complete();
    });
});

describe("Graph.cacheSequence$", () => {
    it("should not be cached", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const graph: Graph = new Graph(api, index, calculator);

        const sequenceKey: string = "sequenceKey";

        expect(graph.hasSequence(sequenceKey)).toBe(false);
    });

    it("should not be caching", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const graph: Graph = new Graph(api, index, calculator);

        const sequenceKey: string = "sequenceKey";

        expect(graph.isCachingSequence(sequenceKey)).toBe(false);
    });

    it("should be caching", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const graph: Graph = new Graph(api, index, calculator);

        const sequenceKey: string = "sequenceKey";

        graph.cacheSequence$(sequenceKey).subscribe(() => { /*noop*/ });

        expect(graph.hasSequence(sequenceKey)).toBe(false);
        expect(graph.isCachingSequence(sequenceKey)).toBe(true);
    });

    it("should cache", (done: Function) => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const graph: Graph = new Graph(api, index, calculator);

        const sequenceKey: string = "sequenceKey";
        const key: string = "key";

        graph.cacheSequence$(sequenceKey)
            .subscribe(
                (g: Graph): void => {
                    expect(g.hasSequence(sequenceKey)).toBe(true);
                    expect(g.isCachingSequence(sequenceKey)).toBe(false);
                    expect(g.getSequence(sequenceKey)).toBeDefined();
                    expect(g.getSequence(sequenceKey).key).toBe(sequenceKey);
                    expect(g.getSequence(sequenceKey).keys.length).toBe(1);
                    expect(g.getSequence(sequenceKey).keys[0]).toBe(key);

                    done();
                });

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [key] };
        sequenceByKey.next(result);
        sequenceByKey.complete();
    });

    it("should call api only once when caching the same sequence twice in succession", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        const sequenceByKeySpy: jasmine.Spy = spyOn(api, "sequenceByKey$");
        sequenceByKeySpy.and.returnValue(sequenceByKey);

        const graph: Graph = new Graph(api, index, calculator);

        const sequenceKey: string = "sequenceKey";

        graph.cacheSequence$(sequenceKey).subscribe(() => { /*noop*/ });
        graph.cacheSequence$(sequenceKey).subscribe(() => { /*noop*/ });

        expect(sequenceByKeySpy.calls.count()).toBe(1);
    });
});

describe("Graph.resetSpatialEdges", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should use fallback keys", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const fullNode: IFullNode = helper.createFullNode();

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        const result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: ["prev", fullNode.key, "next"] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        const node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        const searchSpy: jasmine.Spy = spyOn(index, "search");
        searchSpy.and.returnValue([{ node: node }]);

        expect(graph.hasSpatialArea(fullNode.key)).toBe(true);

        const getPotentialSpy: jasmine.Spy = spyOn(edgeCalculator, "getPotentialEdges");
        getPotentialSpy.and.returnValue([]);

        spyOn(edgeCalculator, "computeStepEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeTurnEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePanoEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePerspectiveToPanoEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSimilarEdges").and.returnValue([]);

        graph.initializeCache(fullNode.key);
        graph.cacheSpatialEdges(fullNode.key);

        const nodeSequenceResetSpy: jasmine.Spy = spyOn(node, "resetSequenceEdges").and.stub();
        const nodeSpatialResetSpy: jasmine.Spy = spyOn(node, "resetSpatialEdges").and.stub();

        graph.resetSpatialEdges();

        expect(nodeSequenceResetSpy.calls.count()).toBe(0);
        expect(nodeSpatialResetSpy.calls.count()).toBe(1);

        const countBefore: number = searchSpy.calls.count();
        expect(graph.hasSpatialArea(fullNode.key)).toBe(true);
        const countAfter: number = searchSpy.calls.count();

        expect(countAfter - countBefore).toBe(1);
    });

    it("should have to re-encode hs after spatial edges reset", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        const encodeHsSpy: jasmine.Spy = spyOn(geometryProvider, "latLonToCellIds");
        encodeHsSpy.and.returnValue([h]);

        const fullNode: IFullNode = helper.createFullNode();

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const graph: Graph = new Graph(api, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        const fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        const result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: ["prev", fullNode.key, "next"] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasTiles(fullNode.key)).toBe(false);
        expect(graph.isCachingTiles(fullNode.key)).toBe(false);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHresult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHresult[h] = {};
        imagesByHresult[h]["0"] = fullNode;
        imagesByH.next(imagesByHresult);

        expect(graph.hasTiles(fullNode.key)).toBe(true);
        expect(graph.isCachingTiles(fullNode.key)).toBe(false);

        const node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        spyOn(index, "search").and.returnValue([{ node: node }]);

        expect(graph.hasSpatialArea(fullNode.key)).toBe(true);

        const getPotentialSpy: jasmine.Spy = spyOn(edgeCalculator, "getPotentialEdges");
        getPotentialSpy.and.returnValue([]);

        spyOn(edgeCalculator, "computeStepEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeTurnEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePanoEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePerspectiveToPanoEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSimilarEdges").and.returnValue([]);

        graph.initializeCache(fullNode.key);
        graph.cacheSpatialEdges(fullNode.key);

        const nodeSequenceResetSpy: jasmine.Spy = spyOn(node, "resetSequenceEdges").and.stub();
        const nodeSpatialResetSpy: jasmine.Spy = spyOn(node, "resetSpatialEdges").and.stub();

        graph.resetSpatialEdges();

        expect(nodeSequenceResetSpy.calls.count()).toBe(0);
        expect(nodeSpatialResetSpy.calls.count()).toBe(1);

        const countBefore: number = encodeHsSpy.calls.count();
        expect(graph.hasTiles(fullNode.key)).toBe(true);
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
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        const node: Node = graph.getNode(fullNode.key);

        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose");
        nodeDisposeSpy.and.stub();

        graph.reset([]);

        expect(nodeDisposeSpy.calls.count()).toBe(0);
        expect(graph.hasNode(node.key)).toBe(false);
    });

    it("should dispose cache initialized node", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        const node: Node = graph.getNode(fullNode.key);
        graph.initializeCache(node.key);

        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose");
        nodeDisposeSpy.and.stub();

        graph.reset([]);

        expect(nodeDisposeSpy.calls.count()).toBe(1);
        expect(graph.hasNode(node.key)).toBe(false);
    });

    it("should keep supplied node", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const graph: Graph = new Graph(api, index, calculator);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        const node: Node = graph.getNode(fullNode.key);
        graph.initializeCache(node.key);

        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose");
        nodeDisposeSpy.and.stub();
        const nodeResetSequenceSpy: jasmine.Spy = spyOn(node, "resetSequenceEdges");
        nodeResetSequenceSpy.and.stub();
        const nodeResetSpatialSpy: jasmine.Spy = spyOn(node, "resetSpatialEdges");
        nodeResetSpatialSpy.and.stub();

        graph.reset([node.key]);

        expect(nodeDisposeSpy.calls.count()).toBe(0);
        expect(nodeResetSequenceSpy.calls.count()).toBe(1);
        expect(nodeResetSpatialSpy.calls.count()).toBe(1);
        expect(graph.hasNode(node.key)).toBe(true);
    });
});

describe("Graph.uncache", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should remove prestored node if not cache initialized", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        const node: Node = graph.getNode(fullNode.key);
        const nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.key)).toBe(false);
    });

    it("should not remove prestored node if in kept sequence", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = "sequencKey";
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        const node: Node = graph.getNode(fullNode.key);
        const nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([], fullNode.sequence_key);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.key)).toBe(true);
    });

    it("should remove prestored node if cache initialized", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        graph.initializeCache(fullNode.key);

        const node: Node = graph.getNode(fullNode.key);
        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.key)).toBe(false);
    });

    it("should not remove prestored node when in keys to keep", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        graph.initializeCache(fullNode.key);

        const node: Node = graph.getNode(fullNode.key);
        const nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([fullNode.key]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.key)).toBe(true);
    });

    it("should not remove prestored node if below threshold", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 1,
            maxUnusedTiles: 0,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        graph.initializeCache(fullNode.key);

        const node: Node = graph.getNode(fullNode.key);
        const nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.key)).toBe(true);
    });

    it("should remove prestored node accessed earliest", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);

        const imageByKeyFullSpy: jasmine.Spy = spyOn(api, "imageByKeyFull$");

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 1,
            maxUnusedTiles: 0,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode1: IFullNode = helper.createFullNode();
        fullNode1.key = "key1";
        const result1: { [key: string]: IFullNode } = {};
        result1[fullNode1.key] = fullNode1;

        const imageByKeyFull1: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        imageByKeyFullSpy.and.returnValue(imageByKeyFull1);

        graph.cacheFull$(fullNode1.key).subscribe(() => { /*noop*/ });

        imageByKeyFull1.next(result1);
        imageByKeyFull1.complete();

        expect(graph.hasNode(fullNode1.key)).toBe(true);

        const fullNode2: IFullNode = helper.createFullNode();
        fullNode2.key = "key2";
        const result2: { [key: string]: IFullNode } = {};
        result2[fullNode2.key] = fullNode2;

        const imageByKeyFull2: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        imageByKeyFullSpy.and.returnValue(imageByKeyFull2);

        graph.cacheFull$(fullNode2.key).subscribe(() => { /*noop*/ });

        imageByKeyFull2.next(result2);
        imageByKeyFull2.complete();

        const node1: Node = graph.getNode(fullNode1.key);
        graph.initializeCache(node1.key);

        expect(graph.hasInitializedCache(node1.key)).toBe(true);

        const node2: Node = graph.getNode(fullNode2.key);
        graph.initializeCache(node2.key);

        expect(graph.hasInitializedCache(node2.key)).toBe(true);

        const nodeDisposeSpy1: jasmine.Spy = spyOn(node1, "dispose").and.stub();
        const nodeDisposeSpy2: jasmine.Spy = spyOn(node2, "dispose").and.stub();

        const time: number = new Date().getTime();
        while (new Date().getTime() === time) {
            graph.hasNode(node2.key);
        }

        graph.hasNode(node2.key);

        graph.uncache([]);

        expect(nodeDisposeSpy1.calls.count()).toBe(1);
        expect(nodeDisposeSpy2.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode1.key)).toBe(false);
        expect(graph.hasNode(fullNode2.key)).toBe(true);

    });

    it("should uncache cache initialized node", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        graph.initializeCache(fullNode.key);

        expect(graph.hasInitializedCache(fullNode.key)).toBe(true);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        const node: Node = graph.getNode(fullNode.key);
        const nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.key)).toBe(true);
        expect(graph.hasInitializedCache(fullNode.key)).toBe(false);
    });

    it("should not uncache cache initialized node if below threshold", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        graph.initializeCache(fullNode.key);

        expect(graph.hasInitializedCache(fullNode.key)).toBe(true);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        const node: Node = graph.getNode(fullNode.key);
        const nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.key)).toBe(true);
        expect(graph.hasInitializedCache(fullNode.key)).toBe(true);
    });

    it("should not uncache cache initialized node if key should be kept", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        const node: Node = graph.getNode(fullNode.key);
        graph.initializeCache(node.key);

        expect(graph.hasInitializedCache(node.key)).toBe(true);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        const nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache");
        nodeUncacheSpy.and.stub();

        graph.uncache([node.key]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);

        expect(graph.hasNode(node.key)).toBe(true);
        expect(graph.hasInitializedCache(node.key)).toBe(true);
    });

    it("should not uncache cache initialized node if key in use", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        const node: Node = graph.getNode(fullNode.key);
        graph.initializeCache(node.key);

        expect(graph.hasInitializedCache(node.key)).toBe(true);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(node.key);
        observableFrom(graph.cacheTiles$(node.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(node.key)).toBe(true);
        expect(graph.hasInitializedCache(node.key)).toBe(true);
    });

    it("should uncache cache initialized node accessed earliest", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imageByKeyFullSpy: jasmine.Spy = spyOn(api, "imageByKeyFull$");

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode1: IFullNode = helper.createFullNode();
        fullNode1.key = "key1";
        const result1: { [key: string]: IFullNode } = {};
        result1[fullNode1.key] = fullNode1;

        const imageByKeyFull1: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        imageByKeyFullSpy.and.returnValue(imageByKeyFull1);

        graph.cacheFull$(fullNode1.key).subscribe(() => { /*noop*/ });

        imageByKeyFull1.next(result1);
        imageByKeyFull1.complete();

        expect(graph.hasNode(fullNode1.key)).toBe(true);

        const fullNode2: IFullNode = helper.createFullNode();
        fullNode2.key = "key2";
        const result2: { [key: string]: IFullNode } = {};
        result2[fullNode2.key] = fullNode2;

        const imageByKeyFull2: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        imageByKeyFullSpy.and.returnValue(imageByKeyFull2);

        graph.cacheFull$(fullNode2.key).subscribe(() => { /*noop*/ });

        imageByKeyFull2.next(result2);
        imageByKeyFull2.complete();

        expect(graph.hasNode(fullNode2.key)).toBe(true);

        const node1: Node = graph.getNode(fullNode1.key);
        graph.initializeCache(node1.key);

        expect(graph.hasInitializedCache(node1.key)).toBe(true);

        const node2: Node = graph.getNode(fullNode2.key);
        graph.initializeCache(node2.key);

        expect(graph.hasInitializedCache(node2.key)).toBe(true);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode1.key);
        observableFrom(graph.cacheTiles$(fullNode1.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode1;
        imagesByHResult[h]["1"] = fullNode2;
        imagesByH.next(imagesByHResult);

        const nodeUncacheSpy1: jasmine.Spy = spyOn(node1, "uncache").and.stub();
        const nodeUncacheSpy2: jasmine.Spy = spyOn(node2, "uncache").and.stub();

        const time: number = new Date().getTime();
        while (new Date().getTime() === time) {
            graph.hasNode(node2.key);
        }

        graph.hasNode(node2.key);

        graph.uncache([]);

        expect(nodeUncacheSpy1.calls.count()).toBe(1);
        expect(graph.hasNode(node1.key)).toBe(true);
        expect(graph.hasInitializedCache(node1.key)).toBe(false);

        expect(nodeUncacheSpy2.calls.count()).toBe(0);
        expect(graph.hasNode(node2.key)).toBe(true);
        expect(graph.hasInitializedCache(node2.key)).toBe(true);
    });

    it("should uncache sequence", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const sequenceKey: string = "sequenceKey";

        graph.cacheSequence$(sequenceKey).subscribe(() => { /*noop*/ });

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasSequence(sequenceKey)).toBe(true);

        const sequence: Sequence = graph.getSequence(sequenceKey);

        const sequenceDisposeSpy: jasmine.Spy = spyOn(sequence, "dispose");
        sequenceDisposeSpy.and.stub();

        graph.uncache([]);

        expect(sequenceDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasSequence(sequence.key)).toBe(false);
    });

    it("should not uncache sequence if specified to keep", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const sequenceKey: string = "sequenceKey";

        graph.cacheSequence$(sequenceKey).subscribe(() => { /*noop*/ });

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasSequence(sequenceKey)).toBe(true);

        const sequence: Sequence = graph.getSequence(sequenceKey);

        const sequenceDisposeSpy: jasmine.Spy = spyOn(sequence, "dispose");
        sequenceDisposeSpy.and.stub();

        graph.uncache([], sequenceKey);

        expect(sequenceDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasSequence(sequence.key)).toBe(true);
    });

    it("should not uncache sequence if number below threshold", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(api, "sequenceByKey$").and.returnValue(sequenceByKey);

        const configuration: IGraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const sequenceKey: string = "sequenceKey";

        graph.cacheSequence$(sequenceKey).subscribe(() => { /*noop*/ });

        const result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasSequence(sequenceKey)).toBe(true);

        const sequence: Sequence = graph.getSequence(sequenceKey);

        const sequenceDisposeSpy: jasmine.Spy = spyOn(sequence, "dispose");
        sequenceDisposeSpy.and.stub();

        graph.uncache([]);

        expect(sequenceDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasSequence(sequence.key)).toBe(true);
    });

    it("should not uncache sequence accessed last", () => {
        const api: API = new API(new FalcorDataProvider({ clientToken: "cid" }));
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const sequenceByKeySpy: jasmine.Spy = spyOn(api, "sequenceByKey$");

        const configuration: IGraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const sequenceKey1: string = "sequenceKey1";

        const sequenceByKey1: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        sequenceByKeySpy.and.returnValue(sequenceByKey1);

        graph.cacheSequence$(sequenceKey1).subscribe(() => { /*noop*/ });

        const result1: { [sequenceKey: string]: ISequence } = {};
        result1[sequenceKey1] = { key: sequenceKey1, keys: [] };
        sequenceByKey1.next(result1);
        sequenceByKey1.complete();

        expect(graph.hasSequence(sequenceKey1)).toBe(true);

        const sequence1: Sequence = graph.getSequence(sequenceKey1);

        const sequenceDisposeSpy1: jasmine.Spy = spyOn(sequence1, "dispose").and.stub();

        const sequenceKey2: string = "sequenceKey2";

        const sequenceByKey2: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        sequenceByKeySpy.and.returnValue(sequenceByKey2);

        graph.cacheSequence$(sequenceKey2).subscribe(() => { /*noop*/ });

        const result2: { [sequenceKey: string]: ISequence } = {};
        result2[sequenceKey2] = { key: sequenceKey2, keys: [] };
        sequenceByKey2.next(result2);
        sequenceByKey2.complete();

        expect(graph.hasSequence(sequenceKey2)).toBe(true);

        const sequence2: Sequence = graph.getSequence(sequenceKey2);

        const sequenceDisposeSpy2: jasmine.Spy = spyOn(sequence2, "dispose").and.stub();

        const time: number = new Date().getTime();
        while (new Date().getTime() === time) {
            graph.hasSequence(sequenceKey2);
        }

        graph.getSequence(sequenceKey2);

        graph.uncache([]);

        expect(sequenceDisposeSpy1.calls.count()).toBe(1);
        expect(graph.hasSequence(sequence1.key)).toBe(false);

        expect(sequenceDisposeSpy2.calls.count()).toBe(0);
        expect(graph.hasSequence(sequence2.key)).toBe(true);
    });

    it("should uncache node by uncaching tile", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.key)).toBe(true);

        const node: Node = graph.getNode(fullNode.key);

        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose");
        nodeDisposeSpy.and.stub();

        graph.uncache([]);

        expect(nodeDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.key)).toBe(false);
    });

    it("should not dispose node by uncaching tile if in specified sequence", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = "sequenceKey";
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.key)).toBe(true);

        const node: Node = graph.getNode(fullNode.key);

        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();
        const nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();

        graph.uncache([], fullNode.sequence_key);

        expect(nodeDisposeSpy.calls.count()).toBe(0);
        expect(nodeUncacheSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.key)).toBe(true);
    });

    it("should not uncache node by uncaching tile when number below threshold", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.key)).toBe(true);

        const node: Node = graph.getNode(fullNode.key);
        const nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.key)).toBe(true);
        expect(graph.hasTiles(fullNode.key)).toBe(true);
    });

    it("should not uncache and dispose node by uncaching tile when tile is related to kept key", () => {
        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();
        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const api: API = new API(dataProvider);
        const index: GeoRBush<any> = new GeoRBush(16);
        const calculator: GraphCalculator = new GraphCalculator(null);

        const h: string = "h";
        spyOn(geometryProvider, "latLonToCellId").and.returnValue(h);
        spyOn(geometryProvider, "latLonToCellIds").and.returnValue([h]);

        const imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(api, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const graph: Graph = new Graph(api, index, calculator, undefined, undefined, configuration);

        const fullNode: IFullNode = helper.createFullNode();
        const result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        const imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(api, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        const imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.key)).toBe(true);

        const node: Node = graph.getNode(fullNode.key);
        const nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        const nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([node.key]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.key)).toBe(true);
        expect(graph.hasTiles(fullNode.key)).toBe(true);
    });
});
