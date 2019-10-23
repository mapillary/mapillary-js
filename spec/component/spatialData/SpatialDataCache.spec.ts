import * as geohash from "latlon-geohash";
import * as pako from "pako";

import { Subject } from "rxjs";

import {SpatialDataCache} from "../../../src/Component";
import {
    GraphService,
    Node,
} from "../../../src/Graph";

import GraphServiceMockCreator from "../../helper/GraphServiceMockCreator.spec";
import NodeHelper from "../../helper/NodeHelper.spec";
import IClusterReconstruction from "../../../src/component/spatialdata/interfaces/IClusterReconstruction";

describe("SpatialDataCache.ctor", () => {
    it("should be defined", () => {
        const cache: SpatialDataCache =
            new SpatialDataCache(new GraphServiceMockCreator().create());

        expect(cache).toBeDefined();
    });
});

describe("SpatialDataCache.cacheTile$", () => {
    it("should call cache bouding box", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheBoundingBox$: Subject<Node[]> = new Subject<Node[]>();
        const cacheBoundingBoxSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheBoundingBox$;
        cacheBoundingBoxSpy.and.returnValue(cacheBoundingBox$);

        const boundsSpy: jasmine.Spy = spyOn(geohash, "bounds");
        boundsSpy.and.returnValue({
            ne: { lat: 1, lon: 2 },
            sw: { lat: -1, lon: -2 },
        });

        const cache: SpatialDataCache = new SpatialDataCache(graphService);

        const hash: string = "12345678";
        cache.cacheTile$(hash);

        expect(boundsSpy.calls.count()).toBe(1);

        expect(cacheBoundingBoxSpy.calls.count()).toBe(1);
        expect(cacheBoundingBoxSpy.calls.first().args[0].lat).toBe(-1);
        expect(cacheBoundingBoxSpy.calls.first().args[0].lon).toBe(-2);
        expect(cacheBoundingBoxSpy.calls.first().args[1].lat).toBe(1);
        expect(cacheBoundingBoxSpy.calls.first().args[1].lon).toBe(2);
    });

    it("should throw if hash is wrong level", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialDataCache = new SpatialDataCache(graphService);

        expect(() => { cache.cacheTile$("1234567"); }).toThrowError(Error);
        expect(() => { cache.cacheTile$("123456789"); }).toThrowError(Error);
    });

    it("should be caching tile", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheBoundingBox$: Subject<Node[]> = new Subject<Node[]>();
        const cacheBoundingBoxSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheBoundingBox$;
        cacheBoundingBoxSpy.and.returnValue(cacheBoundingBox$);

        const boundsSpy: jasmine.Spy = spyOn(geohash, "bounds");
        boundsSpy.and.returnValue({ ne: { lat: 1, lon: 2 }, sw: { lat: -1, lon: -2 } });

        const cache: SpatialDataCache = new SpatialDataCache(graphService);

        const hash: string = "00000000";

        expect(cache.isCachingTile(hash)).toBe(false);

        cache.cacheTile$(hash);

        expect(cache.isCachingTile(hash)).toBe(true);
    });

    it("should cache tile", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheBoundingBox$: Subject<Node[]> = new Subject<Node[]>();
        const cacheBoundingBoxSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheBoundingBox$;
        cacheBoundingBoxSpy.and.returnValue(cacheBoundingBox$);

        const boundsSpy: jasmine.Spy = spyOn(geohash, "bounds");
        boundsSpy.and.returnValue({ ne: { lat: 1, lon: 2 }, sw: { lat: -1, lon: -2 } });

        const cache: SpatialDataCache = new SpatialDataCache(graphService);

        const hash: string = "00000000";

        expect(cache.hasTile(hash)).toBe(false);

        cache.cacheTile$(hash)
            .subscribe();

        const node: Node = new NodeHelper().createNode();
        cacheBoundingBox$.next([node]);

        expect(cache.isCachingTile(hash)).toBe(false);
        expect(cache.hasTile(hash)).toBe(true);
        expect(cache.getTile(hash).length).toBe(1);
        expect(cache.getTile(hash)[0].key).toBe(node.key);
    });

    it("should catch error", (done: Function) => {
        spyOn(console, "error").and.stub();

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheBoundingBox$: Subject<Node[]> = new Subject<Node[]>();
        const cacheBoundingBoxSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheBoundingBox$;
        cacheBoundingBoxSpy.and.returnValue(cacheBoundingBox$);

        const boundsSpy: jasmine.Spy = spyOn(geohash, "bounds");
        boundsSpy.and.returnValue({ ne: { lat: 1, lon: 2 }, sw: { lat: -1, lon: -2 } });

        const cache: SpatialDataCache = new SpatialDataCache(graphService);

        const hash: string = "00000000";

        cache.cacheTile$(hash)
            .subscribe();

        cacheBoundingBox$.error(new Error());

        expect(cache.isCachingTile(hash)).toBe(false);
        expect(cache.hasTile(hash)).toBe(false);

        let tileEmitCount: number = 0;
        cache.cacheTile$(hash)
            .subscribe(
                (): void => {
                    tileEmitCount++;
                },
                undefined,
                (): void => {
                    expect(tileEmitCount).toBe(0);
                    done();
                });
    });
});

describe("SpatialDataCache.cacheReconstructions$", () => {
    class XMLHTTPRequestMock {
        public response: {};
        public responseType: string;
        public timeout: number;

        public onload: (e: Event) => any;
        public onerror: (e: Event) => any;
        public ontimeout: (e: Event) => any;
        public onabort: (e: Event) => any;

        public abort(): void { this.onabort(new Event("abort")); }
        public open(...args: any[]): void { return; }
        public send(...args: any[]): void { return; }
    }

    const cacheTile: (
        hash: string,
        cache: SpatialDataCache,
        graphService: GraphService,
        nodes: Node[]) => void = (
            hash: string,
            cache: SpatialDataCache,
            graphService: GraphService,
            nodes: Node[]): void => {

        const cacheBoundingBox$: Subject<Node[]> = new Subject<Node[]>();
        const cacheBoundingBoxSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheBoundingBox$;
        cacheBoundingBoxSpy.and.returnValue(cacheBoundingBox$);

        const boundsSpy: jasmine.Spy = spyOn(geohash, "bounds");
        boundsSpy.and.returnValue({ ne: { lat: 1, lon: 2 }, sw: { lat: -1, lon: -2 } });

        cache.cacheTile$(hash)
            .subscribe();

        cacheBoundingBox$.next(nodes);

        expect(cache.hasTile(hash)).toBe(true);
    };

    it("should cache a reconstruction", (done: Function) => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialDataCache = new SpatialDataCache(graphService);
        const node: Node = new NodeHelper().createNode();
        const hash: string = "00000000";

        cacheTile(hash, cache, graphService, [node]);

        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        let emitCount: number = 0;
        cache.cacheClusterReconstructions$(hash)
            .subscribe(
                (r: IClusterReconstruction): void => {
                    expect(r.key).toBe(node.clusterKey);
                    emitCount++;
                },
                undefined,
                (): void => {
                    expect(emitCount).toBe(1);
                    expect(cache.hasClusterReconstructions(hash)).toBe(true);
                    done();
                });

        const response: string = pako.deflate(
            JSON.stringify([{ points: [], refererence_lla: { altitude: 0, latitude: 0, longitude: 0} }]),
            { to: "string" });

        requestMock.response = response;
        requestMock.onload(new Event("load"));
    });

    it("should not have a non-existing reconstruction", (done: Function) => {
        spyOn(console, "error").and.stub();

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialDataCache = new SpatialDataCache(graphService);
        const node: Node = new NodeHelper().createNode();
        const hash: string = "00000001";

        cacheTile(hash, cache, graphService, [node]);

        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        let emitCount: number = 0;
        cache.cacheClusterReconstructions$(hash)
            .subscribe(
                (): void => {
                    emitCount++;
                },
                undefined,
                (): void => {
                    expect(emitCount).toBe(0);
                    expect(cache.hasClusterReconstructions(hash)).toBe(false);
                    expect(cache.getClusterReconstructions(hash).length).toBe(0);
                    done();
                });

        requestMock.response = null;
        requestMock.onload(new Event("load"));
    });

    it("should not have an errored reconstruction", (done: Function) => {
        spyOn(console, "error").and.stub();

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialDataCache = new SpatialDataCache(graphService);
        const node: Node = new NodeHelper().createNode();
        const hash: string = "00000000";

        cacheTile(hash, cache, graphService, [node]);

        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        let emitCount: number = 0;
        cache.cacheClusterReconstructions$(hash)
            .subscribe(
                (): void => {
                    emitCount++;
                },
                undefined,
                (): void => {
                    expect(emitCount).toBe(0);
                    expect(cache.hasClusterReconstructions(hash)).toBe(false);
                    expect(cache.getClusterReconstructions(hash).length).toBe(0);
                    done();
                });

        requestMock.onerror(new Event("error"));
    });

    it("should abort on uncache", (done: Function) => {
        spyOn(console, "error").and.stub();

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialDataCache = new SpatialDataCache(graphService);
        const node: Node = new NodeHelper().createNode();
        const hash: string = "00000000";

        cacheTile(hash, cache, graphService, [node]);

        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        let emitCount: number = 0;
        cache.cacheClusterReconstructions$(hash)
            .subscribe(
                (): void => {
                    emitCount++;
                },
                undefined,
                (): void => {
                    expect(emitCount).toBe(0);
                    expect(cache.hasClusterReconstructions(hash)).toBe(false);
                    expect(cache.isCachingTile(hash)).toBe(false);
                    done();
                });

        cache.uncache();
    });

    it("should only request reconstruction once if called twice before completing", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialDataCache = new SpatialDataCache(graphService);
        const node: Node = new NodeHelper().createNode();
        const hash: string = "00000000";

        cacheTile(hash, cache, graphService, [node]);

        const requestMock: XMLHTTPRequestMock = new XMLHTTPRequestMock();
        const sendSpy: jasmine.Spy = spyOn(requestMock, "send");
        spyOn(window, <keyof Window>"XMLHttpRequest").and.returnValue(requestMock);

        let emitCount1: number = 0;
        cache.cacheClusterReconstructions$(hash)
            .subscribe(
                (): void => {
                    emitCount1++;
                });

        expect(sendSpy.calls.count()).toBe(1);

        let emitCount2: number = 0;
        cache.cacheClusterReconstructions$(hash)
            .subscribe(
                (): void => {
                    emitCount2++;
                });

        const response: string = pako.deflate(
            JSON.stringify([{ points: [], refererence_lla: { altitude: 0, latitude: 0, longitude: 0} }]),
            { to: "string" });

        requestMock.response = response;
        requestMock.onload(new Event("load"));

        expect(emitCount1).toBe(1);
        expect(emitCount2).toBe(1);

        expect(sendSpy.calls.count()).toBe(1);

        expect(cache.isCachingClusterReconstructions(hash)).toBe(false);
        expect(cache.hasClusterReconstructions(hash)).toBe(true);
        expect(cache.getClusterReconstructions(hash).length).toBe(1);
        expect(cache.getClusterReconstructions(hash)[0].key).toBe(node.clusterKey);
    });
});
