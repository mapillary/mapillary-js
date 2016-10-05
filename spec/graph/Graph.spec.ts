/// <reference path="../../typings/index.d.ts" />

import * as graphlib from "graphlib";
import * as rbush from "rbush";

import {Subject} from "rxjs/Subject";

import {APIv3, IFullNode} from "../../src/API";
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
        let graphLib: graphlib.Graph<any, any> = new graphlib.Graph<any, any>({});
        let calculator: GraphCalculator = new GraphCalculator(null);

        let graph: NewGraph = new NewGraph(apiV3, index, graphLib, calculator);

        expect(graph).toBeDefined();
    });
});

describe("Graph.fetch", () => {
    it("should be fetching", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let graphLib: graphlib.Graph<any, any> = new graphlib.Graph<any, any>({});
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = createFullNode();
        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();

        spyOn(apiV3, "imageByKeyFull").and.returnValue(imageByKeyFull);

        let graph: NewGraph = new NewGraph(apiV3, index, graphLib, calculator);
        graph.fetch(fullNode.key);

        expect(graph.fetching(fullNode.key)).toBe(true);
        expect(graph.hasNode(fullNode.key)).toBe(false);
        expect(graph.getNode(fullNode.key)).toBeUndefined();
    });

    it("should fetch", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let graphLib: graphlib.Graph<any, any> = new graphlib.Graph<any, any>({});
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull").and.returnValue(imageByKeyFull);

        let graph: NewGraph = new NewGraph(apiV3, index, graphLib, calculator);

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
        let graphLib: graphlib.Graph<any, any> = new graphlib.Graph<any, any>({});
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = createFullNode();
        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();

        spyOn(apiV3, "imageByKeyFull").and.returnValue(imageByKeyFull);

        let graph: NewGraph = new NewGraph(apiV3, index, graphLib, calculator);

        graph.fetch(fullNode.key);
        expect(() => { graph.fetch(fullNode.key); }).toThrowError(Error);
    });

    it("should throw when fetching node already in graph", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: rbush.RBush<any> = rbush<any>(16, [".lon", ".lat", ".lon", ".lat"]);
        let graphLib: graphlib.Graph<any, any> = new graphlib.Graph<any, any>({});
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull").and.returnValue(imageByKeyFull);

        let graph: NewGraph = new NewGraph(apiV3, index, graphLib, calculator);

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
