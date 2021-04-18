import {
    empty as observableEmpty,
    from as observableFrom,
    of as observableOf,
    Observable,
    Subscriber,
} from "rxjs";

import {
    catchError,
    finalize,
    filter,
    mergeMap,
    publish,
    refCount,
    tap,
} from "rxjs/operators";

import { DataProviderBase } from "../../api/DataProviderBase";
import { ClusterContract } from "../../api/contracts/ClusterContract";
import { AbortMapillaryError } from "../../error/AbortMapillaryError";
import { GraphService } from "../../graph/GraphService";
import { Image } from "../../graph/Image";

type ClusterData = {
    key: string;
    url: string;
}

export class SpatialCache {
    private _graphService: GraphService;
    private _data: DataProviderBase;

    private _cacheRequests: { [hash: string]: Function[] };
    private _tiles: { [hash: string]: Image[] };

    private _clusters: { [key: string]: ClusterContract };
    private _clusterTiles: { [key: string]: string[] };
    private _tileClusters: { [hash: string]: ClusterData[] };

    private _cachingClusters$: { [hash: string]: Observable<ClusterContract> };
    private _cachingTiles$: { [hash: string]: Observable<Image[]> };

    constructor(graphService: GraphService, provider: DataProviderBase) {
        this._graphService = graphService;
        this._data = provider;

        this._tiles = {};
        this._cacheRequests = {};

        this._clusters = {};
        this._clusterTiles = {};
        this._tileClusters = {};

        this._cachingTiles$ = {};
        this._cachingClusters$ = {};
    }

    public cacheClusters$(hash: string): Observable<ClusterContract> {
        if (!this.hasTile(hash)) {
            throw new Error("Cannot cache reconstructions of a non-existing tile.");
        }

        if (this.hasClusters(hash)) {
            throw new Error("Cannot cache reconstructions that already exists.");
        }

        if (this.isCachingClusters(hash)) {
            return this._cachingClusters$[hash];
        }

        const duplicatedClusters: ClusterData[] = this.getTile(hash)
            .filter(
                (n: Image): boolean => {
                    return !!n.clusterId && !!n.clusterUrl;
                })
            .map(
                (n: Image): ClusterData => {
                    return { key: n.clusterId, url: n.clusterUrl };
                });

        const clusters: ClusterData[] = Array
            .from<ClusterData>(
                new Map(
                    duplicatedClusters.map(
                        (cd: ClusterData): [string, ClusterData] => {
                            return [cd.key, cd];
                        }))
                    .values());

        this._tileClusters[hash] = clusters;
        this._cacheRequests[hash] = [];

        let aborter: Function;
        const abort: Promise<void> = new Promise(
            (_, reject): void => {
                aborter = reject;
            });
        this._cacheRequests[hash].push(aborter);

        this._cachingClusters$[hash] =
            this._cacheClusters$(clusters, hash, abort).pipe(
                finalize(
                    (): void => {
                        if (hash in this._cachingClusters$) {
                            delete this._cachingClusters$[hash];
                        }

                        if (hash in this._cacheRequests) {
                            delete this._cacheRequests[hash];
                        }
                    }),
                publish(),
                refCount());

        return this._cachingClusters$[hash];
    }

    public cacheTile$(hash: string): Observable<Image[]> {
        if (this.hasTile(hash)) {
            throw new Error("Cannot cache tile that already exists.");
        }

        if (this.isCachingTile(hash)) {
            return this._cachingTiles$[hash];
        }

        this._cachingTiles$[hash] = this._graphService.cacheCell$(hash).pipe(
            catchError(
                (error: Error): Observable<Image[]> => {
                    console.error(error);

                    return observableEmpty();
                }),
            filter(
                (): boolean => {
                    return !(hash in this._tiles);
                }),
            tap(
                (images: Image[]): void => {
                    this._tiles[hash] = [];
                    this._tiles[hash].push(...images);

                    delete this._cachingTiles$[hash];
                }),
            finalize(
                (): void => {
                    if (hash in this._cachingTiles$) {
                        delete this._cachingTiles$[hash];
                    }
                }),
            publish(),
            refCount());

        return this._cachingTiles$[hash];
    }

    public isCachingClusters(hash: string): boolean {
        return hash in this._cachingClusters$;
    }

    public isCachingTile(hash: string): boolean {
        return hash in this._cachingTiles$;
    }

    public hasClusters(hash: string): boolean {
        if (hash in this._cachingClusters$ ||
            !(hash in this._tileClusters)) {
            return false;
        }

        for (const cd of this._tileClusters[hash]) {
            if (!(cd.key in this._clusters)) {
                return false;
            }
        }

        return true;
    }

    public hasTile(hash: string): boolean {
        return !(hash in this._cachingTiles$) && hash in this._tiles;
    }

    public getClusters(hash: string): ClusterContract[] {
        return hash in this._tileClusters ?
            this._tileClusters[hash]
                .map(
                    (cd: ClusterData): ClusterContract => {
                        return this._clusters[cd.key];
                    })
                .filter(
                    (reconstruction: ClusterContract): boolean => {
                        return !!reconstruction;
                    }) :
            [];
    }

    public getTile(hash: string): Image[] {
        return hash in this._tiles ? this._tiles[hash] : [];
    }

    public uncache(keepHashes?: string[]): void {
        for (let hash of Object.keys(this._cacheRequests)) {
            if (!!keepHashes && keepHashes.indexOf(hash) !== -1) {
                continue;
            }

            for (const aborter of this._cacheRequests[hash]) {
                aborter();
            }

            delete this._cacheRequests[hash];
        }

        for (let hash of Object.keys(this._tileClusters)) {
            if (!!keepHashes && keepHashes.indexOf(hash) !== -1) {
                continue;
            }

            for (const cd of this._tileClusters[hash]) {
                if (!(cd.key in this._clusterTiles)) {
                    continue;
                }

                const index: number = this._clusterTiles[cd.key].indexOf(hash);
                if (index === -1) {
                    continue;
                }

                this._clusterTiles[cd.key].splice(index, 1);

                if (this._clusterTiles[cd.key].length > 0) {
                    continue;
                }

                delete this._clusterTiles[cd.key];
                delete this._clusters[cd.key];
            }

            delete this._tileClusters[hash];
        }

        for (let hash of Object.keys(this._tiles)) {
            if (!!keepHashes && keepHashes.indexOf(hash) !== -1) {
                continue;
            }

            delete this._tiles[hash];
        }
    }

    public updateCell$(hash: string): Observable<Image[]> {
        if (!this.hasTile(hash)) {
            throw new Error("Cannot update tile that does not exists.");
        }

        return this._graphService.cacheCell$(hash).pipe(
            catchError(
                (error: Error): Observable<Image[]> => {
                    console.error(error);

                    return observableEmpty();
                }),
            filter(
                (): boolean => {
                    return hash in this._tiles;
                }),
            tap(
                (images: Image[]): void => {
                    this._tiles[hash] = [];
                    this._tiles[hash].push(...images);
                }),
            publish(),
            refCount());
    }

    public updateClusters$(hash: string):
        Observable<ClusterContract> {
        if (!this.hasTile(hash)) {
            throw new Error("Cannot update reconstructions of a non-existing tile.");
        }

        if (!this.hasClusters(hash)) {
            throw new Error("Cannot update reconstructions for cell that is not cached.");
        }

        const duplicatedClusters: ClusterData[] = this.getTile(hash)
            .filter(
                (n: Image): boolean => {
                    return !!n.clusterId && !!n.clusterUrl;
                })
            .map(
                (n: Image): ClusterData => {
                    return { key: n.clusterId, url: n.clusterUrl };
                });

        const clusters: ClusterData[] = Array
            .from<ClusterData>(
                new Map(
                    duplicatedClusters.map(
                        (cd: ClusterData): [string, ClusterData] => {
                            return [cd.key, cd];
                        }))
                    .values())
            .filter(cd => {
                return !(cd.key in this._clusters);
            });

        this._tileClusters[hash].push(...clusters);

        return this._cacheClusters$(clusters, hash, null);
    }

    private _cacheClusters$(
        clusters: ClusterData[],
        cellId: string,
        cancellation: Promise<void>): Observable<ClusterContract> {
        return observableFrom(clusters).pipe(
            mergeMap(
                (cd: ClusterData): Observable<ClusterContract> => {
                    if (this._hasCluster(cd.key)) {
                        return observableOf(
                            this._getCluster(cd.key));
                    }

                    return this._getCluster$(
                        cd.url,
                        cd.key,
                        cancellation)
                        .pipe(
                            catchError(
                                (error: Error): Observable<ClusterContract> => {
                                    if (error instanceof AbortMapillaryError) {
                                        return observableEmpty();
                                    }

                                    console.error(error);
                                    return observableEmpty();
                                }));
                },
                6),
            filter(
                (): boolean => {
                    return cellId in this._tileClusters;
                }),
            tap(
                (reconstruction: ClusterContract): void => {
                    if (!this._hasCluster(reconstruction.id)) {
                        this._clusters[reconstruction.id] = reconstruction;
                    }

                    if (!(reconstruction.id in this._clusterTiles)) {
                        this._clusterTiles[reconstruction.id] = [];
                    }

                    if (this._clusterTiles[reconstruction.id].indexOf(cellId) === -1) {
                        this._clusterTiles[reconstruction.id].push(cellId);
                    }
                }))
    }

    private _getCluster(id: string): ClusterContract {
        return this._clusters[id];
    }

    private _getCluster$(url: string, clusterId: string, abort: Promise<void>): Observable<ClusterContract> {
        return Observable.create(
            (subscriber: Subscriber<ClusterContract>): void => {
                this._data.getCluster(url, abort)
                    .then(
                        (reconstruction: ClusterContract): void => {
                            reconstruction.id = clusterId;
                            subscriber.next(reconstruction);
                            subscriber.complete();
                        },
                        (error: Error): void => {
                            subscriber.error(error);
                        });
            });
    }

    private _hasCluster(id: string): boolean {
        return id in this._clusters;
    }
}
