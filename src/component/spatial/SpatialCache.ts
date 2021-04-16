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
import { ClusterReconstructionContract } from "../../api/contracts/ClusterReconstructionContract";
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

    private _clusterReconstructions: { [key: string]: ClusterReconstructionContract };
    private _clusterReconstructionTiles: { [key: string]: string[] };
    private _tileClusters: { [hash: string]: ClusterData[] };

    private _cachingClusterReconstructions$: { [hash: string]: Observable<ClusterReconstructionContract> };
    private _cachingTiles$: { [hash: string]: Observable<Image[]> };

    constructor(graphService: GraphService, provider: DataProviderBase) {
        this._graphService = graphService;
        this._data = provider;

        this._tiles = {};
        this._cacheRequests = {};

        this._clusterReconstructions = {};
        this._clusterReconstructionTiles = {};
        this._tileClusters = {};

        this._cachingTiles$ = {};
        this._cachingClusterReconstructions$ = {};
    }

    public cacheClusterReconstructions$(hash: string): Observable<ClusterReconstructionContract> {
        if (!this.hasTile(hash)) {
            throw new Error("Cannot cache reconstructions of a non-existing tile.");
        }

        if (this.hasClusterReconstructions(hash)) {
            throw new Error("Cannot cache reconstructions that already exists.");
        }

        if (this.isCachingClusterReconstructions(hash)) {
            return this._cachingClusterReconstructions$[hash];
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

        this._cachingClusterReconstructions$[hash] =
            this._cacheClusterReconstructions$(clusters, hash, abort).pipe(
                finalize(
                    (): void => {
                        if (hash in this._cachingClusterReconstructions$) {
                            delete this._cachingClusterReconstructions$[hash];
                        }

                        if (hash in this._cacheRequests) {
                            delete this._cacheRequests[hash];
                        }
                    }),
                publish(),
                refCount());

        return this._cachingClusterReconstructions$[hash];
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

    public isCachingClusterReconstructions(hash: string): boolean {
        return hash in this._cachingClusterReconstructions$;
    }

    public isCachingTile(hash: string): boolean {
        return hash in this._cachingTiles$;
    }

    public hasClusterReconstructions(hash: string): boolean {
        if (hash in this._cachingClusterReconstructions$ ||
            !(hash in this._tileClusters)) {
            return false;
        }

        for (const cd of this._tileClusters[hash]) {
            if (!(cd.key in this._clusterReconstructions)) {
                return false;
            }
        }

        return true;
    }

    public hasTile(hash: string): boolean {
        return !(hash in this._cachingTiles$) && hash in this._tiles;
    }

    public getClusterReconstructions(hash: string): ClusterReconstructionContract[] {
        return hash in this._tileClusters ?
            this._tileClusters[hash]
                .map(
                    (cd: ClusterData): ClusterReconstructionContract => {
                        return this._clusterReconstructions[cd.key];
                    })
                .filter(
                    (reconstruction: ClusterReconstructionContract): boolean => {
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
                if (!(cd.key in this._clusterReconstructionTiles)) {
                    continue;
                }

                const index: number = this._clusterReconstructionTiles[cd.key].indexOf(hash);
                if (index === -1) {
                    continue;
                }

                this._clusterReconstructionTiles[cd.key].splice(index, 1);

                if (this._clusterReconstructionTiles[cd.key].length > 0) {
                    continue;
                }

                delete this._clusterReconstructionTiles[cd.key];
                delete this._clusterReconstructions[cd.key];
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

    public updateClusterReconstructions$(hash: string):
        Observable<ClusterReconstructionContract> {
        if (!this.hasTile(hash)) {
            throw new Error("Cannot update reconstructions of a non-existing tile.");
        }

        if (!this.hasClusterReconstructions(hash)) {
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
                return !(cd.key in this._clusterReconstructions);
            });

        this._tileClusters[hash].push(...clusters);

        return this._cacheClusterReconstructions$(clusters, hash, null);
    }

    private _cacheClusterReconstructions$(
        clusters: ClusterData[],
        cellId: string,
        cancellation: Promise<void>): Observable<ClusterReconstructionContract> {
        return observableFrom(clusters).pipe(
            mergeMap(
                (cd: ClusterData): Observable<ClusterReconstructionContract> => {
                    if (this._hasClusterReconstruction(cd.key)) {
                        return observableOf(
                            this._getClusterReconstruction(cd.key));
                    }

                    return this._getClusterReconstruction$(
                        cd.url,
                        cd.key,
                        cancellation)
                        .pipe(
                            catchError(
                                (error: Error): Observable<ClusterReconstructionContract> => {
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
                (reconstruction: ClusterReconstructionContract): void => {
                    if (!this._hasClusterReconstruction(reconstruction.id)) {
                        this._clusterReconstructions[reconstruction.id] = reconstruction;
                    }

                    if (!(reconstruction.id in this._clusterReconstructionTiles)) {
                        this._clusterReconstructionTiles[reconstruction.id] = [];
                    }

                    if (this._clusterReconstructionTiles[reconstruction.id].indexOf(cellId) === -1) {
                        this._clusterReconstructionTiles[reconstruction.id].push(cellId);
                    }
                }))
    }

    private _getClusterReconstruction(id: string): ClusterReconstructionContract {
        return this._clusterReconstructions[id];
    }

    private _getClusterReconstruction$(url: string, clusterId: string, abort: Promise<void>): Observable<ClusterReconstructionContract> {
        return Observable.create(
            (subscriber: Subscriber<ClusterReconstructionContract>): void => {
                this._data.getClusterReconstruction(url, abort)
                    .then(
                        (reconstruction: ClusterReconstructionContract): void => {
                            reconstruction.id = clusterId;
                            subscriber.next(reconstruction);
                            subscriber.complete();
                        },
                        (error: Error): void => {
                            subscriber.error(error);
                        });
            });
    }

    private _hasClusterReconstruction(id: string): boolean {
        return id in this._clusterReconstructions;
    }
}