/// <reference path="../../typings/index.d.ts" />

import * as rbush from "rbush";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {APIv3, ICoreNode, IFullNode} from "../../src/API";
import {GraphCalculator, NewGraph} from "../../src/Graph";

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
        graph.fetch(fullNode.key);

        expect(graph.fetching(fullNode.key)).toBe(true);
        expect(graph.hasNode(fullNode.key)).toBe(false);
        expect(graph.getNode(fullNode.key)).toBeUndefined();
    });

    it("should fetch", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        let fullNode: IFullNode = createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.fetch(fullNode.key);

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.fetching(fullNode.key)).toBe(false);
        expect(graph.hasNode(fullNode.key)).toBe(true);
        expect(graph.getNode(fullNode.key)).toBeDefined();
        expect(graph.getNode(fullNode.key).key).toBe(fullNode.key);
    });

    it("should throw when fetching same node twice", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = createFullNode();
        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();

        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        graph.fetch(fullNode.key);
        expect(() => { graph.fetch(fullNode.key); }).toThrowError(Error);
    });

    it("should throw when fetching node already in graph", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: NewGraph = new NewGraph(apiV3, index, calculator);

        let fullNode: IFullNode = createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.fetch(fullNode.key);

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.fetching(fullNode.key)).toBe(false);
        expect(() => { graph.fetch(fullNode.key); }).toThrowError(Error);
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
        graph.fetch(fullNode.key);

        expect(graph.tilesCached(fullNode.key)).toBe(false);
        expect(graph.cachingTiles(fullNode.key)).toBe(false);

        graph.cacheTiles(fullNode.key);

        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h][fullNode.key] = fullNode;
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
        graph.fetch(fullNode.key);

        expect(graph.tilesCached(fullNode.key)).toBe(false);

        graph.cacheTiles(fullNode.key);

        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h][fullNode.key] = fullNode;
        imagesByH.next(result);

        expect(graph.tilesCached(fullNode.key)).toBe(true);

        expect(encodeHsSpy.calls.count()).toBe(1);
    });
});
