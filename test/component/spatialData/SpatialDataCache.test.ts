import { Subject } from "rxjs";

import { Image } from "../../../src/graph/Image";
import { FalcorDataProvider } from "../../../src/api/falcor/FalcorDataProvider";
import { GeohashGeometryProvider } from "../../../src/api/GeohashGeometryProvider";
import { ClusterReconstructionContract } from "../../../src/api/contracts/ClusterReconstructionContract";
import { SpatialDataCache } from "../../../src/component/spatialdata/SpatialDataCache";
import { GraphService } from "../../../src/graph/GraphService";
import { GraphServiceMockCreator } from "../../helper/GraphServiceMockCreator";
import { ImageHelper } from "../../helper/ImageHelper";

const cacheTile: (
    hash: string,
    cache: SpatialDataCache,
    graphService: GraphService,
    images: Image[]) => void = (
        hash: string,
        cache: SpatialDataCache,
        graphService: GraphService,
        images: Image[]): void => {

        const cacheCell$: Subject<Image[]> = new Subject<Image[]>();
        const cacheCellSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell$);

        cache.cacheTile$(hash)
            .subscribe();

        cacheCell$.next(images);

        expect(cache.hasTile(hash)).toBe(true);
    };

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
        const cacheCell$: Subject<Image[]> = new Subject<Image[]>();
        const cacheCellSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell$);

        const geometryProvider = new GeohashGeometryProvider();

        const dataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const cache: SpatialDataCache = new SpatialDataCache(
            graphService, dataProvider);

        const hash: string = "12345678";
        cache.cacheTile$(hash);

        expect(cacheCellSpy.calls.count()).toBe(1);
        expect(cacheCellSpy.calls.first().args[0]).toBe(hash);
    });

    it("should be caching tile", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheCell$: Subject<Image[]> = new Subject<Image[]>();
        const cacheCellSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell$);

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const cache: SpatialDataCache = new SpatialDataCache(
            graphService, dataProvider);

        const hash: string = "00000000";

        expect(cache.isCachingTile(hash)).toBe(false);

        cache.cacheTile$(hash);

        expect(cache.isCachingTile(hash)).toBe(true);
    });

    it("should cache tile", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheCell$: Subject<Image[]> = new Subject<Image[]>();
        const cacheCellSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell$);

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" }, geometryProvider);
        const cache: SpatialDataCache = new SpatialDataCache(
            graphService, dataProvider);

        const hash: string = "00000000";

        expect(cache.hasTile(hash)).toBe(false);

        cache.cacheTile$(hash)
            .subscribe();

        const image: Image = new ImageHelper().createImage();
        cacheCell$.next([image]);

        expect(cache.isCachingTile(hash)).toBe(false);
        expect(cache.hasTile(hash)).toBe(true);
        expect(cache.getTile(hash).length).toBe(1);
        expect(cache.getTile(hash)[0].id).toBe(image.id);
    });

    it("should catch error", (done: Function) => {
        spyOn(console, "error").and.stub();

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheCell$: Subject<Image[]> = new Subject<Image[]>();
        const cacheCellSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell$);

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const cache: SpatialDataCache = new SpatialDataCache(
            graphService, dataProvider);

        const hash: string = "00000000";

        cache.cacheTile$(hash)
            .subscribe();

        cacheCell$.error(new Error());

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
    it("should cache a reconstruction", (done: Function) => {
        const image: Image = new ImageHelper().createImage();
        const hash: string = "00000000";

        let resolver: Function;
        const promise: any = {
            then: (resolve: (result: any) => void): void => {
                resolver = resolve;
            },
        };

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" }, geometryProvider);
        spyOn(dataProvider, "getClusterReconstruction").and.returnValue(promise);

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialDataCache = new SpatialDataCache(graphService, dataProvider);

        cacheTile(hash, cache, graphService, [image]);

        let emitCount: number = 0;
        cache.cacheClusterReconstructions$(hash)
            .subscribe(
                (r: ClusterReconstructionContract): void => {
                    expect(r.id).toBe(image.clusterId);
                    emitCount++;
                },
                undefined,
                (): void => {
                    expect(emitCount).toBe(1);
                    expect(cache.hasClusterReconstructions(hash)).toBe(true);
                    done();
                });

        resolver({ key: image.clusterId });
    });

    it("should not have an errored reconstruction", (done: Function) => {
        spyOn(console, "error").and.stub();

        const image: Image = new ImageHelper().createImage();
        const hash: string = "00000000";

        let rejecter: Function;
        const promise: any = {
            then: (_: (result: any) => void, reject: (error: Error) => void): void => {
                rejecter = reject;
            },
        };

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        spyOn(dataProvider, "getClusterReconstruction").and.returnValue(promise);

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialDataCache = new SpatialDataCache(graphService, dataProvider);

        cacheTile(hash, cache, graphService, [image]);

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
        const image: Image = new ImageHelper().createImage();
        const hash: string = "00000000";

        const promise: any = {
            then: (): void => { /*noop*/ },
        };

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const clusterSpy: jasmine.Spy = spyOn(dataProvider, "getClusterReconstruction");
        clusterSpy.and.returnValue(promise);

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialDataCache = new SpatialDataCache(graphService, dataProvider);

        cacheTile(hash, cache, graphService, [image]);

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
        const image: Image = new ImageHelper().createImage();
        const hash: string = "00000000";

        let resolver: Function;
        const promise: any = {
            then: (resolve: (value: ClusterReconstructionContract) => void): void => {
                resolver = resolve;
            },
        };

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const clusterSpy: jasmine.Spy = spyOn(dataProvider, "getClusterReconstruction");
        clusterSpy.and.returnValue(promise);

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialDataCache = new SpatialDataCache(graphService, dataProvider);

        cacheTile(hash, cache, graphService, [image]);

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
            key: image.clusterId,
            points: [],
            refererence_lla: { altitude: 0, latitude: 0, longitude: 0 },
        });

        expect(emitCount1).toBe(1);
        expect(emitCount2).toBe(1);

        expect(clusterSpy.calls.count()).toBe(1);

        expect(cache.isCachingClusterReconstructions(hash)).toBe(false);
        expect(cache.hasClusterReconstructions(hash)).toBe(true);
        expect(cache.getClusterReconstructions(hash).length).toBe(1);
        expect(cache.getClusterReconstructions(hash)[0].id).toBe(image.clusterId);
    });
});

describe("SpatialDataCache.updateCell$", () => {
    it("should throw if cell does not exist", () => {
        const graphService = new GraphServiceMockCreator().create();
        const cacheCell$ = new Subject<Image[]>();
        const cacheCellSpy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell$);

        const geometryProvider = new GeohashGeometryProvider();

        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const cache: SpatialDataCache = new SpatialDataCache(
            graphService, dataProvider);

        const cellId = "1";

        expect(() => cache.updateCell$(cellId)).toThrowError(Error);
    });

    it("should call to update cell", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheCell1$: Subject<Image[]> = new Subject<Image[]>();
        const cacheCellSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell1$);

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const cache: SpatialDataCache = new SpatialDataCache(
            graphService, dataProvider);

        const cellId = "1";
        cache.cacheTile$(cellId).subscribe();

        const image = new ImageHelper().createImage();
        cacheCell1$.next([image]);
        cacheCell1$.complete();

        expect(cache.hasTile(cellId)).toBe(true);

        const cacheCell2$: Subject<Image[]> = new Subject<Image[]>();
        cacheCellSpy.and.returnValue(cacheCell2$);

        cache.updateCell$(cellId).subscribe();

        cacheCell2$.next([image]);

        expect(cache.hasTile(cellId)).toBe(true);
        expect(cacheCellSpy.calls.count()).toBe(2);
        expect(cache.getTile(cellId).length).toBe(1);
        expect(cache.getTile(cellId)[0].id).toBe(image.id);
    });

    it("should add new images to cell", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheCell1$: Subject<Image[]> = new Subject<Image[]>();
        const cacheCellSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell1$);

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const cache: SpatialDataCache = new SpatialDataCache(
            graphService, dataProvider);

        const cellId = "1";
        cache.cacheTile$(cellId).subscribe();

        cacheCell1$.next([]);
        cacheCell1$.complete();

        expect(cache.hasTile(cellId)).toBe(true);
        expect(cache.getTile(cellId).length).toBe(0);

        const cacheCell2$: Subject<Image[]> = new Subject<Image[]>();
        cacheCellSpy.and.returnValue(cacheCell2$);

        cache.updateCell$(cellId).subscribe();

        const image = new ImageHelper().createImage();
        cacheCell2$.next([image]);

        expect(cache.getTile(cellId).length).toBe(1);
        expect(cache.getTile(cellId)[0].id).toBe(image.id);
    });
});

describe("SpatialDataCache.updateReconstructions$", () => {
    const createCluster = (key: string): ClusterReconstructionContract => {
        return {
            cameras: {},
            id: key,
            points: {},
            reference: { lat: 0, lon: 0, alt: 0 },
            shots: {},
        }
    }

    it("should throw when tile not cached", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" }, geometryProvider);
        spyOn(dataProvider, "getClusterReconstruction").and
            .returnValue(
                new Promise<ClusterReconstructionContract>(() => { /* noop */ }));

        const graphService = new GraphServiceMockCreator().create();
        const cache = new SpatialDataCache(graphService, dataProvider);

        expect(() => cache.updateClusterReconstructions$("123")).toThrowError();
    });

    it("should not request an existing reconstruction", done => {
        const image = new ImageHelper().createImage();
        const cellId = "123";

        let resolver: Function;
        const promise: any = {
            then: (resolve: (value: ClusterReconstructionContract) => void): void => {
                resolver = resolve;
            },
        };

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" }, geometryProvider);
        const clusterSpy = spyOn(dataProvider, "getClusterReconstruction").and
            .returnValue(promise);

        const graphService = new GraphServiceMockCreator().create();
        const cache = new SpatialDataCache(graphService, dataProvider);

        cacheTile(cellId, cache, graphService, [image]);

        cache.cacheClusterReconstructions$(cellId).subscribe();

        const cluster = createCluster(image.clusterId);
        resolver(cluster);

        expect(cache.hasClusterReconstructions(cellId)).toBe(true);
        expect(clusterSpy.calls.count()).toBe(1);

        cache.updateClusterReconstructions$("123")
            .subscribe(
                undefined,
                undefined,
                () => {
                    expect(cache.hasClusterReconstructions(cellId)).toBe(true);
                    expect(clusterSpy.calls.count()).toBe(1);
                    done();
                });
    });

    it("should request a new cluster reconstruction", done => {
        const cellId = "123";

        let resolver: Function;
        const promise: any = {
            then: (resolve: (value: ClusterReconstructionContract) => void): void => {
                resolver = resolve;
            },
        };

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" }, geometryProvider);
        const clusterSpy = spyOn(dataProvider, "getClusterReconstruction").and
            .returnValue(promise);

        const graphService = new GraphServiceMockCreator().create();
        const cache = new SpatialDataCache(graphService, dataProvider);

        cacheTile(cellId, cache, graphService, []);

        expect(cache.getTile(cellId).length).toBe(0);

        cache.cacheClusterReconstructions$(cellId).subscribe();

        expect(cache.hasClusterReconstructions(cellId)).toBe(true);
        expect(cache.getClusterReconstructions(cellId).length).toBe(0);
        expect(clusterSpy.calls.count()).toBe(0);

        const cacheCell$ = new Subject<Image[]>();
        const cacheCellSpy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell$);

        cache.updateCell$(cellId)
            .subscribe();

        const image = new ImageHelper().createImage();
        cacheCell$.next([image]);

        expect(cache.getTile(cellId).length).toBe(1);

        cache.updateClusterReconstructions$("123")
            .subscribe(
                undefined,
                undefined,
                () => {
                    expect(cache.hasClusterReconstructions(cellId)).toBe(true);
                    const cs = cache.getClusterReconstructions(cellId);
                    expect(cs.length).toBe(1);
                    expect(cs[0].id).toBe(image.clusterId);
                    expect(clusterSpy.calls.count()).toBe(1);
                    done();
                });

        const cluster = createCluster(image.clusterId);
        resolver(cluster);
    });
});
