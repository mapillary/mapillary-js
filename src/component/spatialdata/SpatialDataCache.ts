import * as geohash from "latlon-geohash";
import * as pako from "pako";

import {
    empty as observableEmpty,
    from as observableFrom,
    of as observableOf,
    zip as observableZip,
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

import {
    IGPano,
    ILatLon,
} from "../../API";
import {
    AbortMapillaryError,
} from "../../Error";
import {
    GraphService,
    Node,
} from "../../Graph";
import {
    Urls,
} from "../../Utils";
import { CameraProjection } from "../../api/interfaces/CameraProjection";
import IClusterReconstruction from "./interfaces/IClusterReconstruction";

export type NodeData = {
    alt: number;
    cameraProjection: CameraProjection;
    clusterKey: string;
    focal: number;
    gpano: IGPano;
    height: number;
    k1: number;
    k2: number;
    key: string,
    lat: number;
    lon: number;
    mergeCC: number;
    orientation: number;
    originalLat: number;
    originalLon: number;
    rotation: number[];
    scale: number;
    sequenceKey: string;
    width: number;
};

export class SpatialDataCache {
    private _graphService: GraphService;

    private _cacheRequests: { [hash: string]: XMLHttpRequest[] };
    private _tiles: { [hash: string]: NodeData[] };

    private _clusterReconstructions: { [key: string]: IClusterReconstruction };
    private _clusterReconstructionTiles: { [key: string]: string[] };
    private _tileClusters: { [hash: string]: string[] };

    private _cachingClusterReconstructions$: { [hash: string]: Observable<IClusterReconstruction> };
    private _cachingTiles$: { [hash: string]: Observable<NodeData[]> };

    constructor(graphService: GraphService) {
        this._graphService = graphService;

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

        const clusterKeys: string[] = this.getTile(hash)
            .filter(
                (nd: NodeData): boolean => {
                    return !!nd.clusterKey;
                })
            .map(
                (nd: NodeData): string => {
                    return nd.clusterKey;
                })
            .filter(
                (v: string, i: number, a: string[]) => {
                    return a.indexOf(v) === i;
                });

        this._tileClusters[hash] = clusterKeys;
        this._cacheRequests[hash] = [];

        this._cachingClusterReconstructions$[hash] =  observableFrom(clusterKeys).pipe(
            mergeMap(
                (key: string): Observable<IClusterReconstruction> => {
                    if (this._hasClusterReconstruction(key)) {
                        return observableOf(this._getClusterReconstruction(key));
                    }

                    return this._getClusterReconstruction$(key, this._cacheRequests[hash])
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

    public cacheTile$(hash: string): Observable<NodeData[]> {
        if (hash.length !== 8) {
            throw new Error("Hash needs to be level 8.");
        }

        if (this.hasTile(hash)) {
            throw new Error("Cannot cache tile that already exists.");
        }

        if (this.isCachingTile(hash)) {
            return this._cachingTiles$[hash];
        }

        const bounds: geohash.Bounds = geohash.bounds(hash);
        const sw: ILatLon = { lat: bounds.sw.lat, lon: bounds.sw.lon };
        const ne: ILatLon = { lat: bounds.ne.lat, lon: bounds.ne.lon };

        this._cachingTiles$[hash] = this._graphService.cacheBoundingBox$(sw, ne).pipe(
            catchError(
                (error: Error): Observable<Node[]> => {
                    console.error(error);

                    return observableEmpty();
                }),
            map(
                (nodes: Node[]): NodeData[] => {
                    return nodes
                        .map(
                            (n: Node): NodeData => {
                                return this._createNodeData(n);
                            });
                }),
            filter(
                (): boolean => {
                    return !(hash in this._tiles);
                }),
            tap(
                (nodeData: NodeData[]): void => {
                    this._tiles[hash] = [];
                    this._tiles[hash].push(...nodeData);

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

        for (const key of this._tileClusters[hash]) {
            if (!(key in this._clusterReconstructions)) {
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
                    (key: string): IClusterReconstruction => {
                        return this._clusterReconstructions[key];
                    })
                .filter(
                    (reconstruction: IClusterReconstruction): boolean => {
                        return !!reconstruction;
                    }) :
                [];
    }

    public getTile(hash: string): NodeData[] {
        return hash in this._tiles ? this._tiles[hash] : [];
    }

    public uncache(keepHashes?: string[]): void {
        for (let hash of Object.keys(this._cacheRequests)) {
            if (!!keepHashes && keepHashes.indexOf(hash) !== -1) {
                continue;
            }

            for (const request of this._cacheRequests[hash]) {
                request.abort();
            }

            delete this._cacheRequests[hash];
        }

        for (let hash of Object.keys(this._tileClusters)) {
            if (!!keepHashes && keepHashes.indexOf(hash) !== -1) {
                continue;
            }

            for (const key of this._tileClusters[hash]) {
                if (!(key in this._clusterReconstructionTiles)) {
                    continue;
                }

                const index: number = this._clusterReconstructionTiles[key].indexOf(hash);
                if (index === -1) {
                    continue;
                }

                this._clusterReconstructionTiles[key].splice(index, 1);

                if (this._clusterReconstructionTiles[key].length > 0) {
                    continue;
                }

                delete this._clusterReconstructionTiles[key];
                delete this._clusterReconstructions[key];
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

    private _createNodeData(node: Node): NodeData {
        return {
            alt: node.alt,
            cameraProjection: node.cameraProjection,
            clusterKey: node.clusterKey,
            focal: node.focal,
            gpano: node.gpano,
            height: node.height,
            k1: node.ck1,
            k2: node.ck2,
            key: node.key,
            lat: node.latLon.lat,
            lon: node.latLon.lon,
            mergeCC: node.mergeCC,
            orientation: node.orientation,
            originalLat: node.originalLatLon.lat,
            originalLon: node.originalLatLon.lon,
            rotation: [node.rotation[0], node.rotation[1], node.rotation[2]],
            scale: node.scale,
            sequenceKey: node.sequenceKey,
            width: node.width,
        };
    }

    private _getClusterReconstruction(key: string): IClusterReconstruction {
        return this._clusterReconstructions[key];
    }

    private _getClusterReconstruction$(key: string, requests: XMLHttpRequest[]): Observable<IClusterReconstruction> {
        return Observable.create(
            (subscriber: Subscriber<IClusterReconstruction>): void => {
                const xhr: XMLHttpRequest = new XMLHttpRequest();

                xhr.open("GET", Urls.clusterReconstruction(key), true);
                xhr.responseType = "arraybuffer";
                xhr.timeout = 15000;

                xhr.onload = () => {
                    if (!xhr.response) {
                        subscriber.error(new Error(`Cluster reconstruction retreival failed (${key})`));
                    } else {
                        const inflated: string = pako.inflate(xhr.response, { to: "string" });
                        const reconstructions: IClusterReconstruction[] = JSON.parse(inflated);

                        if (reconstructions.length < 1) {
                            subscriber.error(new Error(`No cluster reconstruction exists (${key})`));
                        }

                        const reconstruction: IClusterReconstruction = reconstructions[0];
                        reconstruction.key = key;

                        subscriber.next(reconstruction);
                        subscriber.complete();
                    }
                };

                xhr.onerror = () => {
                    subscriber.error(new Error(`Failed to get cluster reconstruction (${key})`));
                };

                xhr.ontimeout = () => {
                    subscriber.error(new Error(`Cluster reconstruction request timed out (${key})`));
                };

                xhr.onabort = () => {
                    subscriber.error(new AbortMapillaryError(`Cluster reconstruction request was aborted (${key})`));
                };

                requests.push(xhr);

                xhr.send(null);
            });
    }

    private _hasClusterReconstruction(key: string): boolean {
        return key in this._clusterReconstructions;
    }
}

export default SpatialDataCache;
