import * as falcor from "falcor";

import {
    ICoreNode,
    IDataProvider,
    IFillNode,
    IFullNode,
    ISequence,
    ModelCreator,
} from "../API";

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
                      for (let h of geohashes) {
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
                (value: falcor.JSONEnvelope<IImageByKey<IFillNode>>):
                    { [key: string]: IFillNode } => {
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
                (value: falcor.JSONEnvelope<IImageByKey<IFullNode>>):
                    { [key: string]: IFullNode } => {
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

    public setToken(token?: string): void {
        this._model.invalidate([]);
        this._model = null;
        this._model = this._modelCreator.createModel(this._clientId, token);
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

    private _invalidateGet(path: APIPath, paths: string[]): void {
        this._model.invalidate([path, paths]);
    }
}

export default DataProvider;
