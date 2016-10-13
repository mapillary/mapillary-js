/// <reference path="../../typings/index.d.ts" />

import * as rbush from "rbush";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {APIv3, ICoreNode, IFillNode, IFullNode} from "../../src/API";
import {EdgeCalculator} from "../../src/Edge";
import {GraphCalculator, NewGraph, NewNode} from "../../src/Graph";

let createCoreNode: () => ICoreNode = (): ICoreNode => {
    return {
        ca: 0,
        cca: 0,
        cl: { lat: 0, lon: 0 },
        key: "key",
        l: { lat: 0, lon: 0},
        sequence: { key: "skey" },
    };
};

let createFullNode: () => IFullNode = (): IFullNode => {
    return {
        atomic_scale: 0,
        c_rotation: [0, 0, 0],
        ca: 0,
        calt: 0,
        captured_at: 0,
        cca: 0,
        cfocal: 0,
        cl: { lat: 0, lon: 0 },
        gpano: null,
        height: 0,
        key: "key",
        l: { lat: 0, lon: 0},
        merge_cc: 0,
        merge_version: 0,
        orientation: 0,
        sequence: { key: "skey" },
        user: { key: "ukey", username: "username" },
        width: 0,
    };
};

describe("Graph.ctor", () => {
    it("should create a graph", () => {
        let apiV3: APIv3 = new APIv3("clientId");

        let graph: NewGraph = new NewGraph(apiV3);

        expect(graph).toBeDefined();
    });

    it("should create a graph with all ctor params", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        expect(graph).toBeDefined();
    });
});

describe("Graph.fetch", () => {
    it("should be fetching", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = createFullNode();
        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();

        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);
        graph.fetch$(fullNode.key);

        expect(graph.fetching(fullNode.key)).toBe(true);
        expect(graph.hasNode(fullNode.key)).toBe(false);
        expect(graph.getNode(fullNode.key)).toBeUndefined();
    });

    it("should fetch", (done) => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        let fullNode: IFullNode = createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.fetch$(fullNode.key)
            .subscribe(
                (g: NewGraph): void => {
                    expect(g.fetching(fullNode.key)).toBe(false);
                    expect(g.hasNode(fullNode.key)).toBe(true);
                    expect(g.getNode(fullNode.key)).toBeDefined();
                    expect(g.getNode(fullNode.key).key).toBe(fullNode.key);

                    done();
                });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.fetching(fullNode.key)).toBe(false);
        expect(graph.hasNode(fullNode.key)).toBe(true);
        expect(graph.getNode(fullNode.key)).toBeDefined();
        expect(graph.getNode(fullNode.key).key).toBe(fullNode.key);
    });

    it("should not make additional calls when fetching same node twice", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = createFullNode();
        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();

        let imageByKeyFullSpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFull$");
        imageByKeyFullSpy.and.returnValue(imageByKeyFull);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        graph.fetch$(fullNode.key).subscribe();
        graph.fetch$(fullNode.key).subscribe();

        expect(imageByKeyFullSpy.calls.count()).toBe(1);
    });

    it("should throw when fetching node already in graph", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        let fullNode: IFullNode = createFullNode();

        graph.fetch$(fullNode.key).subscribe();

        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.fetching(fullNode.key)).toBe(false);
        expect(() => { graph.fetch$(fullNode.key); }).toThrowError(Error);
    });

    it("should make full when fetched node has been retrieved in tile in parallell", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let key: string = "key";
        let otherKey: string = "otherKey";
        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        let imageByKeyFullOther: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.callFake(
            (keys: string[]): Observable<{ [key: string]: IFullNode }> => {
                if (keys[0] === key) {
                    return imageByKeyFull;
                } else if (keys[0] === otherKey) {
                    return imageByKeyFullOther;
                }

                throw new Error("Wrong key.");
            });

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
        new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        let otherNode: IFullNode = createFullNode();
        otherNode.key = otherKey;
        graph.fetch$(otherNode.key).subscribe();

        let otherFullResult: { [key: string]: IFullNode } = {};
        otherFullResult[otherNode.key] = otherNode;
        imageByKeyFullOther.next(otherFullResult);
        imageByKeyFullOther.complete();

        graph.tilesCached(otherNode.key);
        graph.cacheTiles(otherNode.key);

        let fullNode: IFullNode = createFullNode();
        fullNode.key = key;
        graph.fetch$(fullNode.key).subscribe();

        expect(graph.hasNode(fullNode.key)).toBe(false);
        expect(graph.fetching(fullNode.key)).toBe(true);

        let tileResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        tileResult[h] = {};
        tileResult[h]["0"] = otherNode;
        tileResult[h]["1"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);
        expect(graph.getNode(fullNode.key).full).toBe(false);

        let fullResult: { [key: string]: IFullNode } = {};
        fullResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fullResult);
        imageByKeyFull.complete();

        expect(graph.getNode(fullNode.key).full).toBe(true);
    });
});

describe("Graph.fill", () => {
    it("should be filling", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(apiV3, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        let fullNode: IFullNode = createFullNode();
        graph.fetch$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.tilesCached(fullNode.key);
        graph.cacheTiles(fullNode.key);

        let tileNode: ICoreNode = createCoreNode();
        tileNode.key = "tileNodeKey";
        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = tileNode;
        imagesByH.next(result);

        expect(graph.getNode(tileNode.key).full).toBe(false);
        expect(graph.filling(tileNode.key)).toBe(false);

        graph.fill$(tileNode.key).subscribe();

        expect(graph.getNode(tileNode.key).full).toBe(false);
        expect(graph.filling(tileNode.key)).toBe(true);
    });

    it("should fill", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(apiV3, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        let fullNode: IFullNode = createFullNode();
        graph.fetch$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.tilesCached(fullNode.key);
        graph.cacheTiles(fullNode.key);

        let tileNode: ICoreNode = createCoreNode();
        tileNode.key = "tileNodeKey";
        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = tileNode;
        imagesByH.next(result);

        expect(graph.getNode(tileNode.key).full).toBe(false);
        expect(graph.filling(tileNode.key)).toBe(false);

        graph.fill$(tileNode.key).subscribe();

        let fillTileNode: IFillNode = createFullNode();
        let fillResult: { [key: string]: IFillNode } = {};
        fillResult[tileNode.key] = fillTileNode;
        imageByKeyFill.next(fillResult);

        expect(graph.getNode(tileNode.key).full).toBe(true);
        expect(graph.filling(tileNode.key)).toBe(false);
    });

    it("should not make additional calls when filling same node twice", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        let imageByKeyFillSpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFill$");
        imageByKeyFillSpy.and.returnValue(imageByKeyFill);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        let fullNode: IFullNode = createFullNode();
        graph.fetch$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.tilesCached(fullNode.key);
        graph.cacheTiles(fullNode.key);

        let tileNode: ICoreNode = createCoreNode();
        tileNode.key = "tileNodeKey";
        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = tileNode;
        imagesByH.next(result);

        expect(graph.getNode(tileNode.key).full).toBe(false);
        expect(graph.filling(tileNode.key)).toBe(false);

        graph.fill$(tileNode.key).subscribe();
        graph.fill$(tileNode.key).subscribe();

        expect(imageByKeyFillSpy.calls.count()).toBe(1);
    });

    it("should throw if already fetching", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        let fullNode: IFullNode = createFullNode();
        graph.fetch$(fullNode.key);

        expect(graph.fetching(fullNode.key)).toBe(true);

        expect(() => { graph.fill$(fullNode.key); }).toThrowError(Error);
    });

    it("should throw if node does not exist", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(apiV3, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        expect(() => { graph.fill$("key"); }).toThrowError(Error);
    });

    it("should throw if already full", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(apiV3, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        let fullNode: IFullNode = createFullNode();
        graph.fetch$(fullNode.key);

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        expect(() => { graph.fill$(fullNode.key); }).toThrowError(Error);
    });
});

describe("Graph.cacheTiles", () => {
    it("should be caching tiles", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = createFullNode();

        spyOn(calculator, "encodeHs").and.returnValue(["h"]);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        spyOn(graph, "hasNode").and.returnValue(true);
        spyOn(graph, "getNode").and.returnValue(fullNode);

        expect(graph.tilesCached(fullNode.key)).toBe(false);
        expect(graph.cachingTiles(fullNode.key)).toBe(false);

        graph.cacheTiles(fullNode.key);

        expect(graph.tilesCached(fullNode.key)).toBe(false);
        expect(graph.cachingTiles(fullNode.key)).toBe(true);
    });

    it("should cache tiles", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = createFullNode();

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imageByKeyResult: { [key: string]: IFullNode } = {};
        imageByKeyResult[fullNode.key] = fullNode;
        let imageByKeyFull: Observable<{ [key: string]: IFullNode }> = Observable.of<{ [key: string]: IFullNode }>(imageByKeyResult);
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);
        graph.fetch$(fullNode.key).subscribe();

        expect(graph.tilesCached(fullNode.key)).toBe(false);
        expect(graph.cachingTiles(fullNode.key)).toBe(false);

        graph.cacheTiles(fullNode.key);

        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = fullNode;
        imagesByH.next(result);

        expect(graph.tilesCached(fullNode.key)).toBe(true);
        expect(graph.cachingTiles(fullNode.key)).toBe(false);
    });

    it("should encode hs only once when checking tiles cache", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = createFullNode();

        let h: string = "h";
        let encodeHsSpy: jasmine.Spy = spyOn(calculator, "encodeHs");
        encodeHsSpy.and.returnValue([h]);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        spyOn(graph, "hasNode").and.returnValue(true);
        spyOn(graph, "getNode").and.returnValue(fullNode);

        expect(graph.tilesCached(fullNode.key)).toBe(false);
        expect(graph.tilesCached(fullNode.key)).toBe(false);

        expect(encodeHsSpy.calls.count()).toBe(1);
    });


    it("should encode hs only once when caching tiles", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = createFullNode();

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        let encodeHsSpy: jasmine.Spy = spyOn(calculator, "encodeHs");
        encodeHsSpy.and.returnValue([h]);

        let imageByKeyResult: { [key: string]: IFullNode } = {};
        imageByKeyResult[fullNode.key] = fullNode;
        let imageByKeyFull: Observable<{ [key: string]: IFullNode }> = Observable.of<{ [key: string]: IFullNode }>(imageByKeyResult);
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);
        graph.fetch$(fullNode.key).subscribe();

        expect(graph.tilesCached(fullNode.key)).toBe(false);

        graph.cacheTiles(fullNode.key);

        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = fullNode;
        imagesByH.next(result);

        expect(graph.tilesCached(fullNode.key)).toBe(true);

        expect(encodeHsSpy.calls.count()).toBe(1);
    });
});

describe("Graph.cacheSpatialNodes", () => {
    it("should be cached", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let graphCalculator: GraphCalculator = new GraphCalculator(null);
        let edgeCalculator: EdgeCalculator = new EdgeCalculator();

        let fullNode: IFullNode = createFullNode();

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: NewGraph = new NewGraph(apiV3, index, graphCalculator, edgeCalculator);
        graph.fetch$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        let node: NewNode = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        spyOn(index, "search").and.returnValue([{ node: node }]);

        expect(graph.spatialNodesCached(fullNode.key)).toBe(true);
    });

    it("should not be cached", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let graphCalculator: GraphCalculator = new GraphCalculator(null);
        let edgeCalculator: EdgeCalculator = new EdgeCalculator();

        let fullNode: IFullNode = createFullNode();

        let h: string = "h";
        spyOn(graphCalculator, "encodeH").and.returnValue(h);
        spyOn(graphCalculator, "encodeHs").and.returnValue([h]);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: NewGraph = new NewGraph(apiV3, index, graphCalculator, edgeCalculator);
        graph.fetch$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        let node: NewNode = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        let coreNode: ICoreNode = createCoreNode();
        coreNode.key = "otherKey";

        graph.tilesCached(fullNode.key);
        graph.cacheTiles(fullNode.key);

        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = fullNode;
        result[h]["1"] = coreNode;
        imagesByH.next(result);

        let otherNode: NewNode = graph.getNode(coreNode.key);

        spyOn(index, "search").and.returnValue([{ node: node }, {node: otherNode }]);

        expect(graph.spatialNodesCached(fullNode.key)).toBe(false);
    });
});
