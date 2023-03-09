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
import { APIWrapper } from "../../api/APIWrapper";

import { ClusterContract } from "../../api/contracts/ClusterContract";
import { CancelMapillaryError } from "../../error/CancelMapillaryError";
import { GraphService } from "../../graph/GraphService";
import { Image } from "../../graph/Image";

type ClusterData = {
    key: string;
    url: string;
};

type Cluster = {
    cellIds: Set<string>;
    contract: ClusterContract;
};

type Cell = {
    clusters: Map<string, string[]>;
    images: Map<string, Image>;
};

type ClusterRequest = {
    cancel: Function;
    request: Observable<ClusterContract>;
};

export class SpatialCache {
    private _graphService: GraphService;
    private _api: APIWrapper;

    private _cells: Map<string, Cell>;
    private _clusters: { [key: string]: Cluster; };
    private _cellClusters: { [cellId: string]: ClusterData[]; };

    private _cellClusterRequests: { [cellId: string]: ClusterRequest; };
    private _cellImageRequests: { [cellId: string]: Observable<Image[]>; };
    private _clusterRequests: Set<string>;

    constructor(graphService: GraphService, api: APIWrapper) {
        this._graphService = graphService;
        this._api = api;

        this._cells = new Map();

        this._clusters = {};
        this._cellClusters = {};

        this._cellImageRequests = {};
        this._cellClusterRequests = {};
        this._clusterRequests = new Set();
    }

    public cacheClusters$(cellId: string): Observable<ClusterContract> {
        if (!this.hasCell(cellId)) {
            throw new Error("Cannot cache reconstructions of a non-existing cell.");
        }

        if (this.hasClusters(cellId)) {
            throw new Error("Cannot cache reconstructions that already exists.");
        }

        if (this.isCachingClusters(cellId)) {
            return this._cellClusterRequests[cellId].request;
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

        let cancel: Function;
        const cancellationToken: Promise<void> = new Promise(
            (_, reject): void => {
                cancel = reject;
            });
        this._cellClusterRequests[cellId] = {
            cancel, request:
                this._cacheClusters$(clusters, cellId, cancellationToken).pipe(
                    finalize(
                        (): void => {
                            if (cellId in this._cellClusterRequests) {
                                delete this._cellClusterRequests[cellId];
                            }
                        }),
                    publish(),
                    refCount())
        };

        return this._cellClusterRequests[cellId].request;
    }

    public cacheCell$(cellId: string): Observable<Image[]> {
        if (this.hasCell(cellId)) {
            throw new Error("Cannot cache cell that already exists.");
        }

        if (this.isCachingCell(cellId)) {
            return this._cellImageRequests[cellId];
        }

        this._cellImageRequests[cellId] = this._graphService.cacheCell$(cellId).pipe(
            catchError(
                (error: Error): Observable<Image[]> => {
                    console.error(error);

                    return observableEmpty();
                }),
            filter(
                (): boolean => {
                    return !this._cells.has(cellId);
                }),
            tap(
                (images: Image[]): void => {
                    const cell: Cell = {
                        clusters: new Map(),
                        images: new Map(),
                    };
                    this._cells.set(cellId, cell);
                    for (const image of images) {
                        cell.images.set(image.id, image);
                        const clusterId = image.clusterId;
                        if (!cell.clusters.has(clusterId)) {
                            cell.clusters.set(clusterId, []);
                        }
                        const clusterImageIds =
                            cell.clusters.get(clusterId);
                        clusterImageIds.push(image.id);
                    }

                    delete this._cellImageRequests[cellId];
                }),
            finalize(
                (): void => {
                    if (cellId in this._cellImageRequests) {
                        delete this._cellImageRequests[cellId];
                    }
                }),
            publish(),
            refCount());

        return this._cellImageRequests[cellId];
    }

    public isCachingClusters(cellId: string): boolean {
        return cellId in this._cellClusterRequests;
    }

    public isCachingCell(cellId: string): boolean {
        return cellId in this._cellImageRequests;
    }

    public hasClusters(cellId: string): boolean {
        if (cellId in this._cellClusterRequests ||
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
        return !(cellId in this._cellImageRequests) && this._cells.has(cellId);
    }

    public getClusters(cellId: string): ClusterContract[] {
        return cellId in this._cellClusters ?
            this._cellClusters[cellId]
                .map(
                    (cd: ClusterData): ClusterContract => {
                        const cluster = this._clusters[cd.key];
                        return cluster ? cluster.contract : null;
                    })
                .filter(
                    (reconstruction: ClusterContract): boolean => {
                        return !!reconstruction;
                    }) :
            [];
    }

    public getCell(cellId: string): Image[] {
        return this._cells.has(cellId) ?
            Array.from(this._cells.get(cellId).images.values()) : [];
    }

    public removeCluster(clusterId: string): void {
        this._clusterRequests.delete(clusterId);

        if (clusterId in this._clusters) {
            delete this._clusters[clusterId];
        }

        const cellIds: string[] = [];
        for (const [cellId, cell] of this._cells.entries()) {
            if (cell.clusters.has(clusterId)) {
                cellIds.push(cellId);
            }
        }

        for (const cellId of cellIds) {
            if (!this._cells.has(cellId)) {
                continue;
            }
            const cell = this._cells.get(cellId);
            const clusterImages = cell.clusters.get(clusterId) ?? [];
            for (const imageId of clusterImages) {
                cell.images.delete(imageId);
            }
            cell.clusters.delete(clusterId);

            if (cellId in this._cellClusters) {
                const cellClusters = this._cellClusters[cellId];
                const index = cellClusters.findIndex(cd => cd.key === clusterId);
                if (index !== -1) {
                    cellClusters.splice(index, 1);
                }
            }
        }
    }

    public uncache(keepCellIds?: string[]): void {
        for (const cellId of Object.keys(this._cellClusterRequests)) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }

            this._cellClusterRequests[cellId].cancel();
            delete this._cellClusterRequests[cellId];
        }

        for (let cellId of Object.keys(this._cellClusters)) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }

            for (const cd of this._cellClusters[cellId]) {
                if (!(cd.key in this._clusters)) {
                    continue;
                }

                const { cellIds } = this._clusters[cd.key];
                cellIds.delete(cellId);
                if (cellIds.size > 0) {
                    continue;
                }

                delete this._clusters[cd.key];
            }

            delete this._cellClusters[cellId];
        }

        for (let cellId of this._cells.keys()) {
            if (!!keepCellIds && keepCellIds.indexOf(cellId) !== -1) {
                continue;
            }

            this._cells.delete(cellId);
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
                    return this._cells.has(cellId);
                }),
            tap(
                (images: Image[]): void => {
                    const cell = this._cells.get(cellId);
                    for (const image of images) {
                        cell.images.set(image.id, image);
                        const clusterId = image.clusterId;
                        if (!cell.clusters.has(clusterId)) {
                            cell.clusters.set(clusterId, []);
                        }
                        const clusterImageIds =
                            cell.clusters.get(clusterId);
                        clusterImageIds.push(image.id);
                    }
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

                    this._clusterRequests.add(cd.key);
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
                (cluster: ClusterContract): boolean => {
                    return cellId in this._cellClusters &&
                        this._clusterRequests.has(cluster.id);
                }),
            tap(
                (cluster: ClusterContract): void => {
                    if (!this._hasCluster(cluster.id)) {
                        this._clusters[cluster.id] = {
                            cellIds: new Set(),
                            contract: cluster,
                        };
                    }

                    const { cellIds } = this._clusters[cluster.id];
                    cellIds.add(cellId);

                    this._clusterRequests.delete(cluster.id);
                }));
    }

    private _getCluster(id: string): ClusterContract {
        return this._clusters[id].contract;
    }

    private _getCluster$(url: string, clusterId: string, abort: Promise<void>): Observable<ClusterContract> {
        return Observable.create(
            (subscriber: Subscriber<ClusterContract>): void => {
                this._api.data.getCluster(url, abort)
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
