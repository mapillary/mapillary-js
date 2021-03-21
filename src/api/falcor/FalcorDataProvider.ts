import {
    Model,
} from "falcor";

import { DataProviderBase } from "../DataProviderBase";
import { GeometryProviderBase } from "../GeometryProviderBase";
import { GeohashGeometryProvider } from "../GeohashGeometryProvider";
import { FalcorModelCreator } from "./FalcorModelCreator";
import { MapillaryError } from "../../error/MapillaryError";

import { ClusterReconstructionContract } from "../contracts/ClusterReconstructionContract";
import { MeshContract } from "../contracts/MeshContract";
import { CoreImagesContract } from "../contracts/CoreImagesContract";
import { SpatialImagesContract } from "../contracts/SpatialImagesContract";
import { SequencesContract } from "../contracts/SequencesContract";
import { ImagesContract } from "../contracts/ImagesContract";
import { CoreImageEnt } from "../ents/CoreImageEnt";
import {
    decompress,
    fetchArrayBuffer,
    readMeshPbf,
} from "../Common";

import { FalcorDataProviderOptions } from "./FalcorDataProviderOptions";
import { FalcorDataProviderUrls } from "./FalcorDataProviderUrls";
import { FalcorConverter } from "./FalcorConverter";
import {
    FalcorClusterReconstructionContract,
    FalcorImageByKeyContract,
    FalcorImagesByHContract,
    FalcorSequenceByKeyContract,
    FalcorSpatialImageByKeyContract,
} from "./FalcorContracts";

type APIPath =
    "imageByKey" |
    "imagesByH" |
    "sequenceByKey";

/**
 * @class FalcorDataProvider
 *
 * @classdesc Provides data through Falcor API calls.
 */
export class FalcorDataProvider extends DataProviderBase {
    private _urls: FalcorDataProviderUrls;
    private _convert: FalcorConverter;

    private _model: Model;
    private _modelCreator: FalcorModelCreator;

    private _pageCount: number;

    private _pathImageByKey: APIPath;
    private _pathImagesByH: APIPath;
    private _pathSequenceByKey: APIPath;

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
        this._convert = new FalcorConverter(this._urls);

        this._modelCreator = options.creator != null ?
            options.creator : new FalcorModelCreator();
        this._model = this._modelCreator.createModel(
            this._urls.falcorModel, options.userToken);

        this._pageCount = 999;

        this._pathImageByKey = "imageByKey";
        this._pathImagesByH = "imagesByH";
        this._pathSequenceByKey = "sequenceByKey";
    }

    /**
     * @inheritdoc
     */
    public getCoreImages(cellId: string): Promise<CoreImagesContract> {
        return Promise
            .resolve(<PromiseLike<FalcorImagesByHContract>>this._model
                .get([
                    this._pathImagesByH,
                    [cellId],
                    { from: 0, to: this._pageCount },
                    this._convert.propertiesKey
                        .concat(this._convert.propertiesCore)]))
            .then(
                (value: FalcorImagesByHContract): CoreImagesContract => {
                    if (!value) {
                        value = { json: { imagesByH: {} } };
                        for (const h of [cellId]) {
                            value.json.imagesByH[h] = {};
                            for (let i: number = 0; i <= this._pageCount; i++) {
                                value.json.imagesByH[h][i] = null;
                            }
                        }
                    }
                    const result: CoreImagesContract = {};
                    const imagesByH = value.json.imagesByH;
                    for (const cid in imagesByH) {
                        if (!imagesByH.hasOwnProperty(cid)) { continue; }
                        const cell: { [index: string]: CoreImageEnt } = {};
                        for (const index in imagesByH[cid]) {
                            if (!imagesByH[cid].hasOwnProperty(index)) {
                                continue;
                            }
                            const item = imagesByH[cid][index];
                            const core = !!item ?
                                this._convert.core(item) :
                                null;
                            cell[index] = core;
                        }
                        result[cid] = cell;
                    }
                    return result;
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
        abort?: Promise<void>): Promise<ClusterReconstructionContract> {
        return fetchArrayBuffer(url, abort)
            .then(
                (buffer: ArrayBuffer): ClusterReconstructionContract => {
                    const reconstructions =
                        <FalcorClusterReconstructionContract[]>
                        decompress(buffer);
                    if (reconstructions.length < 1) {
                        throw new MapillaryError("Cluster reconstruction is empty.");
                    }
                    const item = reconstructions[0];
                    return this._convert.clusterReconstruction(item);
                },
                (reason: Error) => { throw reason; });
    }

    /**
     * @inheritdoc
     */
    public getSpatialImages(keys: string[]): Promise<SpatialImagesContract> {
        return Promise
            .resolve(<PromiseLike<FalcorSpatialImageByKeyContract>>this._model
                .get([
                    this._pathImageByKey,
                    keys,
                    this._convert.propertiesKey
                        .concat(this._convert.propertiesSpatial),
                    this._convert.propertiesKey
                        .concat(this._convert.propertiesUser)]))
            .then(
                (value: FalcorSpatialImageByKeyContract): SpatialImagesContract => {
                    if (!value) {
                        this._invalidateGet(this._pathImageByKey, keys);
                        throw new Error(
                            `Images (${keys.join(", ")}) ` +
                            `could not be found.`);
                    }
                    const result: SpatialImagesContract = [];
                    const imageByKey = value.json.imageByKey;
                    for (const key in imageByKey) {
                        if (!imageByKey.hasOwnProperty(key)) { continue; }
                        const item = imageByKey[key];
                        const spatial = this._convert.spatial(item);
                        result.push({ node: spatial, node_id: spatial.id });
                    }
                    return result;
                },
                (error: Error) => {
                    this._invalidateGet(this._pathImageByKey, keys);
                    throw error;
                });
    }

    /**
     * @inheritdoc
     */
    public getImages(keys: string[]): Promise<ImagesContract> {
        return Promise
            .resolve(<PromiseLike<FalcorImageByKeyContract>>this._model
                .get([
                    this._pathImageByKey,
                    keys,
                    this._convert.propertiesKey
                        .concat(this._convert.propertiesCore)
                        .concat(this._convert.propertiesSpatial),
                    this._convert.propertiesKey
                        .concat(this._convert.propertiesUser)]))
            .then(
                (value: FalcorImageByKeyContract): ImagesContract => {
                    if (!value) {
                        this._invalidateGet(this._pathImageByKey, keys);
                        throw new Error(`Images (${keys.join(", ")}) could not be found.`);
                    }

                    const result: ImagesContract = {};
                    const imageByKey = value.json.imageByKey;
                    for (const key in imageByKey) {
                        if (!imageByKey.hasOwnProperty(key)) { continue; }
                        const item = imageByKey[key];
                        const core = this._convert.core(item);
                        const spatial = this._convert.spatial(item);
                        result[key] = Object.assign({}, core, spatial);
                    }
                    return result;
                },
                (error: Error) => {
                    this._invalidateGet(this._pathImageByKey, keys);
                    throw error;
                });
    }

    /**
     * @inheritdoc
     */
    public getImageBuffer(url: string, abort?: Promise<void>): Promise<ArrayBuffer> {
        return fetchArrayBuffer(url, abort);
    }

    /**
     * @inheritdoc
     */
    public getImageTileBuffer(
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
        return fetchArrayBuffer(
            this._urls.imageTile(imageKey, coords, size),
            abort);
    }

    /**
     * @inheritdoc
     */
    public getMesh(url: string, abort?: Promise<void>): Promise<MeshContract> {
        return fetchArrayBuffer(url, abort)
            .then(
                (buffer: ArrayBuffer): MeshContract => {
                    return readMeshPbf(buffer);
                },
                (reason: Error) => { throw reason; });
    }

    /**
     * @inheritdoc
     */
    public getSequences(sequenceIds: string[]): Promise<SequencesContract> {
        return Promise
            .resolve(<PromiseLike<FalcorSequenceByKeyContract>>this._model
                .get([
                    this._pathSequenceByKey,
                    sequenceIds,
                    this._convert.propertiesKey
                        .concat(this._convert.propertiesSequence)]))
            .then(
                (value: FalcorSequenceByKeyContract): SequencesContract => {
                    if (!value) { value = { json: { sequenceByKey: {} } }; }
                    const result: SequencesContract = [];
                    for (const sequenceId of sequenceIds) {
                        const exists = sequenceId in value.json.sequenceByKey;
                        if (!exists) {
                            console
                                .warn(`Sequence data missing (${sequenceId})`);
                        }
                        const sequence = exists ?
                            this._convert.sequence(
                                value.json.sequenceByKey[sequenceId]) :
                            this._convert.sequence(
                                { key: sequenceId, keys: [] });
                        result.push({ node: sequence, node_id: sequenceId });
                    }
                    return result;
                },
                (error: Error) => {
                    this._invalidateGet(this._pathSequenceByKey, sequenceIds);
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
}
