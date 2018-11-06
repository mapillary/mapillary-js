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

    private _cacheRequests: { [hash: string]: XMLHttpRequest[] };
    private _reconstructions: { [hash: string]: ReconstructionData[] };
    private _tiles: { [hash: string]: NodeData[] };

    private _cachingReconstructions$: { [hash: string]: Observable<ReconstructionData> };
    private _cachingTiles$: { [hash: string]: Observable<NodeData[]> };

    constructor(graphService: GraphService) {
        this._graphService = graphService;

        this._tiles = {};
        this._cacheRequests = {};
        this._reconstructions = {};

        this._cachingReconstructions$ = {};
        this._cachingTiles$ = {};
    }

    public cacheReconstructions$(hash: string): Observable<ReconstructionData> {
        if (!(hash in this._tiles)) {
            throw new Error("Cannot cache reconstructions of a non-existing tile.");
        }

        if (this.hasReconstructions(hash)) {
            throw new Error("Cannot cache reconstructions that already exists.");
        }

        if (hash in this._cachingReconstructions$) {
            return this._cachingReconstructions$[hash];
        }

        const tile: NodeData[] = [];

        if (hash in this._reconstructions) {
            const reconstructionKeys: string[] =
                this.getReconstructions(hash)
                    .map(
                        (reconstruction: ReconstructionData): string => {
                            return reconstruction.data.key;
                        });

            for (const node of this.getTile(hash)) {
                if (reconstructionKeys.indexOf(node.key) === -1) {
                    tile.push(node);
                }
            }
        } else {
            tile.push(...this.getTile(hash));

            this._reconstructions[hash] = [];
        }

        this._cacheRequests[hash] = [];
        this._cachingReconstructions$[hash] = observableFrom(tile).pipe(
            mergeMap(
                (nodeData: NodeData): Observable<[NodeData, IReconstruction]> => {
                    return !this._cacheRequests[hash] ?
                        observableEmpty() :
                        observableZip(
                            observableOf(nodeData),
                            this._getAtomicReconstruction(nodeData.key, this._cacheRequests[hash]))
                            .pipe(
                                catchError(
                                    (error: Error): Observable<[NodeData, IReconstruction]> => {
                                        if (!(error instanceof AbortMapillaryError)) {
                                            console.error(error);
                                        }

                                        return observableOf(<[NodeData, IReconstruction]>[nodeData, null]);
                                    }));
                },
                6),
            map(
                ([nodeData, reconstruction]: [NodeData, IReconstruction]): ReconstructionData => {
                    return { data: nodeData, reconstruction: reconstruction };
                }),
            filter(
                (): boolean => {
                    return hash in this._reconstructions;
                }),
            tap(
                (data: ReconstructionData): void => {
                    this._reconstructions[hash].push(data);
                }),
            filter(
                (data: ReconstructionData): boolean => {
                    return !!data.reconstruction;
                }),
            finalize(
                (): void => {
                    if (hash in this._cachingReconstructions$) {
                        delete this._cachingReconstructions$[hash];
                    }

                    if (hash in this._cacheRequests) {
                        delete this._cacheRequests[hash];
                    }
                }),
            publish(),
            refCount());

        return this._cachingReconstructions$[hash];
    }

    public cacheTile$(hash: string): Observable<NodeData[]> {
        if (hash.length !== 8) {
            throw new Error("Hash needs to be level 8.");
        }

        if (this.hasTile(hash)) {
            throw new Error("Cannot cache tile that already exists.");

        }

        if (hash in this._cachingTiles$) {
            return this._cachingTiles$[hash];
        }

        const bounds: geohash.Bounds = geohash.bounds(hash);
        const sw: ILatLon = { lat: bounds.sw.lat, lon: bounds.sw.lon };
        const ne: ILatLon = { lat: bounds.ne.lat, lon: bounds.ne.lon };

        this._tiles[hash] = [];
        this._cachingTiles$[hash] = this._graphService.cacheBoundingBox$(sw, ne).pipe(
            catchError(
                (): Observable<Node[]> => {
                    delete this._tiles[hash];

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
                    return hash in this._tiles;
                }),
            tap(
                (nodeData: NodeData[]): void => {
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

    public isCachingReconstructions(hash: string): boolean {
        return hash in this._cachingReconstructions$;
    }

    public isCachingTile(hash: string): boolean {
        return hash in this._cachingTiles$;
    }

    public hasReconstructions(hash: string): boolean {
        return !(hash in this._cachingReconstructions$) &&
            hash in this._reconstructions &&
            this._reconstructions[hash].length === this._tiles[hash].length;
    }

    public hasTile(hash: string): boolean {
        return !(hash in this._cachingTiles$) && hash in this._tiles;
    }

    public getReconstructions(hash: string): ReconstructionData[] {
        return hash in this._reconstructions ?
            this._reconstructions[hash]
                .filter(
                    (data: ReconstructionData): boolean => {
                        return !!data.reconstruction;
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

        for (let hash of Object.keys(this._reconstructions)) {
            if (!!keepHashes && keepHashes.indexOf(hash) !== -1) {
                continue;
            }

            delete this._reconstructions[hash];
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
