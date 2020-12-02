import { Subject } from "rxjs";

import { SpatialDataCache } from "../../../src/Component";
import {
    GraphService,
    Node,
} from "../../../src/Graph";

import GraphServiceMockCreator from "../../helper/GraphServiceMockCreator.spec";
import NodeHelper from "../../helper/NodeHelper.spec";
import IDataProvider from "../../../src/api/interfaces/IDataProvider";
import FalcorDataProvider from "../../../src/api/FalcorDataProvider";
import IClusterReconstruction from "../../../src/api/interfaces/IClusterReconstruction";
import IGeometryProvider from "../../../src/api/interfaces/IGeometryProvider";
import GeohashGeometryProvider from "../../../src/api/GeohashGeometryProvider";

describe("SpatialDataCache.ctor", () => {
    it("should be defined", () => {
        const cache: SpatialDataCache =
            new SpatialDataCache(
                new GraphServiceMockCreator().create(),
                undefined);

        expect(cache).toBeDefined();
    });
});

describe("SpatialDataCache.cacheTile$", () => {
    it("should call cache bounding box", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheBoundingBox$: Subject<Node[]> = new Subject<Node[]>();
        const cacheBoundingBoxSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheBoundingBox$;
        cacheBoundingBoxSpy.and.returnValue(cacheBoundingBox$);

        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();

        const getCornersSpy: jasmine.Spy = spyOn(geometryProvider, "getCorners");
        getCornersSpy.and.returnValue({
            nw: { lat: 1, lon: 0 },
            ne: { lat: 1, lon: 2 },
            se: { lat: -1, lon: 2 },
            sw: { lat: -1, lon: 0 },
        });

        const dataProvider: IDataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const cache: SpatialDataCache = new SpatialDataCache(
            graphService, dataProvider);

        const hash: string = "12345678";
        cache.cacheTile$(hash);

        expect(getCornersSpy.calls.count()).toBe(1);

        expect(cacheBoundingBoxSpy.calls.count()).toBe(1);
        expect(cacheBoundingBoxSpy.calls.first().args[0].lat).toBe(-1);
        expect(cacheBoundingBoxSpy.calls.first().args[0].lon).toBe(0);
        expect(cacheBoundingBoxSpy.calls.first().args[1].lat).toBe(1);
        expect(cacheBoundingBoxSpy.calls.first().args[1].lon).toBe(2);
    });

    it("should be caching tile", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheBoundingBox$: Subject<Node[]> = new Subject<Node[]>();
        const cacheBoundingBoxSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheBoundingBox$;
        cacheBoundingBoxSpy.and.returnValue(cacheBoundingBox$);

        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();

        const getCornersSpy: jasmine.Spy = spyOn(geometryProvider, "getCorners");
        getCornersSpy.and.returnValue({
            nw: { lat: 1, lon: 0 },
            ne: { lat: 1, lon: 2 },
            se: { lat: -1, lon: 2 },
            sw: { lat: -1, lon: 0 },
        });

        const dataProvider: IDataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const cache: SpatialDataCache = new SpatialDataCache(
            graphService, dataProvider);

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

        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();

        const getCornersSpy: jasmine.Spy = spyOn(geometryProvider, "getCorners");
        getCornersSpy.and.returnValue({
            nw: { lat: 1, lon: 0 },
            ne: { lat: 1, lon: 2 },
            se: { lat: -1, lon: 2 },
            sw: { lat: -1, lon: 0 },
        });

        const dataProvider: IDataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const cache: SpatialDataCache = new SpatialDataCache(
            graphService, dataProvider);

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

        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();

        const getCornersSpy: jasmine.Spy = spyOn(geometryProvider, "getCorners");
        getCornersSpy.and.returnValue({
            nw: { lat: 1, lon: 0 },
            ne: { lat: 1, lon: 2 },
            se: { lat: -1, lon: 2 },
            sw: { lat: -1, lon: 0 },
        });

        const dataProvider: IDataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const cache: SpatialDataCache = new SpatialDataCache(
            graphService, dataProvider);

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

            cache.cacheTile$(hash)
                .subscribe();

            cacheBoundingBox$.next(nodes);

            expect(cache.hasTile(hash)).toBe(true);
        };

    it("should cache a reconstruction", (done: Function) => {
        const node: Node = new NodeHelper().createNode();
        const hash: string = "00000000";

        let resolver: Function;
        const promise: any = {
            then: (resolve: (result: any) => void): void => {
                resolver = resolve;
            },
        };

        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();

        const getCornersSpy: jasmine.Spy = spyOn(geometryProvider, "getCorners");
        getCornersSpy.and.returnValue({
            nw: { lat: 1, lon: 0 },
            ne: { lat: 1, lon: 2 },
            se: { lat: -1, lon: 2 },
            sw: { lat: -1, lon: 0 },
        });

        const dataProvider: IDataProvider = new FalcorDataProvider(
            { clientToken: "cid" }, geometryProvider);
        spyOn(dataProvider, "getClusterReconstruction").and.returnValue(promise);

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialDataCache = new SpatialDataCache(graphService, dataProvider);

        cacheTile(hash, cache, graphService, [node]);

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

        resolver({ key: node.clusterKey });
    });

    it("should not have an errored reconstruction", (done: Function) => {
        spyOn(console, "error").and.stub();

        const node: Node = new NodeHelper().createNode();
        const hash: string = "00000000";

        let rejecter: Function;
        const promise: any = {
            then: (_: (result: any) => void, reject: (error: Error) => void): void => {
                rejecter = reject;
            },
        };

        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();

        const getCornersSpy: jasmine.Spy = spyOn(geometryProvider, "getCorners");
        getCornersSpy.and.returnValue({
            nw: { lat: 1, lon: 0 },
            ne: { lat: 1, lon: 2 },
            se: { lat: -1, lon: 2 },
            sw: { lat: -1, lon: 0 },
        });

        const dataProvider: IDataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        spyOn(dataProvider, "getClusterReconstruction").and.returnValue(promise);

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialDataCache = new SpatialDataCache(graphService, dataProvider);

        cacheTile(hash, cache, graphService, [node]);

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

        rejecter(new Error("reject"));
    });

    it("should abort on uncache", (done: Function) => {
        const node: Node = new NodeHelper().createNode();
        const hash: string = "00000000";

        const promise: any = {
            then: (): void => { /*noop*/ },
        };

        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();

        const getCornersSpy: jasmine.Spy = spyOn(geometryProvider, "getCorners");
        getCornersSpy.and.returnValue({
            nw: { lat: 1, lon: 0 },
            ne: { lat: 1, lon: 2 },
            se: { lat: -1, lon: 2 },
            sw: { lat: -1, lon: 0 },
        });

        const dataProvider: IDataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const clusterSpy: jasmine.Spy = spyOn(dataProvider, "getClusterReconstruction");
        clusterSpy.and.returnValue(promise);

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialDataCache = new SpatialDataCache(graphService, dataProvider);

        cacheTile(hash, cache, graphService, [node]);

        cache.cacheClusterReconstructions$(hash)
            .subscribe();

        expect(clusterSpy.calls.count()).toBe(1);
        const abort: Promise<void> = clusterSpy.calls.mostRecent().args[1];

        abort.catch(
            (): void => {
                done();
            });

        cache.uncache();
    });

    it("should only request reconstruction once if called twice before completing", () => {
        const node: Node = new NodeHelper().createNode();
        const hash: string = "00000000";

        let resolver: Function;
        const promise: any = {
            then: (resolve: (value: IClusterReconstruction) => void): void => {
                resolver = resolve;
            },
        };

        const geometryProvider: IGeometryProvider = new GeohashGeometryProvider();

        const getCornersSpy: jasmine.Spy = spyOn(geometryProvider, "getCorners");
        getCornersSpy.and.returnValue({
            nw: { lat: 1, lon: 0 },
            ne: { lat: 1, lon: 2 },
            se: { lat: -1, lon: 2 },
            sw: { lat: -1, lon: 0 },
        });

        const dataProvider: IDataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const clusterSpy: jasmine.Spy = spyOn(dataProvider, "getClusterReconstruction");
        clusterSpy.and.returnValue(promise);

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialDataCache = new SpatialDataCache(graphService, dataProvider);

        cacheTile(hash, cache, graphService, [node]);

        let emitCount1: number = 0;
        cache.cacheClusterReconstructions$(hash)
            .subscribe(
                (): void => {
                    emitCount1++;
                });

        expect(clusterSpy.calls.count()).toBe(1);

        let emitCount2: number = 0;
        cache.cacheClusterReconstructions$(hash)
            .subscribe(
                (): void => {
                    emitCount2++;
                });

        expect(emitCount1).toBe(0);
        expect(emitCount2).toBe(0);

        resolver({
            key: node.clusterKey,
            points: [],
            refererence_lla: { altitude: 0, latitude: 0, longitude: 0 },
        });

        expect(emitCount1).toBe(1);
        expect(emitCount2).toBe(1);

        expect(clusterSpy.calls.count()).toBe(1);

        expect(cache.isCachingClusterReconstructions(hash)).toBe(false);
        expect(cache.hasClusterReconstructions(hash)).toBe(true);
        expect(cache.getClusterReconstructions(hash).length).toBe(1);
        expect(cache.getClusterReconstructions(hash)[0].key).toBe(node.clusterKey);
    });
});
