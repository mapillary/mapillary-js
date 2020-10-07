import * as falcor from "falcor";
import * as pako from "pako";

import MapillaryError from "../error/MapillaryError";
import IMesh from "./interfaces/IMesh";
import MeshReader from "./MeshReader";
import ModelCreator from "./ModelCreator";
import ICoreNode from "./interfaces/ICoreNode";
import IFillNode from "./interfaces/IFillNode";
import IFullNode from "./interfaces/IFullNode";
import ISequence from "./interfaces/ISequence";
import IClusterReconstruction from "./interfaces/IClusterReconstruction";
import DataProviderBase from "./DataProviderBase";
import IDataProviderOptions from "./IDataProviderOptions";

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

export class DataProviderUrls {
    private _apiHost: string = "a.mapillary.com";
    private _clientId: string;
    private _clusterReconstructionHost: string =
        "cluster-reconstructions.mapillary.com";
    private _imageHost: string = "images.mapillary.com";
    private _imageTileHost: string = "loris.mapillary.com";
    private _meshHost: string = "meshes.mapillary.com";
    private _origin: string = "mapillary.webgl";
    private _scheme: string = "https";

    constructor(options: IDataProviderOptions) {
        this._clientId = options.clientId;

        if (!!options.apiHost) {
            this._apiHost = options.apiHost;
        }

        if (!!options.clusterReconstructionHost) {
            this._clusterReconstructionHost = options.clusterReconstructionHost;
        }

        if (!!options.imageHost) {
            this._imageHost = options.imageHost;
        }

        if (!!options.imageTileHost) {
            this._imageTileHost = options.imageTileHost;
        }

        if (!!options.meshHost) {
            this._meshHost = options.meshHost;
        }

        if (!!options.scheme) {
            this._scheme = options.scheme;
        }
    }

    public get falcorModel(): string {
        return `${this._scheme}://${this._apiHost}/v3/model.json?client_id=${this._clientId}`;
    }

    public get origin(): string {
        return this._origin;
    }

    public get tileScheme(): string {
        return this._scheme;
    }

    public get tileDomain(): string {
        return this._imageTileHost;
    }

    public clusterReconstruction(key: string): string {
        return `${this._scheme}://${this._clusterReconstructionHost}/${key}/v1.0/aligned.jsonz`;
    }

    public imageTile(imageKey: string, coords: string, size: string): string {
        return `${this.tileScheme}://${this.tileDomain}/${imageKey}/${coords}/${size}/0/default.jpg`;
    }

    public protoMesh(key: string): string {
        return `${this._scheme}://${this._meshHost}/v2/mesh/${key}`;
    }

    public thumbnail(key: string, size: number, origin?: string): string {
        const query: string = !!origin ? `?origin=${origin}` : "";

        return `${this._scheme}://${this._imageHost}/${key}/thumb-${size}.jpg${query}`;
    }
}

/**
 * @class DataProvider
 *
 * @classdesc Provides data through API calls.
 */
export class DataProvider extends DataProviderBase {
    private _clientId: string;
    private _urls: DataProviderUrls;

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
    constructor(options: IDataProviderOptions) {
        super();

        this._clientId = options.clientId;
        this._urls = new DataProviderUrls(options);

        this._modelCreator = options.creator != null ?
            options.creator : new ModelCreator();
        this._model = this._modelCreator.createModel(
            this._urls.falcorModel, options.token);

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
        return this._getArrayBuffer(this._urls.clusterReconstruction(clusterKey), abort)
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
        return this._getArrayBuffer(this._urls.thumbnail(imageKey, size, this._urls.origin), abort);
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
            this._urls.imageTile(imageKey, coords, size),
            abort);
    }

    public getMesh(imageKey: string, abort?: Promise<void>): Promise<IMesh> {
        return this._getArrayBuffer(this._urls.protoMesh(imageKey), abort)
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
        this._model = this._modelCreator.createModel(
            this._urls.falcorModel, token);
    }

    private _invalidateGet(path: APIPath, paths: string[]): void {
        this._model.invalidate([path, paths]);
    }
}

export default DataProvider;
