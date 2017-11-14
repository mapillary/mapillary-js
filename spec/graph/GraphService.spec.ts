/// <reference path="../../typings/index.d.ts" />

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {NodeHelper} from "../helper/NodeHelper.spec";

import {APIv3, ICoreNode} from "../../src/API";
import {
    Graph,
    GraphService,
    IEdgeStatus,
    ImageLoadingService,
    Node,
} from "../../src/Graph";

describe("GraphService.ctor", () => {
    it("should create a graph service", () => {
        let apiV3: APIv3 = new APIv3("clientId");
        let graph: Graph = new Graph(apiV3);
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();

        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        expect(graphService).toBeDefined();
    });
});

describe("GraphService.cacheSequence$", () => {
    it("should cache sequence when graph does not have sequence", () => {
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();

        let apiV3: APIv3 = new APIv3("clientId");
        let graph: Graph = new Graph(apiV3);

        spyOn(graph, "isCachingSequence").and.returnValue(false);
        spyOn(graph, "hasSequence").and.returnValue(false);

        let cacheSequence$: Subject<Graph> = new Subject<Graph>();
        let cacheSequenceSpy: jasmine.Spy = spyOn(graph, "cacheSequence$");
        cacheSequenceSpy.and.returnValue(cacheSequence$);

        let getSequenceSpy: jasmine.Spy = spyOn(graph, "getSequence");
        getSequenceSpy.and.returnValue(graph);

        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        graphService.cacheSequence$("sequenceKey").subscribe(() => { /*noop*/ });

        cacheSequence$.next(graph);

        expect(cacheSequenceSpy.calls.count()).toBe(1);
        expect(getSequenceSpy.calls.count()).toBe(1);
    });

    it("should cache sequence when graph is caching sequence", () => {
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();

        let apiV3: APIv3 = new APIv3("clientId");
        let graph: Graph = new Graph(apiV3);

        spyOn(graph, "isCachingSequence").and.returnValue(true);
        spyOn(graph, "hasSequence").and.returnValue(false);

        let cacheSequence$: Subject<Graph> = new Subject<Graph>();
        let cacheSequenceSpy: jasmine.Spy = spyOn(graph, "cacheSequence$");
        cacheSequenceSpy.and.returnValue(cacheSequence$);

        let getSequenceSpy: jasmine.Spy = spyOn(graph, "getSequence");
        getSequenceSpy.and.returnValue(graph);

        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        graphService.cacheSequence$("sequenceKey").subscribe(() => { /*noop*/ });

        cacheSequence$.next(graph);

        expect(cacheSequenceSpy.calls.count()).toBe(1);
        expect(getSequenceSpy.calls.count()).toBe(1);
    });

    it("should not cache sequence when graph have sequence", () => {
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();

        let apiV3: APIv3 = new APIv3("clientId");
        let graph: Graph = new Graph(apiV3);

        spyOn(graph, "isCachingSequence").and.returnValue(false);
        spyOn(graph, "hasSequence").and.returnValue(true);

        let cacheSequence$: Subject<Graph> = new Subject<Graph>();
        let cacheSequenceSpy: jasmine.Spy = spyOn(graph, "cacheSequence$");
        cacheSequenceSpy.and.returnValue(cacheSequence$);

        let getSequenceSpy: jasmine.Spy = spyOn(graph, "getSequence");
        getSequenceSpy.and.returnValue(graph);

        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        graphService.cacheSequence$("sequenceKey").subscribe(() => { /*noop*/ });

        cacheSequence$.next(graph);

        expect(cacheSequenceSpy.calls.count()).toBe(0);
        expect(getSequenceSpy.calls.count()).toBe(1);
    });
});

class TestNode extends Node {
    private _assetsCached: boolean;
    private _sequenceEdges: IEdgeStatus;
    private _spatialEdges: IEdgeStatus;

    constructor(core: ICoreNode) {
        super(core);

        this._assetsCached = false;
        this._sequenceEdges = { cached: false, edges: [] };
        this._spatialEdges = { cached: false, edges: [] };
    }

    public get assetsCached(): boolean {
        return this._assetsCached;
    }

    public set assetsCached(value: boolean) {
        this._assetsCached = value;
    }

    public get sequenceEdges(): IEdgeStatus {
        return this._sequenceEdges;
    }

    public get spatialEdges(): IEdgeStatus {
        return this._spatialEdges;
    }
}

describe("GraphService.cacheNode$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should cache and return node", (done: Function) => {
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        let loadNodeSpy: jasmine.Spy = spyOn(imageLoadingService.loadnode$, "next").and.stub();

        let apiV3: APIv3 = new APIv3("clientId");
        let graph: Graph = new Graph(apiV3);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValue(false);

        let cacheFull$: Subject<Graph> = new Subject<Graph>();
        let cacheFullSpy: jasmine.Spy = spyOn(graph, "cacheFull$");
        cacheFullSpy.and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        let initializeCacheSpy: jasmine.Spy = spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        let cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheNodeSequence$").and.returnValue(cacheNodeSequence$);

        spyOn(graph, "hasTiles").and.returnValue(false);

        let cacheTiles$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        let node: TestNode = new TestNode(helper.createCoreNode());

        let cacheAssets$: Subject<Node> = new Subject<Node>();
        let cacheAssetsSpy: jasmine.Spy = spyOn(node, "cacheAssets$");
        cacheAssetsSpy.and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(node);

        graphService.cacheNode$(node.key)
            .subscribe(
                (n: Node): void => {
                    expect(cacheFullSpy.calls.count()).toBe(1);
                    expect(initializeCacheSpy.calls.count()).toBe(1);
                    expect(cacheAssetsSpy.calls.count()).toBe(1);

                    expect(loadNodeSpy.calls.count()).toBe(1);

                    done();
                });

        cacheFull$.next(graph);

        node.assetsCached = true;
        cacheAssets$.next(node);
    });

    it("should fill and return node", (done: Function) => {
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        spyOn(imageLoadingService.loadnode$, "next").and.stub();

        let apiV3: APIv3 = new APIv3("clientId");
        let graph: Graph = new Graph(apiV3);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValue(true);
        spyOn(graph, "isCachingFill").and.returnValue(false);

        let cacheFill$: Subject<Graph> = new Subject<Graph>();
        let cacheFillSpy: jasmine.Spy = spyOn(graph, "cacheFill$");
        cacheFillSpy.and.returnValue(cacheFill$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        let cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheNodeSequence$").and.returnValue(cacheNodeSequence$);

        spyOn(graph, "hasTiles").and.returnValue(false);

        let cacheTiles$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        let node: TestNode = new TestNode(helper.createCoreNode());

        let cacheAssets$: Subject<Node> = new Subject<Node>();
        let cacheAssetsSpy: jasmine.Spy = spyOn(node, "cacheAssets$");
        cacheAssetsSpy.and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(node);

        graphService.cacheNode$(node.key)
            .subscribe(
                (n: Node): void => {
                    expect(cacheFillSpy.calls.count()).toBe(1);

                    done();
                });

        cacheFill$.next(graph);

        node.assetsCached = true;
        cacheAssets$.next(node);
    });

    it("should cache node sequence and sequence edges", () => {
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        spyOn(imageLoadingService.loadnode$, "next").and.stub();

        let apiV3: APIv3 = new APIv3("clientId");
        let graph: Graph = new Graph(apiV3);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValue(false);

        let cacheFull$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheFull$").and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        let cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        let cacheNodeSequenceSpy: jasmine.Spy = spyOn(graph, "cacheNodeSequence$");
        cacheNodeSequenceSpy.and.returnValue(cacheNodeSequence$);

        let cacheSequenceEdgesSpy: jasmine.Spy = spyOn(graph, "cacheSequenceEdges").and.stub();

        spyOn(graph, "hasTiles").and.returnValue(false);

        let cacheTiles$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        let node: TestNode = new TestNode(helper.createCoreNode());

        let cacheAssets$: Subject<Node> = new Subject<Node>();
        spyOn(node, "cacheAssets$").and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(node);

        graphService.cacheNode$(node.key).subscribe(() => { /*noop*/ });

        cacheFull$.next(graph);

        cacheNodeSequence$.next(graph);

        expect(cacheNodeSequenceSpy.calls.count()).toBe(1);
        expect(cacheNodeSequenceSpy.calls.first().args.length).toBe(1);
        expect(cacheNodeSequenceSpy.calls.first().args[0]).toBe(node.key);

        expect(cacheSequenceEdgesSpy.calls.count()).toBe(1);
        expect(cacheSequenceEdgesSpy.calls.first().args.length).toBe(1);
        expect(cacheSequenceEdgesSpy.calls.first().args[0]).toBe(node.key);
    });

    it("should cache spatial edges", () => {
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        spyOn(imageLoadingService.loadnode$, "next").and.stub();

        let apiV3: APIv3 = new APIv3("clientId");
        let graph: Graph = new Graph(apiV3);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValue(false);

        let cacheFull$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheFull$").and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(true);

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(true);

        spyOn(graph, "hasTiles").and.returnValue(true);
        spyOn(graph, "hasSpatialArea").and.returnValue(true);

        let cacheSpatialEdgesSpy: jasmine.Spy = spyOn(graph, "cacheSpatialEdges").and.stub();

        let cacheTiles$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        let node: TestNode = new TestNode(helper.createCoreNode());
        node.sequenceEdges.cached = true;

        let cacheAssets$: Subject<Node> = new Subject<Node>();
        spyOn(node, "cacheAssets$").and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(node);

        graphService.cacheNode$(node.key).subscribe(() => { /*noop*/ });

        cacheFull$.next(graph);

        expect(cacheSpatialEdgesSpy.calls.count()).toBe(1);
        expect(cacheSpatialEdgesSpy.calls.first().args.length).toBe(1);
        expect(cacheSpatialEdgesSpy.calls.first().args[0]).toBe(node.key);
    });
});

describe("GraphService.reset$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should abort node caching and throw", () => {
        spyOn(console, "error").and.stub();

        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        spyOn(imageLoadingService.loadnode$, "next").and.stub();

        let apiV3: APIv3 = new APIv3("clientId");
        let graph: Graph = new Graph(apiV3);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValue(false);

        let cacheFull$: Subject<Graph> = new Subject<Graph>();
        let cacheFullSpy: jasmine.Spy = spyOn(graph, "cacheFull$");
        cacheFullSpy.and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        let initializeCacheSpy: jasmine.Spy = spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        let cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheNodeSequence$").and.returnValue(cacheNodeSequence$);

        spyOn(graph, "hasTiles").and.returnValue(false);

        let cacheTiles$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        let node: TestNode = new TestNode(helper.createCoreNode());

        let cacheAssets$: Subject<Node> = new Subject<Node>();
        let cacheAssetsSpy: jasmine.Spy = spyOn(node, "cacheAssets$");
        cacheAssetsSpy.and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(node);

        graphService.cacheNode$(node.key)
            .subscribe(
                (n: Node): void => { return; },
                (e: Error): void => {
                    expect(e).toBeDefined();
                });

        graphService.reset$([]);

        cacheFull$.next(graph);

        node.assetsCached = true;
        cacheAssets$.next(node);

        expect(cacheFullSpy.calls.count()).toBe(1);
        expect(initializeCacheSpy.calls.count()).toBe(0);
        expect(cacheAssetsSpy.calls.count()).toBe(0);
    });

    it("should cancel sequence edge caching", () => {
        spyOn(console, "error").and.stub();

        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        spyOn(imageLoadingService.loadnode$, "next").and.stub();

        let apiV3: APIv3 = new APIv3("clientId");
        let graph: Graph = new Graph(apiV3);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValue(false);

        let cacheFull$: Subject<Graph> = new Subject<Graph>();
        let cacheFullSpy: jasmine.Spy = spyOn(graph, "cacheFull$");
        cacheFullSpy.and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        let cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheNodeSequence$").and.returnValue(cacheNodeSequence$);

        let cacheSequenceEdgesSpy: jasmine.Spy = spyOn(graph, "cacheSequenceEdges").and.stub();

        spyOn(graph, "hasTiles").and.returnValue(false);

        let cacheTiles$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        let node: TestNode = new TestNode(helper.createCoreNode());
        node.spatialEdges.cached = false;

        let cacheAssets$: Subject<Node> = new Subject<Node>();
        let cacheAssetsSpy: jasmine.Spy = spyOn(node, "cacheAssets$");
        cacheAssetsSpy.and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(node);

        graphService.cacheNode$(node.key)
            .subscribe(
                (n: Node): void => {
                    expect(n).toBeDefined();
                });

        cacheFull$.next(graph);

        node.assetsCached = true;
        cacheAssets$.next(node);

        graphService.reset$([]);

        cacheNodeSequence$.next(graph);

        expect(cacheSequenceEdgesSpy.calls.count()).toBe(0);
    });

    it("should cancel spatial edge caching", () => {
        spyOn(console, "error").and.stub();

        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        spyOn(imageLoadingService.loadnode$, "next").and.stub();

        let apiV3: APIv3 = new APIv3("clientId");
        let graph: Graph = new Graph(apiV3);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValue(false);

        let cacheFull$: Subject<Graph> = new Subject<Graph>();
        let cacheFullSpy: jasmine.Spy = spyOn(graph, "cacheFull$");
        cacheFullSpy.and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        let cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheNodeSequence$").and.returnValue(cacheNodeSequence$);

        spyOn(graph, "hasTiles").and.returnValue(false);

        let cacheTiles$: Subject<Observable<Graph>[]> = new Subject<Observable<Graph>[]>();
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        let hasSpatialAreaSpy: jasmine.Spy = spyOn(graph, "hasSpatialArea").and.stub();

        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        let node: TestNode = new TestNode(helper.createCoreNode());
        node.spatialEdges.cached = false;

        let cacheAssets$: Subject<Node> = new Subject<Node>();
        let cacheAssetsSpy: jasmine.Spy = spyOn(node, "cacheAssets$");
        cacheAssetsSpy.and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(node);

        graphService.cacheNode$(node.key)
            .subscribe(
                (n: Node): void => {
                    expect(n).toBeDefined();
                });

        cacheFull$.next(graph);

        node.assetsCached = true;
        cacheAssets$.next(node);

        graphService.reset$([]);

        cacheTiles$.next([Observable.of<Graph>(graph)]);

        expect(hasSpatialAreaSpy.calls.count()).toBe(0);
    });
});

describe("GraphService.setFilter$", () => {
    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should reset spatial edges and set filter", () => {
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();

        let apiV3: APIv3 = new APIv3("clientId");
        let graph: Graph = new Graph(apiV3);

        let resetSpatialEdgesSpy: jasmine.Spy = spyOn(graph, "resetSpatialEdges").and.stub();
        let setFilterSpy: jasmine.Spy = spyOn(graph, "setFilter").and.stub();

        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        graphService.setFilter$(["==", "sequenceKey", "skey"]).subscribe(() => { /*noop*/ });

        expect(resetSpatialEdgesSpy.calls.count()).toBe(1);

        expect(setFilterSpy.calls.count()).toBe(1);
        expect(setFilterSpy.calls.first().args.length).toBe(1);
        expect(setFilterSpy.calls.first().args[0].length).toBe(3);
        expect(setFilterSpy.calls.first().args[0][0]).toBe("==");
        expect(setFilterSpy.calls.first().args[0][1]).toBe("sequenceKey");
        expect(setFilterSpy.calls.first().args[0][2]).toBe("skey");
    });

    it("should cancel spatial subscriptions", () => {
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();
        spyOn(imageLoadingService.loadnode$, "next").and.stub();

        let apiV3: APIv3 = new APIv3("clientId");
        let graph: Graph = new Graph(apiV3);

        spyOn(graph, "isCachingFull").and.returnValue(false);
        spyOn(graph, "hasNode").and.returnValue(false);

        let cacheFull$: Subject<Graph> = new Subject<Graph>();
        let cacheFullSpy: jasmine.Spy = spyOn(graph, "cacheFull$");
        cacheFullSpy.and.returnValue(cacheFull$);

        spyOn(graph, "hasInitializedCache").and.returnValue(false);
        spyOn(graph, "initializeCache").and.stub();

        spyOn(graph, "isCachingNodeSequence").and.returnValue(false);
        spyOn(graph, "hasNodeSequence").and.returnValue(false);

        let cacheNodeSequence$: Subject<Graph> = new Subject<Graph>();
        spyOn(graph, "cacheNodeSequence$").and.returnValue(cacheNodeSequence$);

        spyOn(graph, "hasTiles").and.returnValue(false);

        let cacheTiles$: Subject<Observable<Graph>[]> = new Subject<Observable<Graph>[]>();
        spyOn(graph, "cacheTiles$").and.returnValue(cacheTiles$);

        let hasSpatialAreaSpy: jasmine.Spy = spyOn(graph, "hasSpatialArea").and.stub();

        spyOn(graph, "resetSpatialEdges").and.stub();
        spyOn(graph, "setFilter").and.stub();

        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        let node: TestNode = new TestNode(helper.createCoreNode());
        node.spatialEdges.cached = false;

        let cacheAssets$: Subject<Node> = new Subject<Node>();
        let cacheAssetsSpy: jasmine.Spy = spyOn(node, "cacheAssets$");
        cacheAssetsSpy.and.returnValue(cacheAssets$);

        spyOn(graph, "getNode").and.returnValue(node);

        graphService.cacheNode$(node.key)
            .subscribe(
                (n: Node): void => {
                    expect(n).toBeDefined();
                });

        cacheFull$.next(graph);

        node.assetsCached = true;
        cacheAssets$.next(node);

        graphService.setFilter$(["==", "sequenceKey", "skey"]).subscribe(() => { /*noop*/ });

        cacheTiles$.next([Observable.of<Graph>(graph)]);

        expect(hasSpatialAreaSpy.calls.count()).toBe(0);
    });
});

describe("GraphService.uncache$", () => {
    it("should reset spatial edges and set filter", () => {
        let imageLoadingService: ImageLoadingService = new ImageLoadingService();

        let apiV3: APIv3 = new APIv3("clientId");
        let graph: Graph = new Graph(apiV3);

        let uncacheSpy: jasmine.Spy = spyOn(graph, "uncache").and.stub();

        let graphService: GraphService = new GraphService(graph, imageLoadingService);

        graphService.uncache$(["nKey"]).subscribe(() => { /*noop*/ });

        expect(uncacheSpy.calls.count()).toBe(1);

        expect(uncacheSpy.calls.count()).toBe(1);
        expect(uncacheSpy.calls.first().args.length).toBe(1);
        expect(uncacheSpy.calls.first().args[0].length).toBe(1);
        expect(uncacheSpy.calls.first().args[0][0]).toBe("nKey");
    });
});
