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

import { ClusterContract } from "../../api/contracts/ClusterContract";
import { IDataProvider } from "../../api/interfaces/IDataProvider";
import { CancelMapillaryError } from "../../error/CancelMapillaryError";
import { GraphService } from "../../graph/GraphService";
import { Image } from "../../graph/Image";

type ClusterData = {
    key: string;
    url: string;
};

export class SpatialCache {
    private _graphService: GraphService;
    private _data: IDataProvider;

    private _cacheRequests: { [cellId: string]: Function[]; };
    private _cells: { [cellId: string]: Image[]; };

    private _clusters: { [key: string]: ClusterContract; };
    private _clusterCells: { [key: string]: string[]; };
    private _cellClusters: { [cellId: string]: ClusterData[]; };

    private _cachingClusters$: { [cellId: string]: Observable<ClusterContract>; };
    private _cachingCells$: { [cellId: string]: Observable<Image[]>; };

    constructor(graphService: GraphService, provider: IDataProvider) {
        this._graphService = graphService;
        this._data = provider;

        this._cells = {};
        this._cacheRequests = {};

        this._clusters = {};
        this._clusterCells = {};
        this._cellClusters = {};

        this._cachingCells$ = {};
        this._cachingClusters$ = {};
    }

    public cacheClusters$(cellId: string): Observable<ClusterContract> {
        if (!this.hasCell(cellId)) {
            throw new Error("Cannot cache reconstructions of a non-existing cell.");
        }

        if (this.hasClusters(cellId)) {
            throw new Error("Cannot cache reconstructions that already exists.");
        }

        if (this.isCachingClusters(cellId)) {
            return this._cachingClusters$[cellId];
        }

        const duplicatedClusters: ClusterData[] = this.getCell(cellId)
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

        this._cellClusters[cellId] = clusters;
        this._cacheRequests[cellId] = [];

        let aborter: Function;
        const abort: Promise<void> = new Promise(
            (_, reject): void => {
                aborter = reject;
            });
        this._cacheRequests[cellId].push(aborter);

        this._cachingClusters$[cellId] =
            this._cacheClusters$(clusters, cellId, abort).pipe(
                finalize(
                    (): void => {
                        if (cellId in this._cachingClusters$) {
                            delete this._cachingClusters$[cellId];
                        }

                        if (cellId in this._cacheRequests) {
                            delete this._cacheRequests[cellId];
                        }
                    }),
                publish(),
                refCount());

        return this._cachingClusters$[cellId];
    }

    public cacheCell$(cellId: string): Observable<Image[]> {
        if (this.hasCell(cellId)) {
            throw new Error("Cannot cache cell that already exists.");
        }

        if (this.isCachingCell(cellId)) {
            return this._cachingCells$[cellId];
        }

        this._cachingCells$[cellId] = this._graphService.cacheCell$(cellId).pipe(
            catchError(
                (error: Error): Observable<Image[]> => {
                    console.error(error);

                    return observableEmpty();
                }),
            filter(
                (): boolean => {
                    return !(cellId in this._cells);
                }),
            tap(
                (images: Image[]): void => {
                    this._cells[cellId] = [];
                    this._cells[cellId].push(...images);

                    delete this._cachingCells$[cellId];
                }),
            finalize(
                (): void => {
                    if (cellId in this._cachingCells$) {
                        delete this._cachingCells$[cellId];
                    }
                }),
            publish(),
            refCount());

        return this._cachingCells$[cellId];
    }

    public isCachingClusters(cellId: string): boolean {
        return cellId in this._cachingClusters$;
    }

    public isCachingCell(cellId: string): boolean {
        return cellId in this._cachingCells$;
    }

    public hasClusters(cellId: string): boolean {
        if (cellId in this._cachingClusters$ ||
            !(cellId in this._cellClusters)) {
            return false;
        }

        for (const cd of this._cellClusters[cellId]) {
            if (!(cd.key in this._clusters)) {
                return false;
            }
        }

        return true;
    }

    public hasCell(cellId: string): boolean {
        return !(cellId in this._cachingCells$) && cellId in this._cells;
    }

    public getClusters(cellId: string): ClusterContract[] {
        return cellId in this._cellClusters ?
            this._cellClusters[cellId]
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

    public getCell(cellId: string): Image[] {
        return cellId in this._cells ? this._cells[cellId] : [];
    }

    public uncache(keepCellIds?: string[]): void {
        for (let cellId of Object.keys(this._cacheRequests)) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }

            for (const aborter of this._cacheRequests[cellId]) {
                aborter();
            }

            delete this._cacheRequests[cellId];
        }

        for (let cellId of Object.keys(this._cellClusters)) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }

            for (const cd of this._cellClusters[cellId]) {
                if (!(cd.key in this._clusterCells)) {
                    continue;
                }

                const index: number = this._clusterCells[cd.key].indexOf(cellId);
                if (index === -1) {
                    continue;
                }

                this._clusterCells[cd.key].splice(index, 1);

                if (this._clusterCells[cd.key].length > 0) {
                    continue;
                }

                delete this._clusterCells[cd.key];
                delete this._clusters[cd.key];
            }

            delete this._cellClusters[cellId];
        }

        for (let cellId of Object.keys(this._cells)) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }

            delete this._cells[cellId];
        }
    }

    public updateCell$(cellId: string): Observable<Image[]> {
        if (!this.hasCell(cellId)) {
            throw new Error("Cannot update cell that does not exists.");
        }

        return this._graphService.cacheCell$(cellId).pipe(
            catchError(
                (error: Error): Observable<Image[]> => {
                    console.error(error);

                    return observableEmpty();
                }),
            filter(
                (): boolean => {
                    return cellId in this._cells;
                }),
            tap(
                (images: Image[]): void => {
                    this._cells[cellId] = [];
                    this._cells[cellId].push(...images);
                }),
            publish(),
            refCount());
    }

    public updateClusters$(cellId: string):
        Observable<ClusterContract> {
        if (!this.hasCell(cellId)) {
            throw new Error("Cannot update reconstructions of a non-existing cell.");
        }

        if (!this.hasClusters(cellId)) {
            throw new Error("Cannot update reconstructions for cell that is not cached.");
        }

        const duplicatedClusters: ClusterData[] = this.getCell(cellId)
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

        this._cellClusters[cellId].push(...clusters);

        return this._cacheClusters$(clusters, cellId, null);
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
                                    if (error instanceof CancelMapillaryError) {
                                        return observableEmpty();
                                    }

                                    console.error(error);
                                    return observableEmpty();
                                }));
                },
                6),
            filter(
                (): boolean => {
                    return cellId in this._cellClusters;
                }),
            tap(
                (reconstruction: ClusterContract): void => {
                    if (!this._hasCluster(reconstruction.id)) {
                        this._clusters[reconstruction.id] = reconstruction;
                    }

                    if (!(reconstruction.id in this._clusterCells)) {
                        this._clusterCells[reconstruction.id] = [];
                    }

                    if (this._clusterCells[reconstruction.id].indexOf(cellId) === -1) {
                        this._clusterCells[reconstruction.id].push(cellId);
                    }
                }));
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
