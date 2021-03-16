import {
    JSONEnvelope,
    Model,
} from "falcor";

import { BufferFetcher } from "./BufferFetcher";
import { DataProviderBase } from "./DataProviderBase";
import { GeohashGeometryProvider } from "./GeohashGeometryProvider";
import { JsonInflator } from "./JsonInflator";
import { ModelCreator } from "./ModelCreator";
import { PbfMeshReader } from "./PbfMeshReader";
import { ReconstructionEnt } from "./ents/ReconstructionEnt";
import { CoreImageEnt } from "./ents/CoreImageEnt";
import { FalcorDataProviderOptions } from "./interfaces/FalcorDataProviderOptions";
import { SpatialImageEnt } from "./ents/SpatialImageEnt";
import { ImageEnt } from "./ents/ImageEnt";
import { MeshEnt } from "./ents/MeshEnt";

import { MapillaryError } from "../error/MapillaryError";
import { ImageSize } from "../viewer/ImageSize";
import { GeometryProviderBase } from "./GeometryProviderBase";
import { SequenceEnt } from "./ents/SequenceEnt";
import { LatLonAltEnt } from "./ents/LatLonAltEnt";
import { CameraEnt } from "./ents/CameraEnt";


interface ImageByKey<T> {
    imageByKey: { [key: string]: T };
}

interface ImagesByH<T> {
    imagesByH: { [key: string]: { [index: string]: T } };
}

interface SequenceByKey<T> {
    sequenceByKey: { [sequenceKey: string]: T };
}

type APIPath =
    "imageByKey" |
    "imagesByH" |
    "sequenceByKey";

interface FalcorCameraEnt extends CameraEnt {
    focal?: number;
    k1?: number;
    k2?: number;
    projection_type?: string;
}

interface FalcorReconstructionEnt extends ReconstructionEnt {
    cameras: { [key: string]: FalcorCameraEnt };
    reference_lla?: {
        altitude: number,
        latitude: number,
        longitude: number,
    }
}

interface FalcorSpatialImageEnt extends SpatialImageEnt {
    camera_projection_type: string;
}

interface FalcorImageEnt extends ImageEnt, FalcorSpatialImageEnt { }

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
     * @param {FalcorDataProviderOptions} options - Options struct.
     */
    constructor(options: FalcorDataProviderOptions) {
        this._clientToken = options.clientToken;

        if (!!options.apiHost) {
            this._apiHost = options.apiHost;
        }

        if (!!options.reconstructionHost) {
            this._clusterReconstructionHost = options.reconstructionHost;
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

    private _model: Model;
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
     * @param {FalcorDataProviderOptions} options - Options struct.
     * @param {GeometryProviderBase} [geometry] - Optional geometry
     * provider instance.
     */
    constructor(
        options: FalcorDataProviderOptions,
        geometry?: GeometryProviderBase) {

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
        Promise<{ [cellId: string]: { [imageKey: string]: CoreImageEnt } }> {
        return Promise.resolve(<PromiseLike<JSONEnvelope<ImagesByH<CoreImageEnt>>>>this._model
            .get([
                this._pathImagesByH,
                [cellId],
                { from: 0, to: this._pageCount },
                this._propertiesKey
                    .concat(this._propertiesCore)]))
            .then(
                (value: JSONEnvelope<ImagesByH<CoreImageEnt>>): { [h: string]: { [index: string]: CoreImageEnt } } => {
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
    public getClusterReconstruction(
        url: string,
        abort?: Promise<void>): Promise<ReconstructionEnt> {
        return BufferFetcher.getArrayBuffer(url, abort)
            .then(
                (buffer: ArrayBuffer): FalcorReconstructionEnt => {
                    const reconstructions: FalcorReconstructionEnt[] =
                        JsonInflator.decompress(buffer);

                    if (reconstructions.length < 1) {
                        throw new MapillaryError("Cluster reconstruction is empty.");
                    }

                    const reconstruction = reconstructions[0];
                    const referenceLla = reconstruction.reference_lla;
                    const reference: LatLonAltEnt = {
                        alt: referenceLla.altitude,
                        lat: referenceLla.latitude,
                        lon: referenceLla.longitude,
                    };
                    reconstruction.reference = reference;

                    const cameraEnts: { [key: string]: CameraEnt } = {};
                    const cameras = reconstruction.cameras;
                    for (const cameraId in cameras) {
                        if (reconstruction.cameras.hasOwnProperty(cameraId)) {
                            continue;
                        }

                        const camera = cameras[cameraId];
                        cameraEnts[cameraId] = {
                            cfocal: camera.focal,
                            ck1: camera.ck1,
                            ck2: camera.ck2,
                            camera_type: camera.projection_type,
                        };
                    }
                    reconstruction.cameras = cameraEnts;

                    return reconstructions[0];
                },
                (reason: Error): FalcorReconstructionEnt => {
                    throw reason;
                });
    }

    /**
     * @inheritdoc
     */
    public getFillImages(keys: string[]): Promise<{ [key: string]: SpatialImageEnt }> {
        return Promise.resolve(<PromiseLike<JSONEnvelope<ImageByKey<FalcorSpatialImageEnt>>>>this._model
            .get([
                this._pathImageByKey,
                keys,
                this._propertiesKey
                    .concat(this._propertiesFill)
                    .concat(this._propertiesSpatial),
                this._propertiesKey
                    .concat(this._propertiesUser)]))
            .then(
                (value: JSONEnvelope<ImageByKey<FalcorSpatialImageEnt>>): { [key: string]: FalcorSpatialImageEnt } => {
                    if (!value) {
                        this._invalidateGet(this._pathImageByKey, keys);
                        throw new Error(`Images (${keys.join(", ")}) could not be found.`);
                    }

                    return this._populateProperties(value.json.imageByKey);
                },
                (error: Error) => {
                    this._invalidateGet(this._pathImageByKey, keys);
                    throw error;
                });
    }

    /**
     * @inheritdoc
     */
    public getFullImages(keys: string[]): Promise<{ [key: string]: ImageEnt }> {
        return Promise.resolve(<PromiseLike<JSONEnvelope<ImageByKey<FalcorImageEnt>>>>this._model
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
                (value: JSONEnvelope<ImageByKey<FalcorImageEnt>>): { [key: string]: FalcorImageEnt } => {
                    if (!value) {
                        this._invalidateGet(this._pathImageByKey, keys);
                        throw new Error(`Images (${keys.join(", ")}) could not be found.`);
                    }

                    return this._populateProperties(value.json.imageByKey);
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
    public getMesh(url: string, abort?: Promise<void>): Promise<MeshEnt> {
        return BufferFetcher.getArrayBuffer(url, abort)
            .then(
                (buffer: ArrayBuffer): MeshEnt => {
                    return PbfMeshReader.read(buffer);
                },
                (reason: Error): MeshEnt => {
                    throw reason;
                });
    }

    /**
     * @inheritdoc
     */
    public getSequences(sequenceKeys: string[]):
        Promise<{ [sequenceKey: string]: SequenceEnt }> {
        return Promise.resolve(<PromiseLike<JSONEnvelope<SequenceByKey<SequenceEnt>>>>this._model
            .get([
                this._pathSequenceByKey,
                sequenceKeys,
                this._propertiesKey
                    .concat(this._propertiesSequence)]))
            .then(
                (value: JSONEnvelope<SequenceByKey<SequenceEnt>>): { [sequenceKey: string]: SequenceEnt } => {
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

    private _populateProperties<T extends FalcorSpatialImageEnt>(ibk: { [key: string]: T }): { [key: string]: T } {
        for (let key in ibk) {
            if (!ibk.hasOwnProperty(key)) {
                continue;
            }

            const image: T = ibk[key];
            image.camera_type = image.camera_projection_type;
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
