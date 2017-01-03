/// <reference path="../../typings/index.d.ts" />

import * as rbush from "rbush";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/operator/mergeAll";

import {NodeHelper} from "../helper/NodeHelper.spec";

import {
    APIv3,
    ICoreNode,
    IFillNode,
    IFullNode,
    ISequence,
} from "../../src/API";
import {EdgeCalculator} from "../../src/Edge";
import {GraphMapillaryError} from "../../src/Error";
import {
    GraphCalculator,
    Graph,
    Node,
} from "../../src/Graph";

describe("Graph.ctor", () => {
    it("should create a graph", () => {
        let apiV3: APIv3 = new APIv3("clientId");

        let graph: Graph = new Graph(apiV3);

        expect(graph).toBeDefined();
    });

    it("should create a graph with all ctor params", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let graph: Graph = new Graph(apiV3, index, calculator);

        expect(graph).toBeDefined();
    });
});

describe("Graph.cacheFull$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should be fetching", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = helper.createFullNode();
        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();

        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);
        graph.cacheFull$(fullNode.key);

        expect(graph.isCachingFull(fullNode.key)).toBe(true);
        expect(graph.hasNode(fullNode.key)).toBe(false);
        expect(graph.getNode(fullNode.key)).toBeUndefined();
    });

    it("should fetch", (done: Function) => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
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
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = helper.createFullNode();
        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();

        let imageByKeyFullSpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFull$");
        imageByKeyFullSpy.and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        graph.cacheFull$(fullNode.key).subscribe();
        graph.cacheFull$(fullNode.key).subscribe();

        expect(imageByKeyFullSpy.calls.count()).toBe(1);
    });

    it("should throw when fetching node already in graph", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();

        graph.cacheFull$(fullNode.key).subscribe();

        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.isCachingFull(fullNode.key)).toBe(false);
        expect(() => { graph.cacheFull$(fullNode.key); }).toThrowError(Error);
    });

    it("should throw if sequence key is missing", (done: Function) => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence.key = undefined;

        graph.cacheFull$(fullNode.key)
            .subscribe(
                (g: Graph): void => { return; },
                (e: GraphMapillaryError): void => {
                    done();
                });

        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        imageByKeyFull.next(result);
        imageByKeyFull.complete();
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

                throw new GraphMapillaryError("Wrong key.");
            });

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
        new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let otherNode: IFullNode = helper.createFullNode();
        otherNode.key = otherKey;
        graph.cacheFull$(otherNode.key).subscribe();

        let otherFullResult: { [key: string]: IFullNode } = {};
        otherFullResult[otherNode.key] = otherNode;
        imageByKeyFullOther.next(otherFullResult);
        imageByKeyFullOther.complete();

        graph.hasTiles(otherNode.key);
        Observable
            .from<Observable<Graph>>(graph.cacheTiles$(otherNode.key))
            .mergeAll()
            .subscribe();

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.key = key;
        graph.cacheFull$(fullNode.key).subscribe();

        expect(graph.hasNode(fullNode.key)).toBe(false);
        expect(graph.isCachingFull(fullNode.key)).toBe(true);

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

describe("Graph.cacheFill$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

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

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.hasTiles(fullNode.key);
        Observable
            .from<Observable<Graph>>(graph.cacheTiles$(fullNode.key))
            .mergeAll()
            .subscribe();

        let tileNode: ICoreNode = helper.createCoreNode();
        tileNode.key = "tileNodeKey";
        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = tileNode;
        imagesByH.next(result);

        expect(graph.getNode(tileNode.key).full).toBe(false);
        expect(graph.isCachingFill(tileNode.key)).toBe(false);

        graph.cacheFill$(tileNode.key).subscribe();

        expect(graph.getNode(tileNode.key).full).toBe(false);
        expect(graph.isCachingFill(tileNode.key)).toBe(true);
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

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.hasTiles(fullNode.key);
        Observable
            .from<Observable<Graph>>(graph.cacheTiles$(fullNode.key))
            .mergeAll()
            .subscribe();

        let tileNode: ICoreNode = helper.createCoreNode();
        tileNode.key = "tileNodeKey";
        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = tileNode;
        imagesByH.next(result);

        expect(graph.getNode(tileNode.key).full).toBe(false);
        expect(graph.isCachingFill(tileNode.key)).toBe(false);

        graph.cacheFill$(tileNode.key).subscribe();

        let fillTileNode: IFillNode = helper.createFullNode();
        let fillResult: { [key: string]: IFillNode } = {};
        fillResult[tileNode.key] = fillTileNode;
        imageByKeyFill.next(fillResult);

        expect(graph.getNode(tileNode.key).full).toBe(true);
        expect(graph.isCachingFill(tileNode.key)).toBe(false);
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

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.hasTiles(fullNode.key);
        Observable
            .from<Observable<Graph>>(graph.cacheTiles$(fullNode.key))
            .mergeAll()
            .subscribe();

        let tileNode: ICoreNode = helper.createCoreNode();
        tileNode.key = "tileNodeKey";
        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = tileNode;
        imagesByH.next(result);

        expect(graph.getNode(tileNode.key).full).toBe(false);
        expect(graph.isCachingFill(tileNode.key)).toBe(false);

        graph.cacheFill$(tileNode.key).subscribe();
        graph.cacheFill$(tileNode.key).subscribe();

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

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.key);

        expect(graph.isCachingFull(fullNode.key)).toBe(true);

        expect(() => { graph.cacheFill$(fullNode.key); }).toThrowError(Error);
    });

    it("should throw if node does not exist", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(apiV3, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        let graph: Graph = new Graph(apiV3, index, calculator);

        expect(() => { graph.cacheFill$("key"); }).toThrowError(Error);
    });

    it("should throw if already full", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(apiV3, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        graph.cacheFull$(fullNode.key);

        let fetchResult: { [key: string]: IFullNode } = {};
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
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = helper.createFullNode();

        spyOn(calculator, "encodeHs").and.returnValue(["h"]);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: Graph = new Graph(apiV3, index, calculator);

        spyOn(graph, "hasNode").and.returnValue(true);
        spyOn(graph, "getNode").and.returnValue(fullNode);

        expect(graph.hasTiles(fullNode.key)).toBe(false);
        expect(graph.isCachingTiles(fullNode.key)).toBe(false);

        graph.cacheTiles$(fullNode.key);

        expect(graph.hasTiles(fullNode.key)).toBe(false);
        expect(graph.isCachingTiles(fullNode.key)).toBe(true);
    });

    it("should cache tiles", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = helper.createFullNode();

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

        let graph: Graph = new Graph(apiV3, index, calculator);
        graph.cacheFull$(fullNode.key).subscribe();

        expect(graph.hasTiles(fullNode.key)).toBe(false);
        expect(graph.isCachingTiles(fullNode.key)).toBe(false);

        Observable
            .from<Observable<Graph>>(graph.cacheTiles$(fullNode.key))
            .mergeAll()
            .subscribe();

        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = fullNode;
        imagesByH.next(result);

        expect(graph.hasTiles(fullNode.key)).toBe(true);
        expect(graph.isCachingTiles(fullNode.key)).toBe(false);
    });

    it("should encode hs only once when checking tiles cache", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = helper.createFullNode();

        let h: string = "h";
        let encodeHsSpy: jasmine.Spy = spyOn(calculator, "encodeHs");
        encodeHsSpy.and.returnValue([h]);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: Graph = new Graph(apiV3, index, calculator);

        spyOn(graph, "hasNode").and.returnValue(true);
        spyOn(graph, "getNode").and.returnValue(fullNode);

        expect(graph.hasTiles(fullNode.key)).toBe(false);
        expect(graph.hasTiles(fullNode.key)).toBe(false);

        expect(encodeHsSpy.calls.count()).toBe(1);
    });


    it("should encode hs only once when caching tiles", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = helper.createFullNode();

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

        let graph: Graph = new Graph(apiV3, index, calculator);
        graph.cacheFull$(fullNode.key).subscribe();

        expect(graph.hasTiles(fullNode.key)).toBe(false);

        Observable
            .from<Observable<Graph>>(graph.cacheTiles$(fullNode.key))
            .mergeAll()
            .subscribe();

        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = fullNode;
        imagesByH.next(result);

        expect(graph.hasTiles(fullNode.key)).toBe(true);

        expect(encodeHsSpy.calls.count()).toBe(1);
    });
});

describe("Graph.cacheSpatialArea$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should be cached", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let graphCalculator: GraphCalculator = new GraphCalculator(null);
        let edgeCalculator: EdgeCalculator = new EdgeCalculator();

        let fullNode: IFullNode = helper.createFullNode();

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        let node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        spyOn(index, "search").and.returnValue([{ node: node }]);

        expect(graph.hasSpatialArea(fullNode.key)).toBe(true);
    });

    it("should not be cached", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let graphCalculator: GraphCalculator = new GraphCalculator(null);
        let edgeCalculator: EdgeCalculator = new EdgeCalculator();

        let fullNode: IFullNode = helper.createFullNode();

        let h: string = "h";
        spyOn(graphCalculator, "encodeH").and.returnValue(h);
        spyOn(graphCalculator, "encodeHs").and.returnValue([h]);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        let node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        let coreNode: ICoreNode = helper.createCoreNode();
        coreNode.key = "otherKey";

        graph.hasTiles(fullNode.key);
        Observable
            .from<Observable<Graph>>(graph.cacheTiles$(fullNode.key))
            .mergeAll()
            .subscribe();

        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = fullNode;
        result[h]["1"] = coreNode;
        imagesByH.next(result);

        let otherNode: Node = graph.getNode(coreNode.key);

        spyOn(index, "search").and.returnValue([{ node: node }, {node: otherNode }]);

        expect(graph.hasSpatialArea(fullNode.key)).toBe(false);
    });
});

describe("Graph.cacheSpatialEdges", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should use fallback keys", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let graphCalculator: GraphCalculator = new GraphCalculator(null);
        let edgeCalculator: EdgeCalculator = new EdgeCalculator();

        let fullNode: IFullNode = helper.createFullNode();

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe();

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence.key] = { key: fullNode.sequence.key, keys: ["prev", fullNode.key, "next"] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        let node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        spyOn(index, "search").and.returnValue([{ node: node }]);

        expect(graph.hasSpatialArea(fullNode.key)).toBe(true);

        let getPotentialSpy: jasmine.Spy = spyOn(edgeCalculator, "getPotentialEdges");
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
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let graphCalculator: GraphCalculator = new GraphCalculator(null);
        let edgeCalculator: EdgeCalculator = new EdgeCalculator();

        let fullNode: IFullNode = helper.createFullNode();

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe();

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence.key] = { key: fullNode.sequence.key, keys: ["prev", fullNode.key, "next"] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        let node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        let otherFullNode: IFullNode = helper.createFullNode();
        otherFullNode.sequence.key = "otherSequenceKey";
        let otherNode: Node = new Node(otherFullNode);
        otherNode.makeFull(otherFullNode);

        spyOn(index, "search").and.returnValue([{ node: node }, { node: otherNode }]);

        expect(graph.hasSpatialArea(fullNode.key)).toBe(true);

        let getPotentialSpy: jasmine.Spy = spyOn(edgeCalculator, "getPotentialEdges");
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
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let graphCalculator: GraphCalculator = new GraphCalculator(null);
        let edgeCalculator: EdgeCalculator = new EdgeCalculator();

        let fullNode: IFullNode = helper.createFullNode();

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe();

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence.key] = { key: fullNode.sequence.key, keys: ["prev", fullNode.key, "next"] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        let node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        let otherFullNode: IFullNode = helper.createFullNode();
        otherFullNode.sequence.key = "otherSequenceKey";
        let otherNode: Node = new Node(otherFullNode);
        otherNode.makeFull(otherFullNode);

        spyOn(index, "search").and.returnValue([{ node: node }, { node: otherNode }]);

        expect(graph.hasSpatialArea(fullNode.key)).toBe(true);

        let getPotentialSpy: jasmine.Spy = spyOn(edgeCalculator, "getPotentialEdges");
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
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();

        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        expect(graph.hasNodeSequence(fullNode.key)).toBe(false);
    });

    it("should be caching", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();

        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key);

        expect(graph.hasNodeSequence(fullNode.key)).toBe(false);
        expect(graph.isCachingNodeSequence(fullNode.key)).toBe(true);
    });

    it("should be cached", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence.key = "sequenceKey";

        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.cacheNodeSequence$(fullNode.key)
            .subscribe(
                (g: Graph): void => {
                    expect(g.hasNodeSequence(fullNode.key)).toBe(true);
                    expect(g.isCachingNodeSequence(fullNode.key)).toBe(false);
                });

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence.key] = { key: fullNode.sequence.key, keys: [fullNode.key] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasNodeSequence(fullNode.key)).toBe(true);
        expect(graph.isCachingNodeSequence(fullNode.key)).toBe(false);
    });

    it("should throw if node not in graph", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence.key = "sequenceKey";

        expect(() => { graph.cacheNodeSequence$(fullNode.key); }).toThrowError(Error);
    });

    it("should throw if already cached", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence.key = "sequenceKey";

        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.cacheNodeSequence$(fullNode.key).subscribe();

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence.key] = { key: fullNode.sequence.key, keys: [fullNode.key] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasNodeSequence(fullNode.key)).toBe(true);

        expect(() => { graph.cacheNodeSequence$(fullNode.key); }).toThrowError(Error);
    });

    it("should call api only once when caching the same sequence twice in succession", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        let sequenceByKeySpy: jasmine.Spy = spyOn(apiV3, "sequenceByKey$");
        sequenceByKeySpy.and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence.key = "sequenceKey";

        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.cacheNodeSequence$(fullNode.key).subscribe();
        graph.cacheNodeSequence$(fullNode.key).subscribe();

        expect(sequenceByKeySpy.calls.count()).toBe(1);
    });

    it("should emit to changed stream", (done: Function) => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence.key = "sequenceKey";

        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.cacheNodeSequence$(fullNode.key).subscribe();

        graph.changed$
            .first()
            .subscribe(
                (g: Graph): void => {
                    expect(g.hasNodeSequence(fullNode.key)).toBe(true);
                    expect(g.isCachingNodeSequence(fullNode.key)).toBe(false);

                    done();
                });

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence.key] = { key: fullNode.sequence.key, keys: [fullNode.key] };
        sequenceByKey.next(result);
        sequenceByKey.complete();
    });
});

describe("Graph.cacheSequence$", () => {
    it("should not be cached", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let sequenceKey: string = "sequenceKey";

        expect(graph.hasSequence(sequenceKey)).toBe(false);
    });

    it("should not be caching", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let sequenceKey: string = "sequenceKey";

        expect(graph.isCachingSequence(sequenceKey)).toBe(false);
    });

    it("should be caching", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let sequenceKey: string = "sequenceKey";

        graph.cacheSequence$(sequenceKey).subscribe();

        expect(graph.hasSequence(sequenceKey)).toBe(false);
        expect(graph.isCachingSequence(sequenceKey)).toBe(true);
    });

    it("should cache", (done: Function) => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let sequenceKey: string = "sequenceKey";
        let key: string = "key";

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

        let result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [key] };
        sequenceByKey.next(result);
        sequenceByKey.complete();
    });

    it("should call api only once when caching the same sequence twice in succession", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        let sequenceByKeySpy: jasmine.Spy = spyOn(apiV3, "sequenceByKey$");
        sequenceByKeySpy.and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let sequenceKey: string = "sequenceKey";

        graph.cacheSequence$(sequenceKey).subscribe();
        graph.cacheSequence$(sequenceKey).subscribe();

        expect(sequenceByKeySpy.calls.count()).toBe(1);
    });
});

describe("Graph.resetSpatialEdges", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should use fallback keys", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let graphCalculator: GraphCalculator = new GraphCalculator(null);
        let edgeCalculator: EdgeCalculator = new EdgeCalculator();

        let fullNode: IFullNode = helper.createFullNode();

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe();

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence.key] = { key: fullNode.sequence.key, keys: ["prev", fullNode.key, "next"] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        let node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        let searchSpy: jasmine.Spy =  spyOn(index, "search");
        searchSpy.and.returnValue([{ node: node }]);

        expect(graph.hasSpatialArea(fullNode.key)).toBe(true);

        let getPotentialSpy: jasmine.Spy = spyOn(edgeCalculator, "getPotentialEdges");
        getPotentialSpy.and.returnValue([]);

        spyOn(edgeCalculator, "computeStepEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeTurnEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePanoEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePerspectiveToPanoEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSimilarEdges").and.returnValue([]);

        graph.initializeCache(fullNode.key);
        graph.cacheSpatialEdges(fullNode.key);

        let nodeSequenceResetSpy: jasmine.Spy = spyOn(node, "resetSequenceEdges").and.stub();
        let nodeSpatialResetSpy: jasmine.Spy = spyOn(node, "resetSpatialEdges").and.stub();

        graph.resetSpatialEdges();

        expect(nodeSequenceResetSpy.calls.count()).toBe(0);
        expect(nodeSpatialResetSpy.calls.count()).toBe(1);

        let countBefore: number = searchSpy.calls.count();
        expect(graph.hasSpatialArea(fullNode.key)).toBe(true);
        let countAfter: number = searchSpy.calls.count();

        expect(countAfter - countBefore).toBe(1);
    });

    it("should have to re-encode hs after spatial edges reset", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let graphCalculator: GraphCalculator = new GraphCalculator(null);
        let edgeCalculator: EdgeCalculator = new EdgeCalculator();

        let h: string = "h";
        spyOn(graphCalculator, "encodeH").and.returnValue(h);
        let encodeHsSpy: jasmine.Spy = spyOn(graphCalculator, "encodeHs");
        encodeHsSpy.and.returnValue([h]);

        let fullNode: IFullNode = helper.createFullNode();

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe();

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe();

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence.key] = { key: fullNode.sequence.key, keys: ["prev", fullNode.key, "next"] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasTiles(fullNode.key)).toBe(false);
        expect(graph.isCachingTiles(fullNode.key)).toBe(false);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
        new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        Observable
            .from<Observable<Graph>>(graph.cacheTiles$(fullNode.key))
            .mergeAll()
            .subscribe();

        let imagesByHresult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHresult[h] = {};
        imagesByHresult[h]["0"] = fullNode;
        imagesByH.next(imagesByHresult);

        expect(graph.hasTiles(fullNode.key)).toBe(true);
        expect(graph.isCachingTiles(fullNode.key)).toBe(false);

        let node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        spyOn(index, "search").and.returnValue([{ node: node }]);

        expect(graph.hasSpatialArea(fullNode.key)).toBe(true);

        let getPotentialSpy: jasmine.Spy = spyOn(edgeCalculator, "getPotentialEdges");
        getPotentialSpy.and.returnValue([]);

        spyOn(edgeCalculator, "computeStepEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeTurnEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePanoEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computePerspectiveToPanoEdges").and.returnValue([]);
        spyOn(edgeCalculator, "computeSimilarEdges").and.returnValue([]);

        graph.initializeCache(fullNode.key);
        graph.cacheSpatialEdges(fullNode.key);

        let nodeSequenceResetSpy: jasmine.Spy = spyOn(node, "resetSequenceEdges").and.stub();
        let nodeSpatialResetSpy: jasmine.Spy = spyOn(node, "resetSpatialEdges").and.stub();

        graph.resetSpatialEdges();

        expect(nodeSequenceResetSpy.calls.count()).toBe(0);
        expect(nodeSpatialResetSpy.calls.count()).toBe(1);

        let countBefore: number = encodeHsSpy.calls.count();
        expect(graph.hasTiles(fullNode.key)).toBe(true);
        let countAfter: number = encodeHsSpy.calls.count();

        expect(countAfter - countBefore).toBe(1);

    });
});

describe("Graph.reset", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should remove node", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe();

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        let node: Node = graph.getNode(fullNode.key);

        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose");
        nodeDisposeSpy.and.stub();

        graph.reset([]);

        expect(nodeDisposeSpy.calls.count()).toBe(0);
        expect(graph.hasNode(node.key)).toBe(false);
    });

    it("should dispose cache initialized node", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe();

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        let node: Node = graph.getNode(fullNode.key);
        graph.initializeCache(node.key);

        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose");
        nodeDisposeSpy.and.stub();

        graph.reset([]);

        expect(nodeDisposeSpy.calls.count()).toBe(1);
        expect(graph.hasNode(node.key)).toBe(false);
    });

    it("should keep supplied node", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe();

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        let node: Node = graph.getNode(fullNode.key);
        graph.initializeCache(node.key);

        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose");
        nodeDisposeSpy.and.stub();
        let nodeResetSequenceSpy: jasmine.Spy = spyOn(node, "resetSequenceEdges");
        nodeResetSequenceSpy.and.stub();
        let nodeResetSpatialSpy: jasmine.Spy = spyOn(node, "resetSpatialEdges");
        nodeResetSpatialSpy.and.stub();

        graph.reset([node.key]);

        expect(nodeDisposeSpy.calls.count()).toBe(0);
        expect(nodeResetSequenceSpy.calls.count()).toBe(1);
        expect(nodeResetSpatialSpy.calls.count()).toBe(1);
        expect(graph.hasNode(node.key)).toBe(true);
    });
});
