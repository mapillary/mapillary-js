import { EventEmitter } from "../../util/EventEmitter";
import { ClusterContract }
    from "../contracts/ClusterContract";
import { MeshContract } from "../contracts/MeshContract";
import { CoreImagesContract } from "../contracts/CoreImagesContract";
import { SpatialImagesContract } from "../contracts/SpatialImagesContract";
import { ImagesContract } from "../contracts/ImagesContract";
import { SequenceContract } from "../contracts/SequenceContract";
import { ImageTilesContract } from "../contracts/ImageTilesContract";
import { ImageTilesRequestContract }
    from "../contracts/ImageTilesRequestContract";
import { ProviderEventType } from "../events/ProviderEventType";
import { ProviderEvent } from "../events/ProviderEvent";
import { ProviderCellEvent } from "../events/ProviderCellEvent";
import { IGeometryProvider } from "./IGeometryProvider";

/**
 * @interface IDataProvider
 *
 * Interface describing data provider members.
 *
 * This is a specification for implementers to model: it is
 * not an exported method or class.
 *
 * @fires datacreate
 */
export interface IDataProvider extends EventEmitter {
    /**
     * Get geometry property.
     *
     * @returns {IGeometryProvider} Geometry provider instance.
     */
    geometry: IGeometryProvider;

    /**
     * Fire when data has been created in the data provider
     * after initial load.
     *
     * @param type datacreate
     * @param event Provider cell event
     *
     * @example
     * ```js
     * // Initialize the data provider
     * class MyDataProvider extends DataProviderBase {
     *   // Class implementation
     * }
     * var provider = new MyDataProvider();
     * // Create the event
     * var cellIds = [ // Determine updated cells ];
     * var target = provider;
     * var type = "datacreate";
     * var event = {
     *   cellIds,
     *   target,
     *   type,
     * };
     * // Fire the event
     * provider.fire(type, event);
     * ```
     */
    fire(
        type: "datacreate",
        event: ProviderCellEvent)
        : void;
    /** @ignore */
    fire(
        type: ProviderEventType,
        event: ProviderEvent)
        : void;
    fire<T>(
        type: ProviderEventType,
        event: T)
        : void;

    /**
     * Get core images in a geometry cell.
     *
     * @param {string} cellId - The id of the geometry cell.
     * @returns {Promise<CoreImagesContract>} Promise to
     * the core images of the requested geometry cell id.
     * @throws Rejects the promise on errors.
     */
    getCoreImages(
        cellId: string): Promise<CoreImagesContract>;

    /**
     * Get a cluster reconstruction.
     *
     * @param {string} url - URL for the cluster reconstruction
     * to retrieve.
     * @param {Promise} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<ClusterContract>} Promise to the
     * cluster reconstruction.
     * @throws Rejects the promise on errors.
     */
    getCluster(
        url: string,
        abort?: Promise<void>): Promise<ClusterContract>;

    /**
     * Get spatial images.
     *
     * @param {Array<string>} imageIds - The ids for the
     * images to retrieve.
     * @returns {Promise<SpatialImagesContract>} Promise to
     * the spatial images of the requested image ids.
     * @throws Rejects the promise on errors.
     */
    getSpatialImages(
        imageIds: string[]): Promise<SpatialImagesContract>;

    /**
     * Get complete images.
     *
     * @param {Array<string>} imageIds - The ids for the
     * images to retrieve.
     * @returns {Promise<ImagesContract>} Promise to the images of the
     * requested image ids.
     * @throws Rejects the promise on errors.
     */
    getImages(
        imageIds: string[]): Promise<ImagesContract>;

    /**
     * Get an image as an array buffer.
     *
     * @param {string} url - URL for image to retrieve.
     * @param {Promise<void>} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<ArrayBuffer>} Promise to the array
     * buffer containing the image.
     * @throws Rejects the promise on errors.
     */
    getImageBuffer(
        url: string,
        abort?: Promise<void>): Promise<ArrayBuffer>;
    /**
     * Get image tiles urls for a tile level.
     *
     * @param {ImageTilesRequestContract} tiles - Tiles to request
     * @returns {Promise<ImageTilesContract>} Promise to the
     * image tiles response contract
     *
     * @throws Rejects the promise on errors.
     *
     * @example
     * ```js
     * var tileRequest = { imageId: 'image-id', z: 12 };
     * provider.getImageTiles(tileRequest)
     *   .then((response) => console.log(response));
     * ```
     */
    getImageTiles(
        tiles: ImageTilesRequestContract): Promise<ImageTilesContract>;

    /**
     * Get a mesh.
     *
     * @param {string} url - URL for mesh to retrieve.
     * @param {Promise<void>} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<MeshContract>} Promise to the mesh.
     * @throws Rejects the promise on errors.
     */
    getMesh(
        url: string,
        abort?: Promise<void>): Promise<MeshContract>;

    /**
     * Get sequence.
     *
     * @param {Array<string>} sequenceId - The id for the
     * sequence to retrieve.
     * @returns {Promise} Promise to the sequences of the
     * requested image ids.
     * @throws Rejects the promise on errors.
     */
    getSequence(sequenceId: string): Promise<SequenceContract>;

    off(
        type: ProviderCellEvent["type"],
        handler: (event: ProviderCellEvent) => void)
        : void;
    /** @ignore */
    off(
        type: ProviderEventType,
        handler: (event: ProviderEvent) => void)
        : void;
    /** @ignore */
    off<T>(
        type: ProviderEventType,
        handler: (event: T) => void)
        : void;

    /**
     * Fired when data has been created in the data provider
     * after initial load.
     *
     * @event datacreate
     * @example
     * ```js
     * // Initialize the data provider
     * class MyDataProvider extends DataProviderBase {
     *   // implementation
     * }
     * var provider = new MyDataProvider();
     * // Set an event listener
     * provider.on("datacreate", function() {
     *   console.log("A datacreate event has occurred.");
     * });
     * ```
     */
    on(
        type: "datacreate",
        handler: (event: ProviderCellEvent) => void)
        : void;
    /** @ignore */
    on(
        type: ProviderEventType,
        handler: (event: ProviderEvent) => void)
        : void;
    /** @ignore */
    on<T>(
        type: ProviderEventType,
        handler: (event: T) => void)
        : void;

    /**
     * Set an access token for authenticated API requests of
     * protected resources.
     *
     * @param {string} [accessToken] accessToken - User access
     * token or client access token.
     */
    setAccessToken(accessToken?: string): void;
}
