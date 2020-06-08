import {from as observableFrom, of as observableOf, merge as observableMerge, Observable, Subject} from "rxjs";

import {first, mergeAll} from "rxjs/operators";

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
import {GeoRBush} from "../../src/Geo";
import {
    GraphCalculator,
    Graph,
    IGraphConfiguration,
    Node,
    Sequence,
} from "../../src/Graph";

describe("Graph.ctor", () => {
    it("should create a graph", () => {
        let apiV3: APIv3 = new APIv3("clientId");

        let graph: Graph = new Graph(apiV3);

        expect(graph).toBeDefined();
    });

    it("should create a graph with all ctor params", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let graph: Graph = new Graph(apiV3, index, calculator);

        expect(graph).toBeDefined();
    });
});

describe("Graph.cacheBoundingBox$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should cache one node in the bounding box", (done: Function) => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeHsFromBoundingBox").and.returnValue([h]);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
        new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let key: string = "key";
        let imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(apiV3, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.key = key;
        fullNode.l.lat = 0.5;
        fullNode.l.lon = 0.5;

        let graph: Graph = new Graph(apiV3, index, calculator);

        graph.cacheBoundingBox$({ lat: 0, lon: 0 }, { lat: 1, lon: 1 })
            .subscribe(
                (nodes: Node[]): void => {
                    expect(nodes.length).toBe(1);
                    expect(nodes[0].key).toBe(fullNode.key);
                    expect(nodes[0].full).toBe(true);

                    expect(graph.hasNode(key)).toBe(true);

                    done();
                });

        let tileResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        tileResult[h] = {};
        tileResult[h]["0"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        let fillResult: { [key: string]: IFillNode } = {};
        fillResult[key] = fullNode;
        imageByKeyFill.next(fillResult);
        imageByKeyFill.complete();
    });

    it("should not cache tile of fill node if already cached", (done: Function) => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeHsFromBoundingBox").and.returnValue([h]);
        spyOn(calculator, "encodeHs").and.returnValue([h]);
        spyOn(calculator, "encodeH").and.returnValue(h);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
        new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        const imagesByHSpy: jasmine.Spy = spyOn(apiV3, "imagesByH$");
        imagesByHSpy.and.returnValue(imagesByH);

        let key: string = "key";
        let imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        const imageByKeyFillSpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFill$");
        imageByKeyFillSpy.and.returnValue(imageByKeyFill);

        let imageByKeyFull: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        const imageByKeyFullSpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFull$");
        imageByKeyFullSpy.and.returnValue(imageByKeyFull);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.key = key;
        fullNode.l.lat = 0.5;
        fullNode.l.lon = 0.5;

        let graph: Graph = new Graph(apiV3, index, calculator);

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let fullResult: { [key: string]: IFullNode } = {};
        fullResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fullResult);
        imageByKeyFull.complete();

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let tileResult: { [key: string]: { [index: string]: ICoreNode } } = {};
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
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeHsFromBoundingBox").and.returnValue([h]);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
        new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        const imagesByHSpy: jasmine.Spy = spyOn(apiV3, "imagesByH$");
        imagesByHSpy.and.returnValue(imagesByH);

        let key: string = "key";
        let imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(apiV3, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.key = key;
        fullNode.l.lat = 0.5;
        fullNode.l.lon = 0.5;

        let graph: Graph = new Graph(apiV3, index, calculator);

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

        let tileResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        tileResult[h] = {};
        tileResult[h]["0"] = fullNode;
        imagesByH.next(tileResult);
        imagesByH.complete();

        let fillResult: { [key: string]: IFillNode } = {};
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
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
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
        let index: GeoRBush<any> = new GeoRBush(16);
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
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = helper.createFullNode();
        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();

        let imageByKeyFullSpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFull$");
        imageByKeyFullSpy.and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        expect(imageByKeyFullSpy.calls.count()).toBe(1);
    });

    it("should throw when fetching node already in graph", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.isCachingFull(fullNode.key)).toBe(false);
        expect(() => { graph.cacheFull$(fullNode.key); }).toThrowError(Error);
    });

    it("should throw if sequence key is missing", (done: Function) => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = undefined;

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
        let index: GeoRBush<any> = new GeoRBush(16);
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
        graph.cacheFull$(otherNode.key).subscribe(() => { /*noop*/ });

        let otherFullResult: { [key: string]: IFullNode } = {};
        otherFullResult[otherNode.key] = otherNode;
        imageByKeyFullOther.next(otherFullResult);
        imageByKeyFullOther.complete();

        graph.hasTiles(otherNode.key);
        observableFrom(graph.cacheTiles$(otherNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.key = key;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

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
        let index: GeoRBush<any> = new GeoRBush(16);
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
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let tileNode: ICoreNode = helper.createCoreNode();
        tileNode.key = "tileNodeKey";
        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
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
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
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
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let tileNode: ICoreNode = helper.createCoreNode();
        tileNode.key = "tileNodeKey";
        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = tileNode;
        imagesByH.next(result);

        expect(graph.getNode(tileNode.key).full).toBe(false);
        expect(graph.isCachingFill(tileNode.key)).toBe(false);

        graph.cacheFill$(tileNode.key).subscribe(() => { /*noop*/ });

        let fillTileNode: IFillNode = helper.createFullNode();
        let fillResult: { [key: string]: IFillNode } = {};
        fillResult[tileNode.key] = fillTileNode;
        imageByKeyFill.next(fillResult);

        expect(graph.getNode(tileNode.key).full).toBe(true);
        expect(graph.isCachingFill(tileNode.key)).toBe(false);
    });

    it("should not make additional calls when filling same node twice", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
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
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let tileNode: ICoreNode = helper.createCoreNode();
        tileNode.key = "tileNodeKey";
        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
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
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
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
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFill: Subject<{ [key: string]: IFillNode }> = new Subject<{ [key: string]: IFillNode }>();
        spyOn(apiV3, "imageByKeyFill$").and.returnValue(imageByKeyFill);

        let graph: Graph = new Graph(apiV3, index, calculator);

        expect(() => { graph.cacheFill$("key"); }).toThrowError(Error);
    });

    it("should throw if already full", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
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
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let node: Node = helper.createNode();

        spyOn(calculator, "encodeHs").and.returnValue(["h"]);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: Graph = new Graph(apiV3, index, calculator);

        spyOn(graph, "hasNode").and.returnValue(true);
        spyOn(graph, "getNode").and.returnValue(node);

        expect(graph.hasTiles(node.key)).toBe(false);
        expect(graph.isCachingTiles(node.key)).toBe(false);

        graph.cacheTiles$(node.key);

        expect(graph.hasTiles(node.key)).toBe(false);
        expect(graph.isCachingTiles(node.key)).toBe(true);
    });

    it("should cache tiles", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = helper.createFullNode();

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imageByKeyResult: { [key: string]: IFullNode } = {};
        imageByKeyResult[fullNode.key] = fullNode;
        let imageByKeyFull: Observable<{ [key: string]: IFullNode }> = observableOf<{ [key: string]: IFullNode }>(imageByKeyResult);
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: Graph = new Graph(apiV3, index, calculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        expect(graph.hasTiles(fullNode.key)).toBe(false);
        expect(graph.isCachingTiles(fullNode.key)).toBe(false);

        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
        result[h] = {};
        result[h]["0"] = fullNode;
        imagesByH.next(result);

        expect(graph.hasTiles(fullNode.key)).toBe(true);
        expect(graph.isCachingTiles(fullNode.key)).toBe(false);
    });

    it("should encode hs only once when checking tiles cache", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let node: Node = helper.createNode();

        let h: string = "h";
        let encodeHsSpy: jasmine.Spy = spyOn(calculator, "encodeHs");
        encodeHsSpy.and.returnValue([h]);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: Graph = new Graph(apiV3, index, calculator);

        spyOn(graph, "hasNode").and.returnValue(true);
        spyOn(graph, "getNode").and.returnValue(node);

        expect(graph.hasTiles(node.key)).toBe(false);
        expect(graph.hasTiles(node.key)).toBe(false);

        expect(encodeHsSpy.calls.count()).toBe(1);
    });

    it("should encode hs only once when caching tiles", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let fullNode: IFullNode = helper.createFullNode();

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        let encodeHsSpy: jasmine.Spy = spyOn(calculator, "encodeHs");
        encodeHsSpy.and.returnValue([h]);

        let imageByKeyResult: { [key: string]: IFullNode } = {};
        imageByKeyResult[fullNode.key] = fullNode;
        let imageByKeyFull: Observable<{ [key: string]: IFullNode }> = observableOf<{ [key: string]: IFullNode }>(imageByKeyResult);
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        let graph: Graph = new Graph(apiV3, index, calculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        expect(graph.hasTiles(fullNode.key)).toBe(false);

        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let result: { [key: string]: { [index: string]: ICoreNode } } = {};
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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);

        expect(() => { graph.cacheSequenceNodes$("sequenceKey"); }).toThrowError(Error);
    });

    it("should not be cached", () => {
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        spyOn(graphCalculator, "encodeH").and.returnValue("h");

        const edgeCalculator: EdgeCalculator = new EdgeCalculator();
        const configuration: IGraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator, undefined, configuration);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        spyOn(graphCalculator, "encodeH").and.returnValue("h");

        const edgeCalculator: EdgeCalculator = new EdgeCalculator();
        const configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator, undefined, configuration);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        spyOn(graphCalculator, "encodeH").and.returnValue("h");

        const edgeCalculator: EdgeCalculator = new EdgeCalculator();
        const configuration: IGraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator, undefined, configuration);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        spyOn(graphCalculator, "encodeH").and.returnValue("h");

        const edgeCalculator: EdgeCalculator = new EdgeCalculator();
        const configuration: IGraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator, undefined, configuration);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        let h: string = "h";
        spyOn(graphCalculator, "encodeH").and.returnValue(h);
        spyOn(graphCalculator, "encodeHs").and.returnValue([h]);

        const edgeCalculator: EdgeCalculator = new EdgeCalculator();
        const configuration: IGraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator, undefined, configuration);

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

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
        new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.key)).toBe(true);

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(true);

        let node: Node = graph.getNode(fullNode.key);
        let nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(false);
    });

    it("should be cached after uncaching tile if sequence is kept", () => {
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        let h: string = "h";
        spyOn(graphCalculator, "encodeH").and.returnValue(h);
        spyOn(graphCalculator, "encodeHs").and.returnValue([h]);

        const edgeCalculator: EdgeCalculator = new EdgeCalculator();
        const configuration: IGraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator, undefined, configuration);

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

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
        new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.key)).toBe(true);

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(true);

        let node: Node = graph.getNode(fullNode.key);
        let nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([], sequenceKey);

        expect(nodeUncacheSpy.calls.count()).toBe(1);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasSequenceNodes(sequenceKey)).toBe(true);
    });

    it("should throw if caching already cached sequence nodes", () => {
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);

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
        const apiV3: APIv3 = new APIv3("clientId");
        const index: GeoRBush<any> = new GeoRBush(16);
        const graphCalculator: GraphCalculator = new GraphCalculator(null);
        const edgeCalculator: EdgeCalculator = new EdgeCalculator();

        const sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        const imageByKey: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        const imageByKeySpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFull$");
        imageByKeySpy.and.returnValue(imageByKey);

        const graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);

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
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let graphCalculator: GraphCalculator = new GraphCalculator(null);
        let edgeCalculator: EdgeCalculator = new EdgeCalculator();

        let fullNode: IFullNode = helper.createFullNode();

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

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
        let index: GeoRBush<any> = new GeoRBush(16);
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
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        let node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        let coreNode: ICoreNode = helper.createCoreNode();
        coreNode.key = "otherKey";

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

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
        let index: GeoRBush<any> = new GeoRBush(16);
        let graphCalculator: GraphCalculator = new GraphCalculator(null);
        let edgeCalculator: EdgeCalculator = new EdgeCalculator();

        let fullNode: IFullNode = helper.createFullNode();

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: ["prev", fullNode.key, "next"] };
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
        let index: GeoRBush<any> = new GeoRBush(16);
        let graphCalculator: GraphCalculator = new GraphCalculator(null);
        let edgeCalculator: EdgeCalculator = new EdgeCalculator();

        let fullNode: IFullNode = helper.createFullNode();

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: ["prev", fullNode.key, "next"] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        let node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        let otherFullNode: IFullNode = helper.createFullNode();
        otherFullNode.sequence_key = "otherSequenceKey";
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
        let index: GeoRBush<any> = new GeoRBush(16);
        let graphCalculator: GraphCalculator = new GraphCalculator(null);
        let edgeCalculator: EdgeCalculator = new EdgeCalculator();

        let fullNode: IFullNode = helper.createFullNode();

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: ["prev", fullNode.key, "next"] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        let node: Node = graph.getNode(fullNode.key);

        spyOn(graphCalculator, "boundingBoxCorners").and.returnValue([{ lat: 0, lon: 0 }, { lat: 0, lon: 0 }]);

        let otherFullNode: IFullNode = helper.createFullNode();
        otherFullNode.sequence_key = "otherSequenceKey";
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
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        expect(graph.hasNodeSequence(fullNode.key)).toBe(false);
    });

    it("should be caching", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

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
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = "sequenceKey";

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

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
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: [fullNode.key] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasNodeSequence(fullNode.key)).toBe(true);
        expect(graph.isCachingNodeSequence(fullNode.key)).toBe(false);
    });

    it("should throw if node not in graph", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = "sequenceKey";

        expect(() => { graph.cacheNodeSequence$(fullNode.key); }).toThrowError(Error);
    });

    it("should throw if already cached", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = "sequenceKey";

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: [fullNode.key] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasNodeSequence(fullNode.key)).toBe(true);

        expect(() => { graph.cacheNodeSequence$(fullNode.key); }).toThrowError(Error);
    });

    it("should call api only once when caching the same sequence twice in succession", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        let sequenceByKeySpy: jasmine.Spy = spyOn(apiV3, "sequenceByKey$");
        sequenceByKeySpy.and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = "sequenceKey";

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });
        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        expect(sequenceByKeySpy.calls.count()).toBe(1);
    });

    it("should emit to changed stream", (done: Function) => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = "sequenceKey";

        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let fetchResult: { [key: string]: IFullNode } = {};
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

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: [fullNode.key] };
        sequenceByKey.next(result);
        sequenceByKey.complete();
    });
});

describe("Graph.cacheSequence$", () => {
    it("should not be cached", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let sequenceKey: string = "sequenceKey";

        expect(graph.hasSequence(sequenceKey)).toBe(false);
    });

    it("should not be caching", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let sequenceKey: string = "sequenceKey";

        expect(graph.isCachingSequence(sequenceKey)).toBe(false);
    });

    it("should be caching", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let sequenceKey: string = "sequenceKey";

        graph.cacheSequence$(sequenceKey).subscribe(() => { /*noop*/ });

        expect(graph.hasSequence(sequenceKey)).toBe(false);
        expect(graph.isCachingSequence(sequenceKey)).toBe(true);
    });

    it("should cache", (done: Function) => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
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
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        let sequenceByKeySpy: jasmine.Spy = spyOn(apiV3, "sequenceByKey$");
        sequenceByKeySpy.and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let sequenceKey: string = "sequenceKey";

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
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let graphCalculator: GraphCalculator = new GraphCalculator(null);
        let edgeCalculator: EdgeCalculator = new EdgeCalculator();

        let fullNode: IFullNode = helper.createFullNode();

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let graph: Graph = new Graph(apiV3, index, graphCalculator, edgeCalculator);
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: ["prev", fullNode.key, "next"] };
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
        let index: GeoRBush<any> = new GeoRBush(16);
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
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        let fetchResult: { [key: string]: IFullNode } = {};
        fetchResult[fullNode.key] = fullNode;
        imageByKeyFull.next(fetchResult);
        imageByKeyFull.complete();

        graph.cacheNodeSequence$(fullNode.key).subscribe(() => { /*noop*/ });

        let result: { [key: string]: ISequence } = {};
        result[fullNode.sequence_key] = { key: fullNode.sequence_key, keys: ["prev", fullNode.key, "next"] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasTiles(fullNode.key)).toBe(false);
        expect(graph.isCachingTiles(fullNode.key)).toBe(false);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
        new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

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
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

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
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

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
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let graph: Graph = new Graph(apiV3, index, calculator);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

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

describe("Graph.uncache", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should remove prestored node if not cache initialized", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        let node: Node = graph.getNode(fullNode.key);
        let nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.key)).toBe(false);
    });

    it("should not remove prestored node if in kept sequence", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = "sequencKey";
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        let node: Node = graph.getNode(fullNode.key);
        let nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([], fullNode.sequence_key);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.key)).toBe(true);
    });

    it("should remove prestored node if cache initialized", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        graph.initializeCache(fullNode.key);

        let node: Node = graph.getNode(fullNode.key);
        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.key)).toBe(false);
    });

    it("should not remove prestored node when in keys to keep", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        graph.initializeCache(fullNode.key);

        let node: Node = graph.getNode(fullNode.key);
        let nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([fullNode.key]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.key)).toBe(true);
    });

    it("should not remove prestored node if below threshold", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 1,
            maxUnusedTiles: 0,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        graph.initializeCache(fullNode.key);

        let node: Node = graph.getNode(fullNode.key);
        let nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.key)).toBe(true);
    });

    it("should remove prestored node accessed earliest", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);

        let imageByKeyFullSpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFull$");

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 1,
            maxUnusedTiles: 0,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode1: IFullNode = helper.createFullNode();
        fullNode1.key = "key1";
        let result1: { [key: string]: IFullNode } = {};
        result1[fullNode1.key] = fullNode1;

        let imageByKeyFull1: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        imageByKeyFullSpy.and.returnValue(imageByKeyFull1);

        graph.cacheFull$(fullNode1.key).subscribe(() => { /*noop*/ });

        imageByKeyFull1.next(result1);
        imageByKeyFull1.complete();

        expect(graph.hasNode(fullNode1.key)).toBe(true);

        let fullNode2: IFullNode = helper.createFullNode();
        fullNode2.key = "key2";
        let result2: { [key: string]: IFullNode } = {};
        result2[fullNode2.key] = fullNode2;

        let imageByKeyFull2: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        imageByKeyFullSpy.and.returnValue(imageByKeyFull2);

        graph.cacheFull$(fullNode2.key).subscribe(() => { /*noop*/ });

        imageByKeyFull2.next(result2);
        imageByKeyFull2.complete();

        let node1: Node = graph.getNode(fullNode1.key);
        graph.initializeCache(node1.key);

        expect(graph.hasInitializedCache(node1.key)).toBe(true);

        let node2: Node = graph.getNode(fullNode2.key);
        graph.initializeCache(node2.key);

        expect(graph.hasInitializedCache(node2.key)).toBe(true);

        let nodeDisposeSpy1: jasmine.Spy = spyOn(node1, "dispose").and.stub();
        let nodeDisposeSpy2: jasmine.Spy = spyOn(node2, "dispose").and.stub();

        let time: number = new Date().getTime();
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
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        graph.initializeCache(fullNode.key);

        expect(graph.hasInitializedCache(fullNode.key)).toBe(true);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
        new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        let node: Node = graph.getNode(fullNode.key);
        let nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.key)).toBe(true);
        expect(graph.hasInitializedCache(fullNode.key)).toBe(false);
    });

    it("should not uncache cache initialized node if below threshold", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        graph.initializeCache(fullNode.key);

        expect(graph.hasInitializedCache(fullNode.key)).toBe(true);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
        new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        let node: Node = graph.getNode(fullNode.key);
        let nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.key)).toBe(true);
        expect(graph.hasInitializedCache(fullNode.key)).toBe(true);
    });

    it("should not uncache cache initialized node if key should be kept", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        let node: Node = graph.getNode(fullNode.key);
        graph.initializeCache(node.key);

        expect(graph.hasInitializedCache(node.key)).toBe(true);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
        new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        let nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache");
        nodeUncacheSpy.and.stub();

        graph.uncache([node.key]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);

        expect(graph.hasNode(node.key)).toBe(true);
        expect(graph.hasInitializedCache(node.key)).toBe(true);
    });

    it("should not uncache cache initialized node if key in use", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        let node: Node = graph.getNode(fullNode.key);
        graph.initializeCache(node.key);

        expect(graph.hasInitializedCache(node.key)).toBe(true);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
        new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(node.key);
        observableFrom(graph.cacheTiles$(node.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(node.key)).toBe(true);
        expect(graph.hasInitializedCache(node.key)).toBe(true);
    });

    it("should uncache cache initialized node accessed earliest", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imageByKeyFullSpy: jasmine.Spy = spyOn(apiV3, "imageByKeyFull$");

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode1: IFullNode = helper.createFullNode();
        fullNode1.key = "key1";
        let result1: { [key: string]: IFullNode } = {};
        result1[fullNode1.key] = fullNode1;

        let imageByKeyFull1: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        imageByKeyFullSpy.and.returnValue(imageByKeyFull1);

        graph.cacheFull$(fullNode1.key).subscribe(() => { /*noop*/ });

        imageByKeyFull1.next(result1);
        imageByKeyFull1.complete();

        expect(graph.hasNode(fullNode1.key)).toBe(true);

        let fullNode2: IFullNode = helper.createFullNode();
        fullNode2.key = "key2";
        let result2: { [key: string]: IFullNode } = {};
        result2[fullNode2.key] = fullNode2;

        let imageByKeyFull2: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        imageByKeyFullSpy.and.returnValue(imageByKeyFull2);

        graph.cacheFull$(fullNode2.key).subscribe(() => { /*noop*/ });

        imageByKeyFull2.next(result2);
        imageByKeyFull2.complete();

        expect(graph.hasNode(fullNode2.key)).toBe(true);

        let node1: Node = graph.getNode(fullNode1.key);
        graph.initializeCache(node1.key);

        expect(graph.hasInitializedCache(node1.key)).toBe(true);

        let node2: Node = graph.getNode(fullNode2.key);
        graph.initializeCache(node2.key);

        expect(graph.hasInitializedCache(node2.key)).toBe(true);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
        new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode1.key);
        observableFrom(graph.cacheTiles$(fullNode1.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode1;
        imagesByHResult[h]["1"] = fullNode2;
        imagesByH.next(imagesByHResult);

        let nodeUncacheSpy1: jasmine.Spy = spyOn(node1, "uncache").and.stub();
        let nodeUncacheSpy2: jasmine.Spy = spyOn(node2, "uncache").and.stub();

        let time: number = new Date().getTime();
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
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let sequenceKey: string = "sequenceKey";

        graph.cacheSequence$(sequenceKey).subscribe(() => { /*noop*/ });

        let result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasSequence(sequenceKey)).toBe(true);

        let sequence: Sequence = graph.getSequence(sequenceKey);

        let sequenceDisposeSpy: jasmine.Spy = spyOn(sequence, "dispose");
        sequenceDisposeSpy.and.stub();

        graph.uncache([]);

        expect(sequenceDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasSequence(sequence.key)).toBe(false);
    });

    it("should not uncache sequence if specified to keep", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let sequenceKey: string = "sequenceKey";

        graph.cacheSequence$(sequenceKey).subscribe(() => { /*noop*/ });

        let result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasSequence(sequenceKey)).toBe(true);

        let sequence: Sequence = graph.getSequence(sequenceKey);

        let sequenceDisposeSpy: jasmine.Spy = spyOn(sequence, "dispose");
        sequenceDisposeSpy.and.stub();

        graph.uncache([], sequenceKey);

        expect(sequenceDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasSequence(sequence.key)).toBe(true);
    });

    it("should not uncache sequence if number below threshold", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let sequenceByKey: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        spyOn(apiV3, "sequenceByKey$").and.returnValue(sequenceByKey);

        let configuration: IGraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let sequenceKey: string = "sequenceKey";

        graph.cacheSequence$(sequenceKey).subscribe(() => { /*noop*/ });

        let result: { [sequenceKey: string]: ISequence } = {};
        result[sequenceKey] = { key: sequenceKey, keys: [] };
        sequenceByKey.next(result);
        sequenceByKey.complete();

        expect(graph.hasSequence(sequenceKey)).toBe(true);

        let sequence: Sequence = graph.getSequence(sequenceKey);

        let sequenceDisposeSpy: jasmine.Spy = spyOn(sequence, "dispose");
        sequenceDisposeSpy.and.stub();

        graph.uncache([]);

        expect(sequenceDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasSequence(sequence.key)).toBe(true);
    });

    it("should not uncache sequence accessed last", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let sequenceByKeySpy: jasmine.Spy = spyOn(apiV3, "sequenceByKey$");

        let configuration: IGraphConfiguration = {
            maxSequences: 1,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let sequenceKey1: string = "sequenceKey1";

        let sequenceByKey1: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        sequenceByKeySpy.and.returnValue(sequenceByKey1);

        graph.cacheSequence$(sequenceKey1).subscribe(() => { /*noop*/ });

        let result1: { [sequenceKey: string]: ISequence } = {};
        result1[sequenceKey1] = { key: sequenceKey1, keys: [] };
        sequenceByKey1.next(result1);
        sequenceByKey1.complete();

        expect(graph.hasSequence(sequenceKey1)).toBe(true);

        let sequence1: Sequence = graph.getSequence(sequenceKey1);

        let sequenceDisposeSpy1: jasmine.Spy = spyOn(sequence1, "dispose").and.stub();

        let sequenceKey2: string = "sequenceKey2";

        let sequenceByKey2: Subject<{ [key: string]: ISequence }> = new Subject<{ [key: string]: ISequence }>();
        sequenceByKeySpy.and.returnValue(sequenceByKey2);

        graph.cacheSequence$(sequenceKey2).subscribe(() => { /*noop*/ });

        let result2: { [sequenceKey: string]: ISequence } = {};
        result2[sequenceKey2] = { key: sequenceKey2, keys: [] };
        sequenceByKey2.next(result2);
        sequenceByKey2.complete();

        expect(graph.hasSequence(sequenceKey2)).toBe(true);

        let sequence2: Sequence = graph.getSequence(sequenceKey2);

        let sequenceDisposeSpy2: jasmine.Spy = spyOn(sequence2, "dispose").and.stub();

        let time: number = new Date().getTime();
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
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.key)).toBe(true);

        let node: Node = graph.getNode(fullNode.key);

        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose");
        nodeDisposeSpy.and.stub();

        graph.uncache([]);

        expect(nodeDisposeSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.key)).toBe(false);
    });

    it("should not dispose node by uncaching tile if in specified sequence", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode: IFullNode = helper.createFullNode();
        fullNode.sequence_key = "sequenceKey";
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.key)).toBe(true);

        let node: Node = graph.getNode(fullNode.key);

        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();
        let nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();

        graph.uncache([], fullNode.sequence_key);

        expect(nodeDisposeSpy.calls.count()).toBe(0);
        expect(nodeUncacheSpy.calls.count()).toBe(1);

        expect(graph.hasNode(fullNode.key)).toBe(true);
    });

    it("should not uncache node by uncaching tile when number below threshold", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 1,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 1,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.key)).toBe(true);

        let node: Node = graph.getNode(fullNode.key);
        let nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.key)).toBe(true);
        expect(graph.hasTiles(fullNode.key)).toBe(true);
    });

    it("should not uncache and dispose node by uncaching tile when tile is related to kept key", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let index: GeoRBush<any> = new GeoRBush(16);
        let calculator: GraphCalculator = new GraphCalculator(null);

        let h: string = "h";
        spyOn(calculator, "encodeH").and.returnValue(h);
        spyOn(calculator, "encodeHs").and.returnValue([h]);

        let imageByKeyFull: Subject<{ [key: string]: IFullNode }> = new Subject<{ [key: string]: IFullNode }>();
        spyOn(apiV3, "imageByKeyFull$").and.returnValue(imageByKeyFull);

        let configuration: IGraphConfiguration = {
            maxSequences: 0,
            maxUnusedNodes: 0,
            maxUnusedPreStoredNodes: 0,
            maxUnusedTiles: 0,
        };

        let graph: Graph = new Graph(apiV3, index, calculator, undefined, undefined, configuration);

        let fullNode: IFullNode = helper.createFullNode();
        let result: { [key: string]: IFullNode } = {};
        result[fullNode.key] = fullNode;
        graph.cacheFull$(fullNode.key).subscribe(() => { /*noop*/ });

        imageByKeyFull.next(result);
        imageByKeyFull.complete();

        expect(graph.hasNode(fullNode.key)).toBe(true);

        let imagesByH: Subject<{ [key: string]: { [index: string]: ICoreNode } }> =
            new Subject<{ [key: string]: { [index: string]: ICoreNode } }>();
        spyOn(apiV3, "imagesByH$").and.returnValue(imagesByH);

        graph.hasTiles(fullNode.key);
        observableFrom(graph.cacheTiles$(fullNode.key)).pipe(
            mergeAll())
            .subscribe(() => { /*noop*/ });

        let imagesByHResult: { [key: string]: { [index: string]: ICoreNode } } = {};
        imagesByHResult[h] = {};
        imagesByHResult[h]["0"] = fullNode;
        imagesByH.next(imagesByHResult);

        expect(graph.hasTiles(fullNode.key)).toBe(true);

        let node: Node = graph.getNode(fullNode.key);
        let nodeUncacheSpy: jasmine.Spy = spyOn(node, "uncache").and.stub();
        let nodeDisposeSpy: jasmine.Spy = spyOn(node, "dispose").and.stub();

        graph.uncache([node.key]);

        expect(nodeUncacheSpy.calls.count()).toBe(0);
        expect(nodeDisposeSpy.calls.count()).toBe(0);

        expect(graph.hasNode(fullNode.key)).toBe(true);
        expect(graph.hasTiles(fullNode.key)).toBe(true);
    });
});
