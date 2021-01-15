import * as falcor from "falcor";

import MapillaryError from "../error/MapillaryError";
import IMesh from "./interfaces/IMesh";
import PbfMeshReader from "./PbfMeshReader";
import ModelCreator from "./ModelCreator";
import ICoreNode from "./interfaces/ICoreNode";
import IFillNode from "./interfaces/IFillNode";
import IFullNode from "./interfaces/IFullNode";
import ISequence from "./interfaces/ISequence";
import IClusterReconstruction from "./interfaces/IClusterReconstruction";
import DataProviderBase from "./DataProviderBase";
import IFalcorDataProviderOptions from "./interfaces/IFalcorDataProviderOptions";
import IGeometryProvider from "./interfaces/IGeometryProvider";
import GeohashGeometryProvider from "./GeohashGeometryProvider";
import { ImageSize } from "../viewer/ImageSize";
import JsonInflator from "./JsonInflator";
import BufferFetcher from "./BufferFetcher";

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
 * @class PointsGeometry
 *
 * @classdesc Represents a point set in the 2D basic image coordinate system.
 *
 * @example
 * ```
 * var points = [[0.5, 0.3], [0.7, 0.3], [0.6, 0.5]];
 * var pointsGeometry = new Mapillary.TagComponent.PointsGeometry(points);
 * ```
 */
export class FalcorDataProviderUrls {
    private _apiHost: string = "a.mapillary.com";
    private _clientToken: string;
    private _clusterReconstructionHost: string =
        "cluster-reconstructions.mapillary.com";
    private _imageHost: string = "images.mapillary.com";
    private _imageTileHost: string = "loris.mapillary.com";
    private _meshHost: string = "meshes.mapillary.com";
    private _origin: string = "mapillary.webgl";
    private _scheme: string = "https";

    /**
     * Create a new Falcor data provider URLs instance.
     *
     * @param {IFalcorDataProviderOptions} options - Options struct.
     */
    constructor(options: IFalcorDataProviderOptions) {
        this._clientToken = options.clientToken;

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
        return `${this._scheme}://${this._apiHost}/v3/model.json?client_id=${this._clientToken}`;
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
 * @class FalcorDataProvider
 *
 * @classdesc Provides data through Falcor API calls.
 */
export class FalcorDataProvider extends DataProviderBase {
    private _urls: FalcorDataProviderUrls;

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
     * Create a new Falcor data provider instance.
     *
     * @param {IFalcorDataProviderOptions} options - Options struct.
     * @param {IGeometryProvider} [geometry] - Optional geometry
     * provider instance.
     */
    constructor(
        options: IFalcorDataProviderOptions,
        geometry?: IGeometryProvider) {

        super(!!geometry ? geometry : new GeohashGeometryProvider());

        if (!(this._geometry instanceof GeohashGeometryProvider)) {
            throw new MapillaryError(
                "The falcor data provider requires the geohash geometry provider.");
        }

        this._urls = new FalcorDataProviderUrls(options);

        this._modelCreator = options.creator != null ?
            options.creator : new ModelCreator();
        this._model = this._modelCreator.createModel(
            this._urls.falcorModel, options.userToken);

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
            "organization_key",
            "private",
            "project",
            "quality_score",
            "user",
        ];

        this._propertiesKey = [
            "key",
        ];

        this._propertiesSequence = [
            "keys",
        ];

        this._propertiesSpatial = [
            "altitude",
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

    /**
     * @inheritdoc
     */
    public getCoreImages(cellId: string):
        Promise<{ [cellId: string]: { [imageKey: string]: ICoreNode } }> {
        return Promise.resolve(<PromiseLike<falcor.JSONEnvelope<IImagesByH<ICoreNode>>>>this._model
            .get([
                this._pathImagesByH,
                [cellId],
                { from: 0, to: this._pageCount },
                this._propertiesKey
                    .concat(this._propertiesCore)]))
            .then(
                (value: falcor.JSONEnvelope<IImagesByH<ICoreNode>>): { [h: string]: { [index: string]: ICoreNode } } => {
                    if (!value) {
                        value = { json: { imagesByH: {} } };
                        for (const h of [cellId]) {
                            value.json.imagesByH[h] = {};
                            for (let i: number = 0; i <= this._pageCount; i++) {
                                value.json.imagesByH[h][i] = null;
                            }
                        }
                    }

                    return value.json.imagesByH;
                },
                (error: Error) => {
                    this._invalidateGet(this._pathImagesByH, [cellId]);
                    throw error;
                });
    }

    /**
     * @inheritdoc
     */
    public getClusterReconstruction(url: string, abort?: Promise<void>): Promise<IClusterReconstruction> {
        return BufferFetcher.getArrayBuffer(url, abort)
            .then(
                (buffer: ArrayBuffer): IClusterReconstruction => {
                    const reconstructions: IClusterReconstruction[] =
                        JsonInflator.decompress(buffer);

                    if (reconstructions.length < 1) {
                        throw new MapillaryError("Cluster reconstruction is empty.");
                    }

                    return reconstructions[0];
                },
                (reason: Error): IClusterReconstruction => {
                    throw reason;
                });
    }

    /**
     * @inheritdoc
     */
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

                    return this._populateUrls(value.json.imageByKey);
                },
                (error: Error) => {
                    this._invalidateGet(this._pathImageByKey, keys);
                    throw error;
                });
    }

    /**
     * @inheritdoc
     */
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

                    return this._populateUrls(value.json.imageByKey);
                },
                (error: Error) => {
                    this._invalidateGet(this._pathImageByKey, keys);
                    throw error;
                });
    }

    /**
     * @inheritdoc
     */
    public getImage(url: string, abort?: Promise<void>): Promise<ArrayBuffer> {
        return BufferFetcher.getArrayBuffer(url, abort);
    }

    /**
     * @inheritdoc
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
        const coords: string = `${x},${y},${w},${h}`
        const size: string = `${scaledW},${scaledH}`;
        return BufferFetcher.getArrayBuffer(
            this._urls.imageTile(imageKey, coords, size),
            abort);
    }

    /**
     * @inheritdoc
     */
    public getMesh(url: string, abort?: Promise<void>): Promise<IMesh> {
        return BufferFetcher.getArrayBuffer(url, abort)
            .then(
                (buffer: ArrayBuffer): IMesh => {
                    return PbfMeshReader.read(buffer);
                },
                (reason: Error): IMesh => {
                    throw reason;
                });
    }

    /**
     * @inheritdoc
     */
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

    /**
     * @inheritdoc
     */
    public setUserToken(userToken?: string): void {
        this._model.invalidate([]);
        this._model = null;
        this._model = this._modelCreator.createModel(
            this._urls.falcorModel, userToken);
    }

    private _invalidateGet(path: APIPath, paths: string[]): void {
        this._model.invalidate([path, paths]);
    }

    private _populateUrls<T extends IFillNode>(ibk: { [key: string]: T }): { [key: string]: T } {
        for (let key in ibk) {
            if (!ibk.hasOwnProperty(key)) {
                continue;
            }

            const image: T = ibk[key];
            image.cluster_url = this._urls.clusterReconstruction(image.cluster_key);
            image.mesh_url = this._urls.protoMesh(key);
            image.thumb320_url = this._urls.thumbnail(
                key, ImageSize.Size320, this._urls.origin);
            image.thumb640_url = this._urls.thumbnail(
                key, ImageSize.Size640, this._urls.origin);
            image.thumb1024_url = this._urls.thumbnail(
                key, ImageSize.Size1024, this._urls.origin);
            image.thumb2048_url = this._urls.thumbnail(
                key, ImageSize.Size2048, this._urls.origin);
        }

        return ibk;
    }
}

export default FalcorDataProvider;
