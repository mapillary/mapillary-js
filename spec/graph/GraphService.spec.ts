/// <reference path="../../typings/index.d.ts" />

import {Subject} from "rxjs/Subject";

import {APIv3} from "../../src/API";
import {
    Graph,
    GraphService,
    ImageLoadingService,
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

        graphService.cacheSequence$("sequenceKey").subscribe();

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

        graphService.cacheSequence$("sequenceKey").subscribe();

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

        graphService.cacheSequence$("sequenceKey").subscribe();

        cacheSequence$.next(graph);

        expect(cacheSequenceSpy.calls.count()).toBe(0);
        expect(getSequenceSpy.calls.count()).toBe(1);
    });
});
