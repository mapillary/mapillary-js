import { MapillaryError } from "../error/MapillaryError";
import { EventEmitter } from "../util/EventEmitter";
import { ClusterContract }
    from "./contracts/ClusterContract";
import { MeshContract } from "./contracts/MeshContract";
import { CoreImagesContract } from "./contracts/CoreImagesContract";
import { SpatialImagesContract } from "./contracts/SpatialImagesContract";
import { ImagesContract } from "./contracts/ImagesContract";
import { SequenceContract } from "./contracts/SequenceContract";
import { ImageTilesContract } from "./contracts/ImageTilesContract";
import { ImageTilesRequestContract }
    from "./contracts/ImageTilesRequestContract";
import { ProviderEventType } from "./events/ProviderEventType";
import { ProviderEvent } from "./events/ProviderEvent";
import { ProviderCellEvent } from "./events/ProviderCellEvent";
import { IDataProvider } from "./interfaces/IDataProvider";
import { IGeometryProvider } from "./interfaces/IGeometryProvider";

/**
 * @class DataProviderBase
 *
 * @classdesc Base class to extend if implementing a data provider
 * class.
 *
 * @fires datacreate
 *
 * @example
 * ```js
 * class MyDataProvider extends DataProviderBase {
 *   constructor() {
 *     super(new S2GeometryProvider());
 *   }
 *   ...
 * }
 * ```
 */
export abstract class DataProviderBase extends EventEmitter implements IDataProvider {
    /**
     * Create a new data provider base instance.
     *
     * @param {IGeometryProvider} geometry - Geometry
     * provider instance.
     */
    constructor(protected _geometry: IGeometryProvider) {
        super();
    }

    /**
     * Get geometry property.
     *
     * @returns {IGeometryProvider} Geometry provider instance.
     */
    public get geometry(): IGeometryProvider {
        return this._geometry;
    }

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
    public fire(
        type: "datacreate",
        event: ProviderCellEvent)
        : void;
    /** @ignore */
    public fire(
        type: ProviderEventType,
        event: ProviderEvent)
        : void;
    public fire<T>(
        type: ProviderEventType,
        event: T)
        : void {
        super.fire(type, event);
    }

    /**
     * Get core images in a geometry cell.
     *
     * @param {string} cellId - The id of the geometry cell.
     * @returns {Promise<CoreImagesContract>} Promise to
     * the core images of the requested geometry cell id.
     * @throws Rejects the promise on errors.
     */
    public getCoreImages(
        cellId: string): Promise<CoreImagesContract> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

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
    public getCluster(
        url: string,
        abort?: Promise<void>): Promise<ClusterContract> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get spatial images.
     *
     * @param {Array<string>} imageIds - The ids for the
     * images to retrieve.
     * @returns {Promise<SpatialImagesContract>} Promise to
     * the spatial images of the requested image ids.
     * @throws Rejects the promise on errors.
     */
    public getSpatialImages(
        imageIds: string[]): Promise<SpatialImagesContract> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get complete images.
     *
     * @param {Array<string>} imageIds - The ids for the
     * images to retrieve.
     * @returns {Promise<ImagesContract>} Promise to the images of the
     * requested image ids.
     * @throws Rejects the promise on errors.
     */
    public getImages(
        imageIds: string[]): Promise<ImagesContract> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

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
    public getImageBuffer(
        url: string,
        abort?: Promise<void>): Promise<ArrayBuffer> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

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
    public getImageTiles(
        tiles: ImageTilesRequestContract): Promise<ImageTilesContract> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get a mesh.
     *
     * @param {string} url - URL for mesh to retrieve.
     * @param {Promise<void>} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<MeshContract>} Promise to the mesh.
     * @throws Rejects the promise on errors.
     */
    public getMesh(
        url: string,
        abort?: Promise<void>): Promise<MeshContract> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get sequence.
     *
     * @param {Array<string>} sequenceId - The id for the
     * sequence to retrieve.
     * @returns {Promise} Promise to the sequences of the
     * requested image ids.
     * @throws Rejects the promise on errors.
     */
    public getSequence(
        sequenceId: string): Promise<SequenceContract> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    public off(
        type: ProviderCellEvent["type"],
        handler: (event: ProviderCellEvent) => void)
        : void;
    /** @ignore */
    public off(
        type: ProviderEventType,
        handler: (event: ProviderEvent) => void)
        : void;
    public off<T>(
        type: ProviderEventType,
        handler: (event: T) => void)
        : void {
        super.off(type, handler);
    }

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
    public on(
        type: "datacreate",
        handler: (event: ProviderCellEvent) => void)
        : void;
    /** @ignore */
    public on(
        type: ProviderEventType,
        handler: (event: ProviderEvent) => void)
        : void;
    public on<T>(
        type: ProviderEventType,
        handler: (event: T) => void)
        : void {
        super.on(type, handler);
    }

    /**
     * Set an access token for authenticated API requests of
     * protected resources.
     *
     * @param {string} [accessToken] accessToken - User access
     * token or client access token.
     */
    public setAccessToken(accessToken?: string): void {
        throw new MapillaryError("Not implemented");
    }
}
