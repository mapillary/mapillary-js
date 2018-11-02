import * as geohash from "latlon-geohash";

import {
    empty as observableEmpty,
    from as observableFrom,
    of as observableOf,
    zip as observableZip,
    Observable,
    Subscriber,
} from "rxjs";

import {
    switchMap,
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
    IReconstruction,
} from "../../Component";
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

export type NodeData = {
    alt: number;
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
    width: number;
};

export type ReconstructionData = {
    data: NodeData,
    reconstruction: IReconstruction,
};

export class SpatialDataCache {
    private _graphService: GraphService;

    private _tiles: { [hash: string]: ReconstructionData[] };
    private _cachingTiles$: { [hash: string]: Observable<ReconstructionData> };
    private _cacheRequests: { [hash: string]: XMLHttpRequest[] };

    constructor(graphService: GraphService) {
        this._graphService = graphService;

        this._tiles = {};
        this._cachingTiles$ = {};
        this._cacheRequests = {};
    }

    public cacheTile$(hash: string): Observable<ReconstructionData> {
        if (hash.length !== 8) {
            throw new Error("Hash needs to be level 8.");
        }

        if (hash in this._cachingTiles$) {
            return this._cachingTiles$[hash];
        }

        if (hash in this._tiles) {
            throw new Error("Cannot cache tile that already exists.");
        }

        this._tiles[hash] = [];
        this._cacheRequests[hash] = [];

        const bounds: geohash.Bounds = geohash.bounds(hash);
        const sw: ILatLon = { lat: bounds.sw.lat, lon: bounds.sw.lon };
        const ne: ILatLon = { lat: bounds.ne.lat, lon: bounds.ne.lon };

        this._cachingTiles$[hash] = this._graphService.cacheBoundingBox$(sw, ne).pipe(
            switchMap(
                (nodes: Node[]): Observable<Node> => {
                    return observableFrom(nodes);
                }),
            mergeMap(
                (node: Node): Observable<[NodeData, IReconstruction]> => {
                        return !this._cacheRequests[hash] ?
                            observableEmpty() :
                            observableZip(
                                observableOf(this._createNodeData(node)),
                                this._getAtomicReconstruction(node.key, this._cacheRequests[hash]))
                                .pipe(
                                    catchError(
                                        (error: Error): Observable<[NodeData, IReconstruction]> => {
                                            if (!(error instanceof AbortMapillaryError)) {
                                                console.error(error);
                                            }

                                            return observableEmpty();
                                        }));
                },
                6),
            map(
                ([nodeData, reconstruction]: [NodeData, IReconstruction]): ReconstructionData => {
                    return { data: nodeData, reconstruction: reconstruction };
                }),
            filter(
                (): boolean => {
                    return hash in this._tiles;
                }),
            tap(
                (data: ReconstructionData): void => {
                    this._tiles[hash].push(data);
                }),
            finalize(
                (): void => {
                    if (hash in this._cachingTiles$) {
                        delete this._cachingTiles$[hash];
                    }

                    if (hash in this._cacheRequests) {
                        delete this._cacheRequests[hash];
                    }
                }),
            publish(),
            refCount());

        return this._cachingTiles$[hash];
    }

    public isCachingTile(hash: string): boolean {
        return hash in this._cachingTiles$;
    }

    public hasTile(hash: string): boolean {
        return !(hash in this._cachingTiles$) && hash in this._tiles;
    }

    public getTile(hash: string): ReconstructionData[] {
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
            width: node.width,
        };
    }

    private _getAtomicReconstruction(key: string, requests: XMLHttpRequest[]): Observable<IReconstruction> {
        return Observable.create(
            (subscriber: Subscriber<IReconstruction>): void => {
                const xmlHTTP: XMLHttpRequest = new XMLHttpRequest();

                xmlHTTP.open("GET", Urls.atomicReconstruction(key), true);
                xmlHTTP.responseType = "json";
                xmlHTTP.timeout = 15000;

                xmlHTTP.onload = () => {
                    if (!xmlHTTP.response) {
                        subscriber.error(new Error(`Atomic reconstruction does not exist (${key})`));
                    } else {
                        subscriber.next(xmlHTTP.response);
                        subscriber.complete();
                    }
                };

                xmlHTTP.onerror = () => {
                    subscriber.error(new Error(`Failed to get atomic reconstruction (${key})`));
                };

                xmlHTTP.ontimeout = () => {
                    subscriber.error(new Error(`Atomic reconstruction request timed out (${key})`));
                };

                xmlHTTP.onabort = () => {
                    subscriber.error(new AbortMapillaryError(`Atomic reconstruction request was aborted (${key})`));
                };

                requests.push(xmlHTTP);

                xmlHTTP.send(null);
            });
    }
}

export default SpatialDataCache;
