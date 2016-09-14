import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";

import "rxjs/add/observable/combineLatest";

import {IAPINavImIm} from "../API";
import {IEdge} from "../Edge";
import {ILatLon} from "../Geo";
import {
    IMesh,
    ILoadStatus,
    ILoadStatusObject,
    ImageLoader,
    MeshReader,
    Sequence,
} from "../Graph";
import {
    Settings,
    Urls,
} from "../Utils";
import {ImageSize} from "../Viewer";

/**
 * @class Node
 *
 * @classdesc Represents a node in the navigation graph.
 */
export class Node {
    private _apiNavImIm: IAPINavImIm;
    private _ca: number;
    private _hs: string[];
    private _latLon: ILatLon;
    private _sequence: Sequence;

    private _edges: IEdge[];
    private _image: HTMLImageElement;
    private _mesh: IMesh;

    private _loadStatus: ILoadStatus;

    private _worthy: boolean;

    /**
     * Create a new node instance.
     *
     * @param {number} ca - Compass angle. If the SfM computed compass angle
     * exist is should be provided to override the original EXIF compass angle.
     * @param {ILatLon} latLon - Latitude and longitude in WGS84 datum. If
     * SfM computed latitude and longitude exist they should be provided to
     * override the original EXIF values.
     * @param {boolean} worthy - Value indicating whether all tiles required
     * to calculate the edges for this node are cached.
     * @param {Sequence} sequence - The sequence of nodes that this node belongs
     * to.
     * @param {IAPINavImIm} apiNavImIm - Raw node properties.
     * @param {Array<string>} hs - Array of tiles required for calculating edges
     * of this node.
     */
    constructor (
        ca: number,
        latLon: ILatLon,
        worthy: boolean,
        sequence: Sequence,
        apiNavImIm: IAPINavImIm,
        hs: string[]) {

        this._apiNavImIm = apiNavImIm;
        this._ca = ca;
        this._hs = hs;
        this._latLon = latLon;
        this._sequence = sequence;

        this._edges = null;
        this._image = null;
        this._mesh = null;

        this._loadStatus = { loaded: 0, total: 100 };

        this._worthy = worthy;
    }

    /**
     * Get apiNavImIm.
     *
     * @returns {IAPINavImIm} Raw node properties.
     */
    public get apiNavImIm(): IAPINavImIm {
        return this._apiNavImIm;
    }

    /**
     * Get ca.
     *
     * @returns {number} Compass angle. If the SfM computed compass angle
     * exist it will be returned, otherwise the original EXIF compass angle.
     */
    public get ca(): number {
        return this._ca;
    }

    /**
     * Get captured at.
     *
     * @returns {number} Timestamp when the image was captured.
     */
    public get capturedAt(): number {
        return this._apiNavImIm.captured_at;
    }

    /**
     * Get edges.
     *
     * @returns {Array<IEdge>} Array of edges to nodes in the graph to which
     * this node can navigate.
     */
    public get edges(): IEdge[] {
        return this._edges;
    }

    /**
     * Get edgesCached.
     *
     * @returns {boolean} Value indicating whether the edges of this node
     * has been cached.
     */
    public get edgesCached(): boolean {
        return this._edges != null;
    }

    /**
     * Get fullPano.
     *
     * @returns {boolean} Value indicating whether the node is a complete
     * 360 panorama.
     */
    public get fullPano(): boolean {
        return this.apiNavImIm.gpano != null &&
            this.apiNavImIm.gpano.CroppedAreaLeftPixels === 0 &&
            this.apiNavImIm.gpano.CroppedAreaTopPixels === 0 &&
            this.apiNavImIm.gpano.CroppedAreaImageWidthPixels === this.apiNavImIm.gpano.FullPanoWidthPixels &&
            this.apiNavImIm.gpano.CroppedAreaImageHeightPixels === this.apiNavImIm.gpano.FullPanoHeightPixels;
    }

    /**
     * Get hs.
     *
     * @returns {Array<string>} Array of tiles required for calculating edges
     * of this node.
     */
    public get hs(): string[] {
        return this._hs;
    }

    /**
     * Get image.
     *
     * @returns {HTMLImageElement} Image of node.
     */
    public get image(): HTMLImageElement {
        return this._image;
    }

    /**
     * Get key.
     *
     * @returns {string} Unique key of node.
     */
    public get key(): string {
        return this._apiNavImIm.key;
    }

    /**
     * Get latLon.
     *
     * @returns {ILatLon} Latitude and longitude in WGS84 datum. If
     * SfM computed latitude and longitude exist they are returned,
     * otherwise the original EXIF values.
     */
    public get latLon(): ILatLon {
        return this._latLon;
    }

    /**
     * Get loaded.
     *
     * @returns {boolean} Value indicating whether the node is
     * considered to be fully loaded. To be considered loaded the
     * image has to be loaded and the edges cached.
     */
    public get loaded(): boolean {
        return this.edgesCached && this._image != null;
    }

    /**
     * Get loadStatus.
     *
     * @returns {ILoadStatus} Value indicating the load status
     * of the mesh and image.
     */
    public get loadStatus(): ILoadStatus {
        return this._loadStatus;
    }

    /**
     * Get merged.
     *
     * @returns {boolean} Value indicating whether SfM has been
     * run on the node and the node has been merged into a
     * connected component.
     */
    public get merged(): boolean {
        return this.apiNavImIm != null &&
            this.apiNavImIm.merge_version != null &&
            this.apiNavImIm.merge_version > 0;
    }

    /**
     * Get mesh.
     *
     * @returns {IMesh} SfM triangulated mesh of reconstructed
     * atomic 3D points.
     */
    public get mesh(): IMesh {
        return this._mesh;
    }

    /**
     * Get pano.
     *
     * @returns {boolean} Value indicating whether the node is a panorama.
     * It could be a cropped or full panorama.
     */
    public get pano(): boolean {
        return this.apiNavImIm.gpano != null &&
            this.apiNavImIm.gpano.FullPanoWidthPixels != null;
    }

    /**
     * Get sequence.
     *
     * @returns {Sequence} Sequence of nodes to which this node
     * belongs.
     */
    public get sequence(): Sequence {
        return this._sequence;
    }

    /**
     * Get user.
     *
     * @returns {string} Username of the user who uploaded the image.
     */
    public get user(): string {
        return this._apiNavImIm.user;
    }

    /**
     * Get worthy.
     *
     * @returns {boolean} Value indicating whether all tiles required
     * to calculate the edges for this node are cached.
     */
    public get worthy(): boolean {
        return this._worthy;
    }

    /**
     * Cache the image and mesh assets.
     *
     * @returns {Observable<Node>} Observable emitting this node whenever the
     * load status has changed and when the mesh or image has been fully loaded.
     */
    public cacheAssets(): Observable<Node> {
        return Observable
            .combineLatest(
                this._cacheImage(),
                this._cacheMesh(),
                (imageStatus: ILoadStatusObject<HTMLImageElement>, meshStatus: ILoadStatusObject<IMesh>): Node => {
                    this._loadStatus.loaded = 0;
                    this._loadStatus.total = 0;

                    if (meshStatus) {
                        this._mesh = meshStatus.object;
                        this._loadStatus.loaded += meshStatus.loaded.loaded;
                        this._loadStatus.total += meshStatus.loaded.total;
                    }

                    if (imageStatus) {
                        this._image = imageStatus.object;
                        this._loadStatus.loaded += imageStatus.loaded.loaded;
                        this._loadStatus.total += imageStatus.loaded.total;
                    }

                    return this;
                });
    }

    /**
     * Cache the navigation edges.
     */
    public cacheEdges(edges: IEdge[]): void {
        this._edges = edges;
    }

    /**
     * Find the next key in the node sequence with respect to
     * this node.
     */
    public findNextKeyInSequence(): string {
        return this._sequence != null ?
            this.sequence.findNextKey(this._apiNavImIm.key) :
            null;
    }

    /**
     * Find the previous key in the node sequence with respect to
     * this node.
     */
    public findPrevKeyInSequence(): string {
        return this._sequence != null ?
            this.sequence.findPrevKey(this._apiNavImIm.key) :
            null;
    }

    /**
     * Make this node worthy.
     *
     * @description The node is considered worthy when all tiles required
     * to calculate the edges for the node are cached.
     */
    public makeWorthy(): void {
        this._worthy = true;
    }

    /**
     * Cache the mesh.
     *
     * @returns {Observable<ILoadStatusObject<IMesh>>} Observable emitting
     * a load status object every time the load status changes and completes
     * when the mesh is fully loaded.
     */
    private _cacheMesh(): Observable<ILoadStatusObject<IMesh>> {
        return Observable.create(
            (subscriber: Subscriber<ILoadStatusObject<IMesh>>): void => {
                if (!this.merged) {
                    subscriber.next({
                        loaded: { loaded: 0, total: 0 },
                        object: { faces: [], vertices: [] },
                    });
                    subscriber.complete();
                    return;
                }

                let xmlHTTP: XMLHttpRequest = new XMLHttpRequest();
                xmlHTTP.open("GET", Urls.proto_mesh(this.key), true);
                xmlHTTP.responseType = "arraybuffer";
                xmlHTTP.onload = (pe: ProgressEvent) => {
                    let mesh: IMesh = xmlHTTP.status === 200 ?
                        MeshReader.read(new Buffer(xmlHTTP.response)) :
                        { faces: [], vertices: [] };

                    subscriber.next({ loaded: { loaded: pe.loaded, total: pe.total }, object: mesh });
                    subscriber.complete();
                };

                xmlHTTP.onprogress = (pe: ProgressEvent) => {
                    subscriber.next({ loaded: { loaded: pe.loaded, total: pe.total }, object: null });
                };

                xmlHTTP.send(null);
            });
    }

    /**
     * Cache the image.
     *
     * @returns {Observable<ILoadStatusObject<HTMLImageElement>>} Observable emitting
     * a load status object every time the load status changes and completes
     * when the image is fully loaded.
     */
    private _cacheImage(): Observable<ILoadStatusObject<HTMLImageElement>> {
        let imageSize: ImageSize = this.pano ?
            Settings.basePanoramaSize :
            Settings.baseImageSize;

        return ImageLoader.loadThumbnail(this.key, imageSize);
    }
}

export default Node;
