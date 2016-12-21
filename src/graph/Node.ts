import {Observable} from "rxjs/Observable";

import "rxjs/add/observable/combineLatest";

import "rxjs/add/operator/map";

import {
    ICoreNode,
    IFillNode,
    IGPano,
    ILatLon,
} from "../API";
import {IEdge} from "../Edge";
import {
    IEdgeStatus,
    IMesh,
    ILoadStatus,
    NodeCache,
} from "../Graph";
import {ImageSize} from "../Viewer";

/**
 * @class Node
 *
 * @classdesc Represents a node in the navigation graph.
 */
export class Node {
    private _cache: NodeCache;
    private _core: ICoreNode;
    private _fill: IFillNode;

    /**
     * Create a new node instance.
     *
     * @param {ICoreNode} coreNode - Raw core node data.
     */
    constructor(core: ICoreNode) {
        this._cache = null;
        this._core = core;
        this._fill = null;
    }

    /**
     * Get assets cached.
     *
     * @description The assets that need to be cached for this property
     * to report true are the following: fill properties, image and mesh.
     * The library ensures that the current node will always have the
     * assets cached.
     *
     * @returns {boolean} Value indicating whether all assets have been
     * cached.
     */
    public get assetsCached(): boolean {
        return this._core != null &&
            this._fill != null &&
            this._cache != null &&
            this._cache.image != null &&
            this._cache.mesh != null;
    }

    /**
     * Get alt.
     *
     * @description If SfM has not been run the computed altitude is
     * set to a default value of two meters.
     *
     * @returns {number} Altitude, in meters.
     */
    public get alt(): number {
        return this._fill.calt;
    }

    /**
     * Get ca.
     *
     * @description If the SfM computed compass angle exists it will
     * be returned, otherwise the original EXIF compass angle.
     *
     * @returns {number} Compass angle, measured in degrees.
     */
    public get ca(): number {
        return this._fill.cca != null ? this._fill.cca : this._fill.ca;
    }

    /**
     * Get capturedAt.
     *
     * @returns {number} Timestamp when the image was captured.
     */
    public get capturedAt(): number {
        return this._fill.captured_at;
    }

    /**
     * Get computedCA.
     *
     * @description Will not be set if SfM has not been run.
     *
     * @returns {number} SfM computed compass angle, measured in degrees.
     */
    public get computedCA(): number {
        return this._fill.cca;
    }

    /**
     * Get computedLatLon.
     *
     * @description Will not be set if SfM has not been run.
     *
     * @returns {ILatLon} SfM computed latitude longitude in WGS84 datum,
     * measured in degrees.
     */
    public get computedLatLon(): ILatLon {
        return this._core.cl;
    }

    /**
     * Get focal.
     *
     * @description Will not be set if SfM has not been run.
     *
     * @returns {number} SfM computed focal length.
     */
    public get focal(): number {
        return this._fill.cfocal;
    }

    /**
     * Get full.
     *
     * @description The library ensures that the current node will
     * always be full.
     *
     * @returns {boolean} Value indicating whether the node has all
     * properties filled.
     */
    public get full(): boolean {
        return this._fill != null;
    }

    /**
     * Get fullPano.
     *
     * @returns {boolean} Value indicating whether the node is a complete
     * 360 panorama.
     */
    public get fullPano(): boolean {
        return this._fill.gpano != null &&
            this._fill.gpano.CroppedAreaLeftPixels === 0 &&
            this._fill.gpano.CroppedAreaTopPixels === 0 &&
            this._fill.gpano.CroppedAreaImageWidthPixels === this._fill.gpano.FullPanoWidthPixels &&
            this._fill.gpano.CroppedAreaImageHeightPixels === this._fill.gpano.FullPanoHeightPixels;
    }

    /**
     * Get gpano.
     *
     * @description Will not be set for non panoramic images.
     *
     * @returns {IGPano} Panorama information for panorama images.
     */
    public get gpano(): IGPano {
        return this._fill.gpano;
    }

    /**
     * Get height.
     *
     * @returns {number} Height of original image, not adjusted
     * for orientation.
     */
    public get height(): number {
        return this._fill.height;
    }

    /**
     * Get image.
     *
     * @description The image will always be set on the current node.
     *
     * @returns {HTMLImageElement} Cached image element of the node.
     */
    public get image(): HTMLImageElement {
        return this._cache.image;
    }

    /**
     * Get key.
     *
     * @returns {string} Unique key of the node.
     */
    public get key(): string {
        return this._core.key;
    }

    /**
     * Get latLon.
     *
     * @description If the SfM computed latitude longitude exist
     * it will be returned, otherwise the original EXIF latitude
     * longitude.
     *
     * @returns {ILatLon} Latitude longitude in WGS84 datum,
     * measured in degrees.
     */
    public get latLon(): ILatLon {
        return this._core.cl != null ? this._core.cl : this._core.l;
    }

    /**
     * Get loadStatus.
     *
     * @returns {ILoadStatus} Value indicating the load status
     * of the mesh and image.
     */
    public get loadStatus(): ILoadStatus {
        return this._cache.loadStatus;
    }

    /**
     * Get merged.
     *
     * @returns {boolean} Value indicating whether SfM has been
     * run on the node and the node has been merged into a
     * connected component.
     */
    public get merged(): boolean {
        return this._fill != null &&
            this._fill.merge_version != null &&
            this._fill.merge_version > 0;
    }

    /**
     * Get mergeCC.
     *
     * @description Will not be set if SfM has not yet been run on
     * node.
     *
     * @returns {number} SfM connected component key to which
     * image belongs.
     */
    public get mergeCC(): number {
        return this._fill.merge_cc;
    }

    /**
     * Get mergeVersion.
     *
     * @returns {number} Version for which SfM was run and image was merged.
     */
    public get mergeVersion(): number {
        return this._fill.merge_version;
    }

    /**
     * Get mesh.
     *
     * @description The mesh will always be set on the current node.
     *
     * @returns {IMesh} SfM triangulated mesh of reconstructed
     * atomic 3D points.
     */
    public get mesh(): IMesh {
        return this._cache.mesh;
    }

    /**
     * Get orientation.
     *
     * @returns {number} EXIF orientation of original image.
     */
    public get orientation(): number {
        return this._fill.orientation;
    }

    /**
     * Get originalCA.
     *
     * @returns {number} Original EXIF compass angle, measured in
     * degrees.
     */
    public get originalCA(): number {
        return this._fill.ca;
    }

    /**
     * Get originalLatLon.
     *
     * @returns {ILatLon} Original EXIF latitude longitude in
     * WGS84 datum, measured in degrees.
     */
    public get originalLatLon(): ILatLon {
        return this._core.l;
    }

    /**
     * Get pano.
     *
     * @returns {boolean} Value indicating whether the node is a panorama.
     * It could be a cropped or full panorama.
     */
    public get pano(): boolean {
        return this._fill.gpano != null &&
            this._fill.gpano.FullPanoWidthPixels != null;
    }

    /**
     * Get projectKey.
     *
     * @returns {string} Unique key of the project to which
     * the node belongs.
     */
    public get projectKey(): string {
        return this._fill.project != null ?
            this._fill.project.key :
            null;
    }

    /**
     * Get rotation.
     *
     * @description Will not be set if SfM has not been run.
     *
     * @returns {Array<number>} Rotation vector in angle axis representation.
     */
    public get rotation(): number[] {
        return this._fill.c_rotation;
    }

    /**
     * Get scale.
     *
     * @description Will not be set if SfM has not been run.
     *
     * @returns {number} Scale of atomic reconstruction.
     */
    public get scale(): number {
        return this._fill.atomic_scale;
    }

    /**
     * Get sequenceKey.
     *
     * @returns {string} Unique key of the sequence to which
     * the node belongs.
     */
    public get sequenceKey(): string {
        return this._core.sequence.key;
    }

    /**
     * Get sequenceEdges.
     *
     * @returns {IEdgeStatus} Value describing the status of the
     * sequence edges.
     */
    public get sequenceEdges(): IEdgeStatus {
        return this._cache.sequenceEdges;
    }

    /**
     * Get sequenceEdges$.
     *
     * @returns {Observable<IEdgeStatus>} Observable emitting
     * values describing the status of the sequence edges.
     */
    public get sequenceEdges$(): Observable<IEdgeStatus> {
        return this._cache.sequenceEdges$;
    }

    /**
     * Get spatialEdges.
     *
     * @returns {IEdgeStatus} Value describing the status of the
     * spatial edges.
     */
    public get spatialEdges(): IEdgeStatus {
        return this._cache.spatialEdges;
    }

    /**
     * Get spatialEdges$.
     *
     * @returns {Observable<IEdgeStatus>} Observable emitting
     * values describing the status of the spatial edges.
     */
    public get spatialEdges$(): Observable<IEdgeStatus> {
        return this._cache.spatialEdges$;
    }

    /**
     * Get userKey.
     *
     * @returns {string} Unique key of the user who uploaded
     * the image.
     */
    public get userKey(): string {
        return this._fill.user.key;
    }

    /**
     * Get username.
     *
     * @returns {string} Username of the user who uploaded
     * the image.
     */
    public get username(): string {
        return this._fill.user.username;
    }

    /**
     * Get width.
     *
     * @returns {number} Width of original image, not
     * adjusted for orientation.
     */
    public get width(): number {
        return this._fill.width;
    }

    /**
     * Cache the image and mesh assets.
     *
     * @description The assets are always cached internally by the
     * library prior to setting a node as the current node.
     *
     * @returns {Observable<Node>} Observable emitting this node whenever the
     * load status has changed and when the mesh or image has been fully loaded.
     */
    public cacheAssets$(): Observable<Node> {
        return this._cache.cacheAssets$(this.key, this.pano, this.merged)
            .map(
                (cache: NodeCache): Node => {
                    return this;
                });
    }

    public cacheImage$(imageSize: ImageSize): Observable<Node> {
        return this._cache.cacheImage$(this.key, imageSize)
            .map(
                (cache: NodeCache): Node => {
                    return this;
                });
    }

    /**
     * Cache the sequence edges.
     *
     * @description The sequence edges are cached asynchronously
     * internally by the library.
     *
     * @param {Array<IEdge>} edges - Sequence edges to cache.
     */
    public cacheSequenceEdges(edges: IEdge[]): void {
        this._cache.cacheSequenceEdges(edges);
    }

    /**
     * Cache the spatial edges.
     *
     * @description The spatial edges are cached asynchronously
     * internally by the library.
     *
     * @param {Array<IEdge>} edges - Spatial edges to cache.
     */
    public cacheSpatialEdges(edges: IEdge[]): void {
        this._cache.cacheSpatialEdges(edges);
    }

    /**
     * Dispose the node.
     *
     * @description Disposes all cached assets.
     */
    public dispose(): void {
        if (this._cache != null) {
            this._cache.dispose();
            this._cache = null;
        }

        this._core = null;
        this._fill = null;
    }

    /**
     * Initialize the node cache.
     *
     * @description The node cache is initialized internally by
     * the library.
     *
     * @param {NodeCache} cache - The node cache to set as cache.
     */
    public initializeCache(cache: NodeCache): void {
        if (this._cache != null) {
            throw new Error(`Node cache already initialized (${this.key}).`);
        }

        this._cache = cache;
    }

    /**
     * Fill the node with all properties.
     *
     * @description The node is filled internally by
     * the library.
     *
     * @param {IFillNode} fill - The fill node struct.
     */
    public makeFull(fill: IFillNode): void {
        if (fill == null) {
            throw new Error("Fill can not be null.");
        }

        this._fill = fill;
    }

    /**
     * Reset the sequence edges.
     */
    public resetSequenceEdges(): void {
        this._cache.resetSequenceEdges();
    }

    /**
     * Reset the spatial edges.
     */
    public resetSpatialEdges(): void {
        this._cache.resetSpatialEdges();
    }
}

export default Node;
