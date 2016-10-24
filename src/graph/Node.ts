import {Observable} from "rxjs/Observable";

import "rxjs/add/observable/combineLatest";

import "rxjs/add/operator/map";

import {
    ICoreNode,
    IFillNode,
    IGPano,
} from "../API";
import {IEdge} from "../Edge";
import {ILatLon} from "../Geo";
import {
    IEdgeStatus,
    IMesh,
    ILoadStatus,
    NewNodeCache,
} from "../Graph";

export class NewNode {
    private _cache: NewNodeCache;
    private _core: ICoreNode;
    private _fill: IFillNode;

    constructor(core: ICoreNode) {
        this._cache = null;
        this._core = core;
        this._fill = null;
    }

    public get assetsCached(): boolean {
        return this._core != null &&
            this._fill != null &&
            this._cache != null &&
            this._cache.image != null &&
            this._cache.mesh != null;
    }

    public get alt(): number {
        return this._fill.calt;
    }

    public get ca(): number {
        return this._fill.cca != null ? this._fill.cca : this._fill.ca;
    }

    public get capturedAt(): number {
        return this._fill.captured_at;
    }

    public get computedCA(): number {
        return this._fill.cca;
    }

    public get computedLatLon(): ILatLon {
        return this._core.cl;
    }

    public get focal(): number {
        return this._fill.cfocal;
    }

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

    public get gpano(): IGPano {
        return this._fill.gpano;
    }

    public get height(): number {
        return this._fill.height;
    }

    public get image(): HTMLImageElement {
        return this._cache.image;
    }

    public get key(): string {
        return this._core.key;
    }

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

    public get mergeCC(): number {
        return this._fill.merge_cc;
    }

    public get mergeVersion(): number {
        return this._fill.merge_version;
    }

    public get mesh(): IMesh {
        return this._cache.mesh;
    }

    public get orientation(): number {
        return this._fill.orientation;
    }

    public get originalCA(): number {
        return this._fill.ca;
    }

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

    public get rotation(): number[] {
        return this._fill.c_rotation;
    }

    public get scale(): number {
        return this._fill.atomic_scale;
    }

    public get sequenceKey(): string {
        return this._core.sequence.key;
    }

    public get sequenceEdges(): IEdgeStatus {
        return this._cache.sequenceEdges;
    }

    public get sequenceEdges$(): Observable<IEdgeStatus> {
        return this._cache.sequenceEdges$;
    }

    public get spatialEdges$(): Observable<IEdgeStatus> {
        return this._cache.spatialEdges$;
    }

    public get spatialEdges(): IEdgeStatus {
        return this._cache.spatialEdges;
    }

    public get userKey(): string {
        return this._fill.user.key;
    }

    public get username(): string {
        return this._fill.user.username;
    }

    public get width(): number {
        return this._fill.width;
    }

    /**
     * Cache the image and mesh assets.
     *
     * @returns {Observable<NewNode>} Observable emitting this node whenever the
     * load status has changed and when the mesh or image has been fully loaded.
     */
    public cacheAssets$(): Observable<NewNode> {
        return this._cache.cacheAssets$(this.key, this.pano, this.merged)
            .map<NewNode>(
                (cache: NewNodeCache): NewNode => {
                    return this;
                });
    }

    public cacheSequenceEdges(edges: IEdge[]): void {
        this._cache.cacheSequenceEdges(edges);
    }

    public cacheSpatialEdges(edges: IEdge[]): void {
        this._cache.cacheSpatialEdges(edges);
    }

    public dispose(): void {
        if (this._cache != null) {
            this._cache.dispose();
            this._cache = null;
        }

        this._core = null;
        this._fill = null;
    }

    public initializeCache(cache: NewNodeCache): void {
        if (this._cache != null) {
            throw new Error(`Node cache already initialized (${this.key}).`);
        }

        this._cache = cache;
    }

    public makeFull(fill: IFillNode): void {
        if (fill == null) {
            throw new Error("Fill can not be null.");
        }

        this._fill = fill;
    }

    public resetSpatialEdges(): void {
        this._cache.resetSpatialEdges();
    }
}

export default NewNode;
