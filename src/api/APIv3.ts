import {catchError, map} from "rxjs/operators";
import * as falcor from "falcor";

import {Observable, Subscriber} from "rxjs";

import {
    ICoreNode,
    IFillNode,
    IFullNode,
    ISequence,
    ModelCreator,
} from "../API";

interface IImageByKey<T> {
    imageByKey: { [key: string]: T };
}

interface IImageCloseTo<T> {
    imageCloseTo: { [key: string]: T };
}

interface IImagesByH<T> {
    imagesByH: { [key: string]: { [index: string]: T } };
}

interface ISequenceByKey<T> {
    sequenceByKey: { [sequenceKey: string]: T };
}

type APIPath =
    "imageByKey" |
    "imageCloseTo" |
    "imagesByH" |
    "imageViewAdd" |
    "sequenceByKey" |
    "sequenceViewAdd";

/**
 * @class APIv3
 *
 * @classdesc Provides methods for access of API v3.
 */
export class APIv3 {
    private _clientId: string;

    private _model: falcor.Model;
    private _modelCreator: ModelCreator;

    private _pageCount: number;

    private _pathImageByKey: APIPath;
    private _pathImageCloseTo: APIPath;
    private _pathImagesByH: APIPath;
    private _pathImageViewAdd: APIPath;
    private _pathSequenceByKey: APIPath;
    private _pathSequenceViewAdd: APIPath;

    private _propertiesCore: string[];
    private _propertiesFill: string[];
    private _propertiesKey: string[];
    private _propertiesSequence: string[];
    private _propertiesSpatial: string[];
    private _propertiesUser: string[];

    /**
     * Create a new api v3 instance.
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
        this._pathImageCloseTo = "imageCloseTo";
        this._pathImagesByH = "imagesByH";
        this._pathImageViewAdd = "imageViewAdd";
        this._pathSequenceByKey = "sequenceByKey";
        this._pathSequenceViewAdd = "sequenceViewAdd";

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

    public imageByKeyFill$(keys: string[]): Observable<{ [key: string]: IFillNode }> {
        return this._catchInvalidateGet$(
            this._wrapModelResponse$<falcor.JSONEnvelope<IImageByKey<IFillNode>>>(this._model.get([
                this._pathImageByKey,
                keys,
                this._propertiesKey
                    .concat(this._propertiesFill)
                    .concat(this._propertiesSpatial),
                this._propertiesKey
                    .concat(this._propertiesUser)])).pipe(
            map(
                (value: falcor.JSONEnvelope<IImageByKey<IFillNode>>): { [key: string]: IFillNode } => {
                    if (!value) {
                        throw new Error(`Images (${keys.join(", ")}) could not be found.`);
                    }

                    return value.json.imageByKey;
                })),
            this._pathImageByKey,
            keys);
    }

    public imageByKeyFull$(keys: string[]): Observable<{ [key: string]: IFullNode }> {
        return this._catchInvalidateGet$(
            this._wrapModelResponse$<falcor.JSONEnvelope<IImageByKey<IFullNode>>>(this._model.get([
                this._pathImageByKey,
                keys,
                this._propertiesKey
                    .concat(this._propertiesCore)
                    .concat(this._propertiesFill)
                    .concat(this._propertiesSpatial),
                this._propertiesKey
                    .concat(this._propertiesUser)])).pipe(
            map(
                (value: falcor.JSONEnvelope<IImageByKey<IFullNode>>): { [key: string]: IFullNode } => {
                    if (!value) {
                        throw new Error(`Images (${keys.join(", ")}) could not be found.`);
                    }

                    return value.json.imageByKey;
                })),
            this._pathImageByKey,
            keys);
    }

    public imageCloseTo$(lat: number, lon: number): Observable<IFullNode> {
        let lonLat: string = `${lon}:${lat}`;
        return this._catchInvalidateGet$(
            this._wrapModelResponse$<falcor.JSONEnvelope<IImageCloseTo<IFullNode>>>(this._model.get([
                this._pathImageCloseTo,
                [lonLat],
                this._propertiesKey
                    .concat(this._propertiesCore)
                    .concat(this._propertiesFill)
                    .concat(this._propertiesSpatial),
                this._propertiesKey
                    .concat(this._propertiesUser)])).pipe(
            map(
                (value: falcor.JSONEnvelope<IImageCloseTo<IFullNode>>): IFullNode => {
                    return value != null ? value.json.imageCloseTo[lonLat] : null;
                })),
            this._pathImageCloseTo,
            [lonLat]);
    }

    public imagesByH$(hs: string[]): Observable<{ [h: string]: { [index: string]: ICoreNode } }> {
        return this._catchInvalidateGet$(
            this._wrapModelResponse$<falcor.JSONEnvelope<IImagesByH<ICoreNode>>>(this._model.get([
                this._pathImagesByH,
                hs,
                { from: 0, to: this._pageCount },
                this._propertiesKey
                    .concat(this._propertiesCore)])).pipe(
            map(
                (value: falcor.JSONEnvelope<IImagesByH<ICoreNode>>): { [h: string]: { [index: string]: ICoreNode } } => {
                    if (!value) {
                        value = { json: { imagesByH: {} } };
                        for (let h of hs) {
                            value.json.imagesByH[h] = {};
                            for (let i: number = 0; i <= this._pageCount; i++) {
                                value.json.imagesByH[h][i] = null;
                            }
                        }
                    }

                    return value.json.imagesByH;
                })),
            this._pathImagesByH,
            hs);
    }

    public imageViewAdd$(keys: string[]): Observable<void> {
        return this._catchInvalidateCall$(
            this._wrapCallModelResponse$(
                this._model.call(
                    [this._pathImageViewAdd],
                    [keys])),
            this._pathImageViewAdd,
            keys);
    }

    public invalidateImageByKey(keys: string[]): void {
        this._invalidateGet(this._pathImageByKey, keys);
    }

    public invalidateImagesByH(hs: string[]): void {
        this._invalidateGet(this._pathImagesByH, hs);
    }

    public invalidateSequenceByKey(sKeys: string[]): void {
        this._invalidateGet(this._pathSequenceByKey, sKeys);
    }

    public setToken(token?: string): void {
        this._model.invalidate([]);
        this._model = null;
        this._model = this._modelCreator.createModel(this._clientId, token);
    }

    public sequenceByKey$(sequenceKeys: string[]): Observable<{ [sequenceKey: string]: ISequence }> {
        return this._catchInvalidateGet$(
            this._wrapModelResponse$<falcor.JSONEnvelope<ISequenceByKey<ISequence>>>(this._model.get([
                this._pathSequenceByKey,
                sequenceKeys,
                this._propertiesKey
                    .concat(this._propertiesSequence)])).pipe(
            map(
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
                })),
            this._pathSequenceByKey,
            sequenceKeys);
    }

    public sequenceViewAdd$(sequenceKeys: string[]): Observable<void> {
        return this._catchInvalidateCall$(
            this._wrapCallModelResponse$(
                this._model.call(
                    [this._pathSequenceViewAdd],
                    [sequenceKeys])),
            this._pathSequenceViewAdd,
            sequenceKeys);
    }

    private _catchInvalidateGet$<TResult>(observable: Observable<TResult>, path: APIPath, paths: string[]): Observable<TResult> {
        return observable.pipe(
            catchError(
                (error: Error): Observable<TResult> => {
                    this._invalidateGet(path, paths);

                    throw error;
                }));
    }

    private _catchInvalidateCall$<TResult>(observable: Observable<TResult>, path: APIPath, paths: string[]): Observable<TResult> {
        return observable.pipe(
            catchError(
                (error: Error): Observable<TResult> => {
                    this._invalidateCall(path, paths);

                    throw error;
                }));
    }

    private _invalidateGet(path: APIPath, paths: string[]): void {
        this._model.invalidate([path, paths]);
    }

    private _invalidateCall(path: APIPath, paths: string[]): void {
        this._model.invalidate([path], [paths]);
    }

    private _wrapModelResponse$<T>(modelResponse: falcor.ModelResponse<T>): Observable<T> {
        return Observable
            .create(
                (subscriber: Subscriber<T>): void => {
                    modelResponse
                        .then(
                            (value: T): void => {
                                subscriber.next(value);
                                subscriber.complete();
                            },
                            (error: Error): void => {
                                subscriber.error(error);
                            });
                });
    }

    private _wrapCallModelResponse$<T>(modelResponse: falcor.ModelResponse<falcor.JSONEnvelope<T>>): Observable<T> {
        return this._wrapModelResponse$(modelResponse).pipe(
            map<falcor.JSONEnvelope<T>, T>(
                (value: falcor.JSONEnvelope<T>): T => {
                    return;
                }));
    }
}

export default APIv3;
