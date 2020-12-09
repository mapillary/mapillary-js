import IDataProvider from "./interfaces/IDataProvider";
import MapillaryError from "../error/MapillaryError";
import ICoreNode from "./interfaces/ICoreNode";
import IClusterReconstruction from "./interfaces/IClusterReconstruction";
import IFillNode from "./interfaces/IFillNode";
import IFullNode from "./interfaces/IFullNode";
import IMesh from "./interfaces/IMesh";
import ISequence from "./interfaces/ISequence";
import IGeometryProvider from "./interfaces/IGeometryProvider";
import GeometryProviderBase from "./GeometryProviderBase";

/**
 * @class DataProviderBase
 *
 * @classdesc Base class to extend if implementing a data provider
 * class.
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
export class DataProviderBase implements IDataProvider {
    /**
     * Create a new data provider base instance.
     *
     * @param {IGeometryProvider} geometry - Geometry
     * provider instance.
     */
    constructor(protected _geometry: IGeometryProvider) {
        if (!(this._geometry instanceof GeometryProviderBase)) {
            throw new MapillaryError(
                "The data provider requires a geometry provider base instance.");
        }
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
     * Get core properties for images in a geometry cell.
     *
     * @param {string} cellId - The id of the geometry cell.
     * @returns {Promise} Promise to the core nodes of the
     * requested cell id.
     * @throws {Error} Rejects the promise on errors.
     */
    public getCoreImages(cellId: string):
        Promise<{ [cellId: string]: { [imageKey: string]: ICoreNode } }> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get a cluster reconstruction.
     *
     * @param {string} url - URL for the cluster reconstructino
     * to retrieve.
     * @param {Promise} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<IClusterReconstruction>} Promise to the
     * cluster reconstruction.
     * @throws {Error} Rejects the promise on errors.
     */
    public getClusterReconstruction(url: string, abort?: Promise<void>):
        Promise<IClusterReconstruction> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get fill properties for images.
     *
     * @param {Array<string>} imageKeys - The keys for the
     * images to retrieve.
     * @returns {Promise} Promise to the fill nodes of the
     * requested image keys.
     * @throws {Error} Rejects the promise on errors.
     */
    public getFillImages(imageKeys: string[]):
        Promise<{ [imageKey: string]: IFillNode }> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get all properties for images.
     *
     * @param {Array<string>} imageKeys - The keys for the
     * images to retrieve.
     * @returns {Promise} Promise to the full nodes of the
     * requested image keys.
     * @throws {Error} Rejects the promise on errors.
     */
    public getFullImages(imageKeys: string[]):
        Promise<{ [imageKey: string]: IFullNode }> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get an image as an array buffer.
     *
     * @param {string} url - URL for image to retrieve.
     * @param {Promise} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<ArrayBuffer>} Promise to the array
     * buffer containing the image.
     * @throws {Error} Rejects the promise on errors.
     */
    public getImage(url: string, abort?: Promise<void>):
        Promise<ArrayBuffer> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get an image tile as an array buffer.
     *
     * @param {string} imageKey - Image key.
     * @param {number} x - Pixel coordinate.
     * @param {number} y - Pixel coordinate.
     * @param {number} w - Pixel width.
     * @param {number} h - Pixel height.
     * @param {number} scaledW - Scaled width for returned tile.
     * @param {number} scaledH - Scaled height for returned tile.
     * @param {Promise} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<ArrayBuffer>} Promise to the array
     * buffer containing the image.
     * @throws {Error} Rejects the promise on errors.
     */
    public getImageTile(
        imageKey: string,
        x: number,
        y: number,
        w: number,
        h: number,
        scaledW: number,
        scaledH: number,
        abort?: Promise<void>): Promise<ArrayBuffer> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get a mesh.
     *
     * @param {string} url - URL for mesh to retrieve.
     * @param {Promise} [abort] - Optional promise for aborting
     * the request through rejection.
     * @returns {Promise<IMesh>} Promise to the mesh.
     * @throws {Error} Rejects the promise on errors.
     */
    public getMesh(url: string, abort?: Promise<void>): Promise<IMesh> {
        return Promise.reject(new MapillaryError("Not implemented"));
    }

    /**
     * Get sequences.
     *
     * @param {Array<string>} sequenceKeys - The keys for the
     * sequences to retrieve.
     * @returns {Promise} Promise to the sequences of the
     * requested image keys.
     * @throws {Error} Rejects the promise on errors.
     */
    public getSequences(sequenceKeys: string[]):
        Promise<{ [sequenceKey: string]: ISequence }> {
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

export default DataProviderBase;
