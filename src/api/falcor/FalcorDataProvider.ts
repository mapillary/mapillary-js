import {
    Model,
} from "falcor";

import { BufferFetcher } from "../BufferFetcher";
import { DataProviderBase } from "../DataProviderBase";
import { GeohashGeometryProvider } from "../GeohashGeometryProvider";
import { JsonInflator } from "../JsonInflator";
import { ModelCreator } from "./ModelCreator";
import { PbfMeshReader } from "../PbfMeshReader";
import { ClusterReconstructionEnt } from "../ents/ClusterReconstructionEnt";
import { FalcorDataProviderOptions } from "./FalcorDataProviderOptions";
import { MeshEnt } from "../ents/MeshEnt";

import { MapillaryError } from "../../error/MapillaryError";
import { GeometryProviderBase } from "../GeometryProviderBase";
import { FalcorDataProviderUrls } from "./FalcorDataProviderUrls";
import { FalcorConverter } from "./FalcorConverter";
import { FalcorClusterReconstructionEnt } from "./FalcorEnts";
import {
    ImageByKey,
    ImagesByH,
    SequenceByKey,
    SpatialImageByKey,
} from "./FalcorDataContracts";
import { CoreImagesResult } from "../interfaces/CoreImagesResult";
import { SpatialImagesResult } from "../interfaces/SpatialImagesResult";
import { SequencesResult } from "../interfaces/SequencesResult";
import { ImagesResult } from "../interfaces/ImagesResult";
import { CoreImageEnt } from "../ents/CoreImageEnt";


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
    private _modelCreator: ModelCreator;

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
            options.creator : new ModelCreator();
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
    public getCoreImages(cellId: string): Promise<CoreImagesResult> {
        return Promise
            .resolve(<PromiseLike<ImagesByH>>this._model
                .get([
                    this._pathImagesByH,
                    [cellId],
                    { from: 0, to: this._pageCount },
                    this._convert.propertiesKey
                        .concat(this._convert.propertiesCore)]))
            .then(
                (value: ImagesByH): CoreImagesResult => {
                    if (!value) {
                        value = { json: { imagesByH: {} } };
                        for (const h of [cellId]) {
                            value.json.imagesByH[h] = {};
                            for (let i: number = 0; i <= this._pageCount; i++) {
                                value.json.imagesByH[h][i] = null;
                            }
                        }
                    }
                    const result: CoreImagesResult = {};
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
        abort?: Promise<void>): Promise<ClusterReconstructionEnt> {
        return BufferFetcher
            .getArrayBuffer(url, abort)
            .then(
                (buffer: ArrayBuffer): ClusterReconstructionEnt => {
                    const reconstructions =
                        <FalcorClusterReconstructionEnt[]>
                        JsonInflator.decompress(buffer);
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
    public getFillImages(keys: string[]): Promise<SpatialImagesResult> {
        return Promise
            .resolve(<PromiseLike<SpatialImageByKey>>this._model
                .get([
                    this._pathImageByKey,
                    keys,
                    this._convert.propertiesKey
                        .concat(this._convert.propertiesSpatial),
                    this._convert.propertiesKey
                        .concat(this._convert.propertiesUser)]))
            .then(
                (value: SpatialImageByKey): SpatialImagesResult => {
                    if (!value) {
                        this._invalidateGet(this._pathImageByKey, keys);
                        throw new Error(
                            `Images (${keys.join(", ")}) ` +
                            `could not be found.`);
                    }
                    const result: SpatialImagesResult = {};
                    const imageByKey = value.json.imageByKey;
                    for (const key in imageByKey) {
                        if (!imageByKey.hasOwnProperty(key)) { continue; }
                        const item = imageByKey[key];
                        const spatial = this._convert.spatial(item);
                        result[key] = spatial;
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
    public getFullImages(keys: string[]): Promise<ImagesResult> {
        return Promise
            .resolve(<PromiseLike<ImageByKey>>this._model
                .get([
                    this._pathImageByKey,
                    keys,
                    this._convert.propertiesKey
                        .concat(this._convert.propertiesCore)
                        .concat(this._convert.propertiesSpatial),
                    this._convert.propertiesKey
                        .concat(this._convert.propertiesUser)]))
            .then(
                (value: ImageByKey): ImagesResult => {
                    if (!value) {
                        this._invalidateGet(this._pathImageByKey, keys);
                        throw new Error(`Images (${keys.join(", ")}) could not be found.`);
                    }

                    const result: ImagesResult = {};
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
        return BufferFetcher
            .getArrayBuffer(
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
                (reason: Error) => { throw reason; });
    }

    /**
     * @inheritdoc
     */
    public getSequences(sequenceKeys: string[]): Promise<SequencesResult> {
        return Promise
            .resolve(<PromiseLike<SequenceByKey>>this._model
                .get([
                    this._pathSequenceByKey,
                    sequenceKeys,
                    this._convert.propertiesKey
                        .concat(this._convert.propertiesSequence)]))
            .then(
                (value: SequenceByKey): SequencesResult => {
                    if (!value) { value = { json: { sequenceByKey: {} } }; }
                    const result: SequencesResult = {};
                    for (const sequenceKey of sequenceKeys) {
                        const exists = sequenceKey in value.json.sequenceByKey;
                        if (!exists) {
                            console
                                .warn(`Sequence data missing (${sequenceKey})`);
                        }
                        const sequence = exists ?
                            this._convert.sequence(
                                value.json.sequenceByKey[sequenceKey]) :
                            this._convert.sequence(
                                { key: sequenceKey, keys: [] });
                        result[sequenceKey] = sequence;
                    }
                    return result;
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
}