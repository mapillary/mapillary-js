import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { ImageCache } from "./ImageCache";
import { NavigationEdge } from "./edge/interfaces/NavigationEdge";
import { NavigationEdgeStatus } from "./interfaces/NavigationEdgeStatus";

import { CoreImageEnt } from "../api/ents/CoreImageEnt";
import { SpatialImageEnt } from "../api/ents/SpatialImageEnt";
import { LngLat } from "../api/interfaces/LngLat";
import { MeshContract } from "../api/contracts/MeshContract";

/**
 * @class Image
 *
 * @classdesc Represents a image in the navigation graph.
 *
 * Explanation of position and bearing properties:
 *
 * When images are uploaded they will have GPS information in the EXIF, this is what
 * is called `originalLngLat` {@link Image.originalLngLat}.
 *
 * When Structure from Motions has been run for a image a `computedLngLat` that
 * differs from the `originalLngLat` will be created. It is different because
 * GPS positions are not very exact and SfM aligns the camera positions according
 * to the 3D reconstruction {@link Image.computedLngLat}.
 *
 * At last there exist a `lngLat` property which evaluates to
 * the `computedLngLat` from SfM if it exists but falls back
 * to the `originalLngLat` from the EXIF GPS otherwise {@link Image.lngLat}.
 *
 * Everything that is done in in the Viewer is based on the SfM positions,
 * i.e. `computedLngLat`. That is why the smooth transitions go in the right
 * direction (nd not in strange directions because of bad GPS).
 *
 * E.g. when placing a marker in the Viewer it is relative to the SfM
 * position i.e. the `computedLngLat`.
 *
 * The same concept as above also applies to the compass angle (or bearing) properties
 * `originalCa`, `computedCa` and `ca`.
 */
export class Image {
    private _cache: ImageCache;
    private _core: CoreImageEnt;
    private _spatial: SpatialImageEnt;

    /**
     * Create a new image instance.
     *
     * @description Images are always created internally by the library.
     * Images can not be added to the library through any API method.
     *
     * @param {CoreImageEnt} core- Raw core image data.
     * @ignore
     */
    constructor(core: CoreImageEnt) {
        if (!core) {
            throw new Error(`Incorrect core image data ${core}`);
        }

        this._cache = null;
        this._core = core;
        this._spatial = null;
    }

    /**
     * Get assets cached.
     *
     * @description The assets that need to be cached for this property
     * to report true are the following: fill properties, image and mesh.
     * The library ensures that the current image will always have the
     * assets cached.
     *
     * @returns {boolean} Value indicating whether all assets have been
     * cached.
     *
     * @ignore
     */
    public get assetsCached(): boolean {
        return this._core != null &&
            this._spatial != null &&
            this._cache != null &&
            this._cache.image != null &&
            this._cache.mesh != null;
    }

    /**
     * Get cameraParameters.
     *
     * @description Will be undefined if SfM has
     * not been run.
     *
     * Camera type dependent parameters.
     *
     * For perspective and fisheye camera types,
     * the camera parameters array should be
     * constructed according to
     *
     * `[focal, k1, k2]`
     *
     * where focal is the camera focal length,
     * and k1, k2 are radial distortion parameters.
     *
     * For spherical camera type the camera
     * parameters are unset or emtpy array.
     *
     * @returns {Array<number>} The parameters
     * related to the camera type.
     */
    public get cameraParameters(): number[] {
        return this._spatial.camera_parameters;
    }

    /**
     * Get cameraType.
     *
     * @description Will be undefined if SfM has not been run.
     *
     * @returns {string} The camera type that captured the image.
     */
    public get cameraType(): string {
        return this._spatial.camera_type;
    }

    /**
     * Get capturedAt.
     *
     * @description Timestamp of the image capture date
     * and time represented as a Unix epoch timestamp in milliseconds.
     *
     * @returns {number} Timestamp when the image was captured.
     */
    public get capturedAt(): number {
        return this._spatial.captured_at;
    }

    /**
     * Get clusterId.
     *
     * @returns {string} Globally unique id of the SfM cluster to which
     * the image belongs.
     */
    public get clusterId(): string {
        return !!this._spatial.cluster ?
            this._spatial.cluster.id :
            null;
    }

    /**
     * Get clusterUrl.
     *
     * @returns {string} Url to the cluster reconstruction file.
     *
     * @ignore
     */
    public get clusterUrl(): string {
        return !!this._spatial.cluster ?
            this._spatial.cluster.url :
            null;
    }

    /**
     * Get compassAngle.
     *
     * @description If the SfM computed compass angle exists it will
     * be returned, otherwise the original EXIF compass angle.
     *
     * @returns {number} Compass angle, measured in degrees
     * clockwise with respect to north.
     */
    public get compassAngle(): number {
        return this._spatial.computed_compass_angle != null ?
            this._spatial.computed_compass_angle :
            this._spatial.compass_angle;
    }

    /**
     * Get complete.
     *
     * @description The library ensures that the current image will
     * always be full.
     *
     * @returns {boolean} Value indicating whether the image has all
     * properties filled.
     *
     * @ignore
     */
    public get complete(): boolean {
        return this._spatial != null;
    }

    /**
     * Get computedAltitude.
     *
     * @description If SfM has not been run the computed altitude is
     * set to a default value of two meters.
     *
     * @returns {number} Altitude, in meters.
     */
    public get computedAltitude(): number {
        return this._spatial.computed_altitude;
    }

    /**
     * Get computedCompassAngle.
     *
     * @description Will not be set if SfM has not been run.
     *
     * @returns {number} SfM computed compass angle, measured
     * in degrees clockwise with respect to north.
     */
    public get computedCompassAngle(): number {
        return this._spatial.computed_compass_angle;
    }

    /**
     * Get computedLngLat.
     *
     * @description Will not be set if SfM has not been run.
     *
     * @returns {LngLat} SfM computed longitude, latitude in WGS84 datum,
     * measured in degrees.
     */
    public get computedLngLat(): LngLat {
        return this._core.computed_geometry;
    }

    /**
     * Get creatorId.
     *
     * @description Note that the creator ID will not be set when using
     * the Mapillary API.
     *
     * @returns {string} Globally unique id of the user who uploaded
     * the image.
     */
    public get creatorId(): string {
        return this._spatial.creator.id;
    }

    /**
     * Get creatorUsername.
     *
     * @description Note that the creator username will not be set when
     * using the Mapillary API.
     *
     * @returns {string} Username of the creator who uploaded
     * the image.
     */
    public get creatorUsername(): string {
        return this._spatial.creator.username;
    }


    /**
     * Get exifOrientation.
     *
     * @returns {number} EXIF orientation of original image.
     */
    public get exifOrientation(): number {
        return this._spatial.exif_orientation;
    }

    /**
     * Get height.
     *
     * @returns {number} Height of original image, not adjusted
     * for orientation.
     */
    public get height(): number {
        return this._spatial.height;
    }

    /**
     * Get image.
     *
     * @description The image will always be set on the current image.
     *
     * @returns {HTMLImageElement} Cached image element of the image.
     */
    public get image(): HTMLImageElement {
        return this._cache.image;
    }

    /**
     * Get image$.
     *
     * @returns {Observable<HTMLImageElement>} Observable emitting
     * the cached image when it is updated.
     *
     * @ignore
     */
    public get image$(): Observable<HTMLImageElement> {
        return this._cache.image$;
    }

    /**
     * Get id.
     *
     * @returns {string} Globally unique id of the image.
     */
    public get id(): string {
        return this._core.id;
    }

    /**
     * Get lngLat.
     *
     * @description If the SfM computed longitude, latitude exist
     * it will be returned, otherwise the original EXIF latitude
     * longitude.
     *
     * @returns {LngLat} Longitude, latitude in WGS84 datum,
     * measured in degrees.
     */
    public get lngLat(): LngLat {
        return this._core.computed_geometry != null ?
            this._core.computed_geometry :
            this._core.geometry;
    }

    /**
     * Get merged.
     *
     * @returns {boolean} Value indicating whether SfM has been
     * run on the image and the image has been merged into a
     * connected component.
     */
    public get merged(): boolean {
        return this._spatial != null &&
            this._spatial.merge_id != null;
    }

    /**
     * Get mergeId.
     *
     * @description Will not be set if SfM has not yet been run on
     * image.
     *
     * @returns {stirng} Id of connected component to which image
     * belongs after the aligning merge.
     */
    public get mergeId(): string {
        return this._spatial.merge_id;
    }

    /**
     * Get mesh.
     *
     * @description The mesh will always be set on the current image.
     *
     * @returns {MeshContract} SfM triangulated mesh of reconstructed
     * atomic 3D points.
     */
    public get mesh(): MeshContract {
        return this._cache.mesh;
    }

    /**
     * Get originalAltitude.
     *
     * @returns {number} EXIF altitude, in meters, if available.
     */
    public get originalAltitude(): number {
        return this._spatial.altitude;
    }

    /**
     * Get originalCompassAngle.
     *
     * @returns {number} Original EXIF compass angle, measured in
     * degrees.
     */
    public get originalCompassAngle(): number {
        return this._spatial.compass_angle;
    }

    /**
     * Get originalLngLat.
     *
     * @returns {LngLat} Original EXIF longitude, latitude in
     * WGS84 datum, measured in degrees.
     */
    public get originalLngLat(): LngLat {
        return this._core.geometry;
    }

    /**
     * Get ownerId.
     *
     * @returns {string} Globally unique id of the owner to which
     * the image belongs. If the image does not belong to an
     * owner the owner id will be undefined.
     */
    public get ownerId(): string {
        return !!this._spatial.owner ?
            this._spatial.owner.id :
            null;
    }

    /**
     * Get private.
     *
     * @returns {boolean} Value specifying if image is accessible to
     * organization members only or to everyone.
     */
    public get private(): boolean {
        return this._spatial.private;
    }

    /**
     * Get qualityScore.
     *
     * @returns {number} A number between zero and one
     * determining the quality of the image. Blurriness
     * (motion blur / out-of-focus), occlusion (camera
     * mount, ego vehicle, water-drops), windshield
     * reflections, bad illumination (exposure, glare),
     * and bad weather condition (fog, rain, snow)
     * affect the quality score.
     *
     * @description Value should be on the interval [0, 1].
     */
    public get qualityScore(): number {
        return this._spatial.quality_score;
    }

    /**
     * Get rotation.
     *
     * @description Will not be set if SfM has not been run.
     *
     * @returns {Array<number>} Rotation vector in angle axis representation.
     */
    public get rotation(): number[] {
        return this._spatial.computed_rotation;
    }

    /**
     * Get scale.
     *
     * @description Will not be set if SfM has not been run.
     *
     * @returns {number} Scale of reconstruction the image
     * belongs to.
     */
    public get scale(): number {
        return this._spatial.atomic_scale;
    }

    /**
     * Get sequenceId.
     *
     * @returns {string} Globally unique id of the sequence
     * to which the image belongs.
     */
    public get sequenceId(): string {
        return !!this._core.sequence ?
            this._core.sequence.id :
            null;
    }

    /**
     * Get sequenceEdges.
     *
     * @returns {NavigationEdgeStatus} Value describing the status of the
     * sequence edges.
     *
     * @ignore
     */
    public get sequenceEdges(): NavigationEdgeStatus {
        return this._cache.sequenceEdges;
    }

    /**
     * Get sequenceEdges$.
     *
     * @description Internal observable, should not be used as an API.
     *
     * @returns {Observable<NavigationEdgeStatus>} Observable emitting
     * values describing the status of the sequence edges.
     *
     * @ignore
     */
    public get sequenceEdges$(): Observable<NavigationEdgeStatus> {
        return this._cache.sequenceEdges$;
    }

    /**
     * Get spatialEdges.
     *
     * @returns {NavigationEdgeStatus} Value describing the status of the
     * spatial edges.
     *
     * @ignore
     */
    public get spatialEdges(): NavigationEdgeStatus {
        return this._cache.spatialEdges;
    }

    /**
     * Get spatialEdges$.
     *
     * @description Internal observable, should not be used as an API.
     *
     * @returns {Observable<NavigationEdgeStatus>} Observable emitting
     * values describing the status of the spatial edges.
     *
     * @ignore
     */
    public get spatialEdges$(): Observable<NavigationEdgeStatus> {
        return this._cache.spatialEdges$;
    }

    /**
     * Get width.
     *
     * @returns {number} Width of original image, not
     * adjusted for orientation.
     */
    public get width(): number {
        return this._spatial.width;
    }

    /**
     * Cache the image and mesh assets.
     *
     * @description The assets are always cached internally by the
     * library prior to setting a image as the current image.
     *
     * @returns {Observable<Image>} Observable emitting this image whenever the
     * load status has changed and when the mesh or image has been fully loaded.
     *
     * @ignore
     */
    public cacheAssets$(): Observable<Image> {
        return this._cache
            .cacheAssets$(this._spatial, this.merged)
            .pipe(
                map((): Image => { return this; }));
    }

    /**
     * Cache the image asset.
     *
     * @description Use for caching a differently sized image than
     * the one currently held by the image.
     *
     * @returns {Observable<Image>} Observable emitting this image whenever the
     * load status has changed and when the mesh or image has been fully loaded.
     *
     * @ignore
     */
    public cacheImage$(): Observable<Image> {
        return this._cache
            .cacheImage$(this._spatial)
            .pipe(
                map((): Image => { return this; }));
    }

    /**
     * Cache the sequence edges.
     *
     * @description The sequence edges are cached asynchronously
     * internally by the library.
     *
     * @param {Array<NavigationEdge>} edges - Sequence edges to cache.
     * @ignore
     */
    public cacheSequenceEdges(edges: NavigationEdge[]): void {
        this._cache.cacheSequenceEdges(edges);
    }

    /**
     * Cache the spatial edges.
     *
     * @description The spatial edges are cached asynchronously
     * internally by the library.
     *
     * @param {Array<NavigationEdge>} edges - Spatial edges to cache.
     * @ignore
     */
    public cacheSpatialEdges(edges: NavigationEdge[]): void {
        this._cache.cacheSpatialEdges(edges);
    }

    /**
     * Dispose the image.
     *
     * @description Disposes all cached assets.
     * @ignore
     */
    public dispose(): void {
        if (this._cache != null) {
            this._cache.dispose();
            this._cache = null;
        }

        this._core = null;
        this._spatial = null;
    }

    /**
     * Initialize the image cache.
     *
     * @description The image cache is initialized internally by
     * the library.
     *
     * @param {ImageCache} cache - The image cache to set as cache.
     * @ignore
     */
    public initializeCache(cache: ImageCache): void {
        if (this._cache != null) {
            throw new Error(`Image cache already initialized (${this.id}).`);
        }

        this._cache = cache;
    }

    /**
     * Complete an image with spatial properties.
     *
     * @description The image is completed internally by
     * the library.
     *
     * @param {SpatialImageEnt} fill - The spatial image struct.
     * @ignore
     */
    public makeComplete(fill: SpatialImageEnt): void {
        if (fill == null) {
            throw new Error("Fill can not be null.");
        }

        this._spatial = fill;
    }

    /**
     * Reset the sequence edges.
     *
     * @ignore
     */
    public resetSequenceEdges(): void {
        this._cache.resetSequenceEdges();
    }

    /**
     * Reset the spatial edges.
     *
     * @ignore
     */
    public resetSpatialEdges(): void {
        this._cache.resetSpatialEdges();
    }

    /**
     * Clears the image and mesh assets, aborts
     * any outstanding requests and resets edges.
     *
     * @ignore
     */
    public uncache(): void {
        if (this._cache == null) {
            return;
        }

        this._cache.dispose();
        this._cache = null;
    }
}
