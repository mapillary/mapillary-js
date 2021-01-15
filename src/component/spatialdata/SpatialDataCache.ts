import {
    empty as observableEmpty,
    from as observableFrom,
    of as observableOf,
    Observable,
    Subscriber,
} from "rxjs";

import {
    mergeMap,
    catchError,
    tap,
    publish,
    refCount,
    finalize,
    map,
    filter,
} from "rxjs/operators";

import AbortMapillaryError from "../../error/AbortMapillaryError";
import GraphService from "../../graph/GraphService";
import IDataProvider from "../../api/interfaces/IDataProvider";
import IClusterReconstruction from "../../api/interfaces/IClusterReconstruction";
import ICellCorners from "../../api/interfaces/ICellCorners";
import Node from "../../graph/Node";

type ClusterData = {
    key: string;
    url: string;
}

export class SpatialDataCache {
    private _graphService: GraphService;
    private _data: IDataProvider;

    private _cacheRequests: { [hash: string]: Function[] };
    private _tiles: { [hash: string]: Node[] };

    private _clusterReconstructions: { [key: string]: IClusterReconstruction };
    private _clusterReconstructionTiles: { [key: string]: string[] };
    private _tileClusters: { [hash: string]: ClusterData[] };

    private _cachingClusterReconstructions$: { [hash: string]: Observable<IClusterReconstruction> };
    private _cachingTiles$: { [hash: string]: Observable<Node[]> };

    constructor(graphService: GraphService, provider: IDataProvider) {
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

    public cacheClusterReconstructions$(hash: string): Observable<IClusterReconstruction> {
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
                (n: Node): boolean => {
                    return !!n.clusterKey && !!n.clusterUrl;
                })
            .map(
                (n: Node): ClusterData => {
                    return { key: n.clusterKey, url: n.clusterUrl };
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

        this._cachingClusterReconstructions$[hash] = observableFrom(clusters).pipe(
            mergeMap(
                (cd: ClusterData): Observable<IClusterReconstruction> => {
                    if (this._hasClusterReconstruction(cd.key)) {
                        return observableOf(this._getClusterReconstruction(cd.key));
                    }

                    let aborter: Function;
                    const abort: Promise<void> = new Promise(
                        (_, reject): void => {
                            aborter = reject;
                        });
                    this._cacheRequests[hash].push(aborter);

                    return this._getClusterReconstruction$(cd.url, cd.key, abort)
                        .pipe(
                            catchError(
                                (error: Error): Observable<IClusterReconstruction> => {
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
                    return hash in this._tileClusters;
                }),
            tap(
                (reconstruction: IClusterReconstruction): void => {
                    if (!this._hasClusterReconstruction(reconstruction.key)) {
                        this._clusterReconstructions[reconstruction.key] = reconstruction;
                    }

                    if (!(reconstruction.key in this._clusterReconstructionTiles)) {
                        this._clusterReconstructionTiles[reconstruction.key] = [];
                    }

                    if (this._clusterReconstructionTiles[reconstruction.key].indexOf(hash) === -1) {
                        this._clusterReconstructionTiles[reconstruction.key].push(hash);
                    }
                }),
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

    public cacheTile$(hash: string): Observable<Node[]> {
        if (this.hasTile(hash)) {
            throw new Error("Cannot cache tile that already exists.");
        }

        if (this.isCachingTile(hash)) {
            return this._cachingTiles$[hash];
        }

        const corners: ICellCorners =
            this._data.geometry.getCorners(hash);

        this._cachingTiles$[hash] = this._graphService.cacheBoundingBox$(corners.sw, corners.ne).pipe(
            catchError(
                (error: Error): Observable<Node[]> => {
                    console.error(error);

                    return observableEmpty();
                }),
            filter(
                (): boolean => {
                    return !(hash in this._tiles);
                }),
            tap(
                (node: Node[]): void => {
                    this._tiles[hash] = [];
                    this._tiles[hash].push(...node);

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

    public getClusterReconstructions(hash: string): IClusterReconstruction[] {
        return hash in this._tileClusters ?
            this._tileClusters[hash]
                .map(
                    (cd: ClusterData): IClusterReconstruction => {
                        return this._clusterReconstructions[cd.key];
                    })
                .filter(
                    (reconstruction: IClusterReconstruction): boolean => {
                        return !!reconstruction;
                    }) :
            [];
    }

    public getTile(hash: string): Node[] {
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

    private _getClusterReconstruction(key: string): IClusterReconstruction {
        return this._clusterReconstructions[key];
    }

    private _getClusterReconstruction$(url: string, clusterKey: string, abort: Promise<void>): Observable<IClusterReconstruction> {
        return Observable.create(
            (subscriber: Subscriber<IClusterReconstruction>): void => {
                this._data.getClusterReconstruction(url, abort)
                    .then(
                        (reconstruction: IClusterReconstruction): void => {
                            reconstruction.key = clusterKey;
                            subscriber.next(reconstruction);
                            subscriber.complete();
                        },
                        (error: Error): void => {
                            subscriber.error(error);
                        });
            });
    }

    private _hasClusterReconstruction(key: string): boolean {
        return key in this._clusterReconstructions;
    }
}

export default SpatialDataCache;
