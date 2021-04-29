import { Subject } from "rxjs";

import { Image } from "../../../src/graph/Image";
import { FalcorDataProvider } from "../../../src/api/falcor/FalcorDataProvider";
import { GeohashGeometryProvider } from "../../../src/api/GeohashGeometryProvider";
import { ClusterContract } from "../../../src/api/contracts/ClusterContract";
import { SpatialCache } from "../../../src/component/spatial/SpatialCache";
import { GraphService } from "../../../src/graph/GraphService";
import { GraphServiceMockCreator } from "../../helper/GraphServiceMockCreator";
import { ImageHelper } from "../../helper/ImageHelper";

const cacheTile: (
    hash: string,
    cache: SpatialCache,
    graphService: GraphService,
    images: Image[]) => void = (
        hash: string,
        cache: SpatialCache,
        graphService: GraphService,
        images: Image[]): void => {

        const cacheCell$: Subject<Image[]> = new Subject<Image[]>();
        const cacheCellSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell$);

        cache.cacheCell$(hash)
            .subscribe();

        cacheCell$.next(images);

        expect(cache.hasCell(hash)).toBe(true);
    };

describe("SpatialCache.ctor", () => {
    it("should be defined", () => {
        const cache: SpatialCache =
            new SpatialCache(
                new GraphServiceMockCreator().create(),
                undefined);

        expect(cache).toBeDefined();
    });
});

describe("SpatialCache.cacheTile$", () => {
    it("should call cache bounding box", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheCell$: Subject<Image[]> = new Subject<Image[]>();
        const cacheCellSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell$);

        const geometryProvider = new GeohashGeometryProvider();

        const dataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const cache: SpatialCache = new SpatialCache(
            graphService, dataProvider);

        const hash: string = "12345678";
        cache.cacheCell$(hash);

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
        const cache: SpatialCache = new SpatialCache(
            graphService, dataProvider);

        const hash: string = "00000000";

        expect(cache.isCachingCell(hash)).toBe(false);

        cache.cacheCell$(hash);

        expect(cache.isCachingCell(hash)).toBe(true);
    });

    it("should cache tile", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheCell$: Subject<Image[]> = new Subject<Image[]>();
        const cacheCellSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell$);

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" }, geometryProvider);
        const cache: SpatialCache = new SpatialCache(
            graphService, dataProvider);

        const hash: string = "00000000";

        expect(cache.hasCell(hash)).toBe(false);

        cache.cacheCell$(hash)
            .subscribe();

        const image: Image = new ImageHelper().createImage();
        cacheCell$.next([image]);

        expect(cache.isCachingCell(hash)).toBe(false);
        expect(cache.hasCell(hash)).toBe(true);
        expect(cache.getCell(hash).length).toBe(1);
        expect(cache.getCell(hash)[0].id).toBe(image.id);
    });

    it("should catch error", (done: Function) => {
        spyOn(console, "error").and.stub();

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheCell$: Subject<Image[]> = new Subject<Image[]>();
        const cacheCellSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell$);

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const cache: SpatialCache = new SpatialCache(
            graphService, dataProvider);

        const hash: string = "00000000";

        cache.cacheCell$(hash)
            .subscribe();

        cacheCell$.error(new Error());

        expect(cache.isCachingCell(hash)).toBe(false);
        expect(cache.hasCell(hash)).toBe(false);

        let tileEmitCount: number = 0;
        cache.cacheCell$(hash)
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

describe("SpatialCache.cacheReconstructions$", () => {
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
        spyOn(dataProvider, "getCluster").and.returnValue(promise);

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialCache = new SpatialCache(graphService, dataProvider);

        cacheTile(hash, cache, graphService, [image]);

        let emitCount: number = 0;
        cache.cacheClusters$(hash)
            .subscribe(
                (r: ClusterContract): void => {
                    expect(r.id).toBe(image.clusterId);
                    emitCount++;
                },
                undefined,
                (): void => {
                    expect(emitCount).toBe(1);
                    expect(cache.hasClusters(hash)).toBe(true);
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
        spyOn(dataProvider, "getCluster").and.returnValue(promise);

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialCache = new SpatialCache(graphService, dataProvider);

        cacheTile(hash, cache, graphService, [image]);

        let emitCount: number = 0;
        cache.cacheClusters$(hash)
            .subscribe(
                (): void => {
                    emitCount++;
                },
                undefined,
                (): void => {
                    expect(emitCount).toBe(0);
                    expect(cache.hasClusters(hash)).toBe(false);
                    expect(cache.getClusters(hash).length).toBe(0);
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
        const clusterSpy: jasmine.Spy = spyOn(dataProvider, "getCluster");
        clusterSpy.and.returnValue(promise);

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialCache = new SpatialCache(graphService, dataProvider);

        cacheTile(hash, cache, graphService, [image]);

        cache.cacheClusters$(hash)
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
            then: (resolve: (value: ClusterContract) => void): void => {
                resolver = resolve;
            },
        };

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const clusterSpy: jasmine.Spy = spyOn(dataProvider, "getCluster");
        clusterSpy.and.returnValue(promise);

        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cache: SpatialCache = new SpatialCache(graphService, dataProvider);

        cacheTile(hash, cache, graphService, [image]);

        let emitCount1: number = 0;
        cache.cacheClusters$(hash)
            .subscribe(
                (): void => {
                    emitCount1++;
                });

        expect(clusterSpy.calls.count()).toBe(1);

        let emitCount2: number = 0;
        cache.cacheClusters$(hash)
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

        expect(cache.isCachingClusters(hash)).toBe(false);
        expect(cache.hasClusters(hash)).toBe(true);
        expect(cache.getClusters(hash).length).toBe(1);
        expect(cache.getClusters(hash)[0].id).toBe(image.clusterId);
    });
});

describe("SpatialCache.updateCell$", () => {
    it("should throw if cell does not exist", () => {
        const graphService = new GraphServiceMockCreator().create();
        const cacheCell$ = new Subject<Image[]>();
        const cacheCellSpy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell$);

        const geometryProvider = new GeohashGeometryProvider();

        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" },
            geometryProvider);
        const cache: SpatialCache = new SpatialCache(
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
        const cache: SpatialCache = new SpatialCache(
            graphService, dataProvider);

        const cellId = "1";
        cache.cacheCell$(cellId).subscribe();

        const image = new ImageHelper().createImage();
        cacheCell1$.next([image]);
        cacheCell1$.complete();

        expect(cache.hasCell(cellId)).toBe(true);

        const cacheCell2$: Subject<Image[]> = new Subject<Image[]>();
        cacheCellSpy.and.returnValue(cacheCell2$);

        cache.updateCell$(cellId).subscribe();

        cacheCell2$.next([image]);

        expect(cache.hasCell(cellId)).toBe(true);
        expect(cacheCellSpy.calls.count()).toBe(2);
        expect(cache.getCell(cellId).length).toBe(1);
        expect(cache.getCell(cellId)[0].id).toBe(image.id);
    });

    it("should add new images to cell", () => {
        const graphService: GraphService = new GraphServiceMockCreator().create();
        const cacheCell1$: Subject<Image[]> = new Subject<Image[]>();
        const cacheCellSpy: jasmine.Spy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell1$);

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider({ clientToken: "cid" }, geometryProvider);
        const cache: SpatialCache = new SpatialCache(
            graphService, dataProvider);

        const cellId = "1";
        cache.cacheCell$(cellId).subscribe();

        cacheCell1$.next([]);
        cacheCell1$.complete();

        expect(cache.hasCell(cellId)).toBe(true);
        expect(cache.getCell(cellId).length).toBe(0);

        const cacheCell2$: Subject<Image[]> = new Subject<Image[]>();
        cacheCellSpy.and.returnValue(cacheCell2$);

        cache.updateCell$(cellId).subscribe();

        const image = new ImageHelper().createImage();
        cacheCell2$.next([image]);

        expect(cache.getCell(cellId).length).toBe(1);
        expect(cache.getCell(cellId)[0].id).toBe(image.id);
    });
});

describe("SpatialCache.updateReconstructions$", () => {
    const createCluster = (key: string): ClusterContract => {
        return {
            id: key,
            points: {},
            reference: { lat: 0, lng: 0, alt: 0 },
        }
    }

    it("should throw when tile not cached", () => {
        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" }, geometryProvider);
        spyOn(dataProvider, "getCluster").and
            .returnValue(
                new Promise<ClusterContract>(() => { /* noop */ }));

        const graphService = new GraphServiceMockCreator().create();
        const cache = new SpatialCache(graphService, dataProvider);

        expect(() => cache.updateClusters$("123")).toThrowError();
    });

    it("should not request an existing reconstruction", done => {
        const image = new ImageHelper().createImage();
        const cellId = "123";

        let resolver: Function;
        const promise: any = {
            then: (resolve: (value: ClusterContract) => void): void => {
                resolver = resolve;
            },
        };

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" }, geometryProvider);
        const clusterSpy = spyOn(dataProvider, "getCluster").and
            .returnValue(promise);

        const graphService = new GraphServiceMockCreator().create();
        const cache = new SpatialCache(graphService, dataProvider);

        cacheTile(cellId, cache, graphService, [image]);

        cache.cacheClusters$(cellId).subscribe();

        const cluster = createCluster(image.clusterId);
        resolver(cluster);

        expect(cache.hasClusters(cellId)).toBe(true);
        expect(clusterSpy.calls.count()).toBe(1);

        cache.updateClusters$("123")
            .subscribe(
                undefined,
                undefined,
                () => {
                    expect(cache.hasClusters(cellId)).toBe(true);
                    expect(clusterSpy.calls.count()).toBe(1);
                    done();
                });
    });

    it("should request a new cluster reconstruction", done => {
        const cellId = "123";

        let resolver: Function;
        const promise: any = {
            then: (resolve: (value: ClusterContract) => void): void => {
                resolver = resolve;
            },
        };

        const geometryProvider = new GeohashGeometryProvider();
        const dataProvider = new FalcorDataProvider(
            { clientToken: "cid" }, geometryProvider);
        const clusterSpy = spyOn(dataProvider, "getCluster").and
            .returnValue(promise);

        const graphService = new GraphServiceMockCreator().create();
        const cache = new SpatialCache(graphService, dataProvider);

        cacheTile(cellId, cache, graphService, []);

        expect(cache.getCell(cellId).length).toBe(0);

        cache.cacheClusters$(cellId).subscribe();

        expect(cache.hasClusters(cellId)).toBe(true);
        expect(cache.getClusters(cellId).length).toBe(0);
        expect(clusterSpy.calls.count()).toBe(0);

        const cacheCell$ = new Subject<Image[]>();
        const cacheCellSpy = <jasmine.Spy>graphService.cacheCell$;
        cacheCellSpy.and.returnValue(cacheCell$);

        cache.updateCell$(cellId)
            .subscribe();

        const image = new ImageHelper().createImage();
        cacheCell$.next([image]);

        expect(cache.getCell(cellId).length).toBe(1);

        cache.updateClusters$("123")
            .subscribe(
                undefined,
                undefined,
                () => {
                    expect(cache.hasClusters(cellId)).toBe(true);
                    const cs = cache.getClusters(cellId);
                    expect(cs.length).toBe(1);
                    expect(cs[0].id).toBe(image.clusterId);
                    expect(clusterSpy.calls.count()).toBe(1);
                    done();
                });

        const cluster = createCluster(image.clusterId);
        resolver(cluster);
    });
});
