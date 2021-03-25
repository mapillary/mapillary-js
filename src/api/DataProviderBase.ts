import { MapillaryError } from "../error/MapillaryError";
import { EventEmitter } from "../utils/EventEmitter";
import { ClusterReconstructionContract }
    from "./contracts/ClusterReconstructionContract";
import { MeshContract } from "./contracts/MeshContract";
import { GeometryProviderBase } from "./GeometryProviderBase";
import { CoreImagesContract } from "./contracts/CoreImagesContract";
import { SpatialImagesContract } from "./contracts/SpatialImagesContract";
import { ImagesContract } from "./contracts/ImagesContract";
import { SequenceContract } from "./contracts/SequenceContract";
import { ImageTilesContract } from "./contracts/ImageTilesContract";
import { ImageTilesRequestContract }
    from "./contracts/ImageTilesRequestContract";

/**
 * @class DataProviderBase
 *
 * @classdesc Base class to extend if implementing a data provider
 * class.
 *
 * @fires IDataAddedEvent
 *
 * @example
 * ```
 * class MyDataProvider extends Mapillary.API.DataProviderBase {
 *      constructor() {
 *          super(new Mapillary.API.S2GeometryProvider());
 *      }
 *      ...
 * }
 * ```
 */
export abstract class DataProviderBase extends EventEmitter {
    /**
     * Create a new data provider base instance.
     *
     * @param {GeometryProviderBase} geometry - Geometry
     * provider instance.
     */
    constructor(protected _geometry: GeometryProviderBase) {
        super();
        if (!(this._geometry instanceof GeometryProviderBase)) {
            throw new MapillaryError(
                "The data provider requires a geometry provider base instance.");
        }
    }

    /**
     * Get geometry property.
     *
     * @returns {GeometryProviderBase} Geometry provider instance.
     */
    public get geometry(): GeometryProviderBase {
        return this._geometry;
    }

    /**
     * Get core properties for images in a geometry cell.
     *
     * @param {string} cellId - The id of the geometry cell.
     * @returns {Promise<CoreImagesContract>} Promise to
     * the core images of the requested geometry cell id.
     * @throws {Error} Rejects the promise on errors.
     */
    public getCoreImages(
        cellId: string): Promise<CoreImagesContract> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get a cluster reconstruction.
     *
     * @param {string} url - URL for the cluster reconstructino
     * to retrieve.
     * @param {Promise} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<ClusterReconstructionContract>} Promise to the
     * cluster reconstruction.
     * @throws {Error} Rejects the promise on errors.
     */
    public getClusterReconstruction(
        url: string,
        abort?: Promise<void>): Promise<ClusterReconstructionContract> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get fill properties for images.
     *
     * @param {Array<string>} imageIds - The ids for the
     * images to retrieve.
     * @returns {Promise<SpatialImagesContract>} Promise to
     * the spatial images of the requested image ids.
     * @throws {Error} Rejects the promise on errors.
     */
    public getSpatialImages(
        imageIds: string[]): Promise<SpatialImagesContract> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get all properties for images.
     *
     * @param {Array<string>} imageIds - The ids for the
     * images to retrieve.
     * @returns {Promise<ImagesContract>} Promise to the images of the
     * requested image ids.
     * @throws {Error} Rejects the promise on errors.
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
     * @throws {Error} Rejects the promise on errors.
     */
    public getImageBuffer(
        url: string,
        abort?: Promise<void>): Promise<ArrayBuffer> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get image tiles urls for a single tile or
     * a tile level.
     *
     * @param {ImageTilesRequestContract} tiles - Tiles to request
     * @returns {Promise<ImageTilesContract>} Promise to the
     * image tiles response contract
     * @throws {Error} Rejects the promise on errors.
     *
     * @example
     * var singleTile = { imageId: 'image-id', x: 0, y: 0, z: 12 };
     * provider.getImageTiles(singleTile)
     *   .then((response) => console.log(response));
     *
     * var tileLevel = { imageId: 'image-id', z: 12 };
     * provider.getImageTiles(tileLevel)
     *   .then((response) => console.log(response));
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
     * @throws {Error} Rejects the promise on errors.
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
     * @throws {Error} Rejects the promise on errors.
     */
    public getSequence(
        sequenceId: string): Promise<SequenceContract> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Set a user token for authenticated API requests of
     * protected resources.
     *
     * @param {string} [userToken] userToken - User bearer token.
     */
    public setUserToken(userToken?: string): void {
        throw new MapillaryError("Not implemented");
    }
}
