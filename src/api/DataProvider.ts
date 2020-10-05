import * as falcor from "falcor";
import * as pako from "pako";


import MapillaryError from "../error/MapillaryError";
import IMesh from "./interfaces/IMesh";
import MeshReader from "./MeshReader";
import Urls from "../utils/Urls";
import IClusterReconstruction from "../component/spatialdata/interfaces/IClusterReconstruction";
import IDataProvider from "./interfaces/IDataProvider";
import ModelCreator from "./ModelCreator";
import ICoreNode from "./interfaces/ICoreNode";
import IFillNode from "./interfaces/IFillNode";
import IFullNode from "./interfaces/IFullNode";
import ISequence from "./interfaces/ISequence";

interface IImageByKey<T> {
    imageByKey: { [key: string]: T };
}

interface IImagesByH<T> {
    imagesByH: { [key: string]: { [index: string]: T } };
}

interface ISequenceByKey<T> {
    sequenceByKey: { [sequenceKey: string]: T };
}

type APIPath =
    "imageByKey" |
    "imagesByH" |
    "sequenceByKey";

/**
 * @class DataProvider
 *
 * @classdesc Provides data through API calls.
 */
export class DataProvider implements IDataProvider {
    private _clientId: string;

    private _model: falcor.Model;
    private _modelCreator: ModelCreator;

    private _pageCount: number;

    private _pathImageByKey: APIPath;
    private _pathImagesByH: APIPath;
    private _pathSequenceByKey: APIPath;

    private _propertiesCore: string[];
    private _propertiesFill: string[];
    private _propertiesKey: string[];
    private _propertiesSequence: string[];
    private _propertiesSpatial: string[];
    private _propertiesUser: string[];

    /**
     * Create a new data provider instance.
     *
     * @param {number} clientId - Client id for API requests.
     * @param {number} [token] - Optional bearer token for API requests of
     * protected resources.
     * @param {ModelCreator} [creator] - Optional model creator instance.
     */
    constructor(clientId: string, token?: string, creator?: ModelCreator) {
        this._clientId = clientId;

        this._modelCreator = creator != null ? creator : new ModelCreator();
        this._model = this._modelCreator.createModel(clientId, token);

        this._pageCount = 999;

        this._pathImageByKey = "imageByKey";
        this._pathImagesByH = "imagesByH";
        this._pathSequenceByKey = "sequenceByKey";

        this._propertiesCore = [
            "cl",
            "l",
            "sequence_key",
        ];

        this._propertiesFill = [
            "captured_at",
            "captured_with_camera_uuid",
            "user",
            "organization_key",
            "private",
            "project",
        ];

        this._propertiesKey = [
            "key",
        ];

        this._propertiesSequence = [
            "keys",
        ];

        this._propertiesSpatial = [
            "atomic_scale",
            "cluster_key",
            "c_rotation",
            "ca",
            "calt",
            "camera_projection_type",
            "cca",
            "cfocal",
            "ck1",
            "ck2",
            "gpano",
            "height",
            "merge_cc",
            "merge_version",
            "orientation",
            "width",
        ];

        this._propertiesUser = [
            "username",
        ];
    }

    public get clientId(): string {
        return this._clientId;
    }

    public getCoreImages(geohashes: string[]):
        Promise<{ [geohash: string]: { [imageKey: string]: ICoreNode } }> {
        return Promise.resolve(<PromiseLike<falcor.JSONEnvelope<IImagesByH<ICoreNode>>>>this._model
            .get([
                this._pathImagesByH,
                geohashes,
                { from: 0, to: this._pageCount },
                this._propertiesKey
                    .concat(this._propertiesCore)]))
            .then(
                (value: falcor.JSONEnvelope<IImagesByH<ICoreNode>>): { [h: string]: { [index: string]: ICoreNode } } => {
                    if (!value) {
                        value = { json: { imagesByH: {} } };
                        for (const h of geohashes) {
                            value.json.imagesByH[h] = {};
                            for (let i: number = 0; i <= this._pageCount; i++) {
                                value.json.imagesByH[h][i] = null;
                            }
                        }
                    }

                    return value.json.imagesByH;
                },
                (error: Error) => {
                    this._invalidateGet(this._pathImagesByH, geohashes);
                    throw error;
                });
    }

    public getClusterReconstruction(clusterKey: string, abort?: Promise<void>): Promise<IClusterReconstruction> {
        return this._getArrayBuffer(Urls.clusterReconstruction(clusterKey), abort)
            .then(
                (buffer: ArrayBuffer): IClusterReconstruction => {
                    const inflated: string =
                        pako.inflate(<pako.Data>buffer, { to: "string" });

                    const reconstructions: IClusterReconstruction[] =
                        JSON.parse(inflated);

                    if (reconstructions.length < 1) {
                        throw new MapillaryError("");
                    }

                    const reconstruction: IClusterReconstruction = reconstructions[0];
                    reconstruction.key = clusterKey;

                    return reconstruction;
                },
                (reason: Error): IClusterReconstruction => {
                    throw reason;
                });
    }

    public getFillImages(keys: string[]): Promise<{ [key: string]: IFillNode }> {
        return Promise.resolve(<PromiseLike<falcor.JSONEnvelope<IImageByKey<IFillNode>>>>this._model
            .get([
                this._pathImageByKey,
                keys,
                this._propertiesKey
                    .concat(this._propertiesFill)
                    .concat(this._propertiesSpatial),
                this._propertiesKey
                    .concat(this._propertiesUser)]))
            .then(
                (value: falcor.JSONEnvelope<IImageByKey<IFillNode>>): { [key: string]: IFillNode } => {
                    if (!value) {
                        this._invalidateGet(this._pathImageByKey, keys);
                        throw new Error(`Images (${keys.join(", ")}) could not be found.`);
                    }

                    return value.json.imageByKey;
                },
                (error: Error) => {
                    this._invalidateGet(this._pathImageByKey, keys);
                    throw error;
                });
    }

    public getFullImages(keys: string[]): Promise<{ [key: string]: IFullNode }> {
        return Promise.resolve(<PromiseLike<falcor.JSONEnvelope<IImageByKey<IFullNode>>>>this._model
            .get([
                this._pathImageByKey,
                keys,
                this._propertiesKey
                    .concat(this._propertiesCore)
                    .concat(this._propertiesFill)
                    .concat(this._propertiesSpatial),
                this._propertiesKey
                    .concat(this._propertiesUser)]))
            .then(
                (value: falcor.JSONEnvelope<IImageByKey<IFullNode>>): { [key: string]: IFullNode } => {
                    if (!value) {
                        this._invalidateGet(this._pathImageByKey, keys);
                        throw new Error(`Images (${keys.join(", ")}) could not be found.`);
                    }

                    return value.json.imageByKey;
                },
                (error: Error) => {
                    this._invalidateGet(this._pathImageByKey, keys);
                    throw error;
                });
    }

    public getImage(imageKey: string, size: number, abort?: Promise<void>): Promise<ArrayBuffer> {
        return this._getArrayBuffer(Urls.thumbnail(imageKey, size, Urls.origin), abort);
    }

    public getImageTile(
        imageKey: string,
        x: number,
        y: number,
        w: number,
        h: number,
        scaledW: number,
        scaledH: number,
        abort?: Promise<void>): Promise<ArrayBuffer> {
        const coords: string = `${x},${y},${w},${h}`
        const size: string = `${scaledW},${scaledH}`;

        return this._getArrayBuffer(
            Urls.imageTile(imageKey, coords, size),
            abort);
    }

    public getMesh(imageKey: string, abort?: Promise<void>): Promise<IMesh> {
        return this._getArrayBuffer(Urls.protoMesh(imageKey), abort)
            .then(
                (buffer: ArrayBuffer): IMesh => {
                    return MeshReader.read(new Buffer(buffer));
                },
                (reason: Error): IMesh => {
                    throw reason;
                });
    }

    public getSequences(sequenceKeys: string[]):
        Promise<{ [sequenceKey: string]: ISequence }> {
        return Promise.resolve(<PromiseLike<falcor.JSONEnvelope<ISequenceByKey<ISequence>>>>this._model
            .get([
                this._pathSequenceByKey,
                sequenceKeys,
                this._propertiesKey
                    .concat(this._propertiesSequence)]))
            .then(
                (value: falcor.JSONEnvelope<ISequenceByKey<ISequence>>): { [sequenceKey: string]: ISequence } => {
                    if (!value) {
                        value = { json: { sequenceByKey: {} } };
                    }

                    for (const sequenceKey of sequenceKeys) {
                        if (!(sequenceKey in value.json.sequenceByKey)) {
                            console.warn(`Sequence data missing (${sequenceKey})`);

                            value.json.sequenceByKey[sequenceKey] = { key: sequenceKey, keys: [] };
                        }
                    }

                    return value.json.sequenceByKey;
                },
                (error: Error) => {
                    this._invalidateGet(this._pathSequenceByKey, sequenceKeys);
                    throw error;
                });
    }

    public setToken(token?: string): void {
        this._model.invalidate([]);
        this._model = null;
        this._model = this._modelCreator.createModel(this._clientId, token);
    }

    protected _getArrayBuffer(url: string, abort?: Promise<void>): Promise<ArrayBuffer> {
        const xhr: XMLHttpRequest = new XMLHttpRequest();

        const promise: Promise<ArrayBuffer> = new Promise(
            (resolve, reject) => {
                xhr.open("GET", url, true);
                xhr.responseType = "arraybuffer";
                xhr.timeout = 15000;

                xhr.onload = () => {
                    if (xhr.status !== 200) {
                        reject(new MapillaryError(`Response status error: ${url}`));
                    }

                    if (!xhr.response) {
                        reject(new MapillaryError(`Response empty: ${url}`));
                    }

                    resolve(xhr.response);
                };

                xhr.onerror = () => {
                    reject(new MapillaryError(`Request error: ${url}`));
                };

                xhr.ontimeout = (e: Event) => {
                    reject(new MapillaryError(`Request timeout: ${url}`));
                };

                xhr.onabort = (e: Event) => {
                    reject(new MapillaryError(`Request aborted: ${url}`));
                };

                xhr.send(null);
            });

        if (!!abort) { abort.catch((): void => { xhr.abort(); }); }

        return promise;
    }

    private _invalidateGet(path: APIPath, paths: string[]): void {
        this._model.invalidate([path, paths]);
    }
}

export default DataProvider;
