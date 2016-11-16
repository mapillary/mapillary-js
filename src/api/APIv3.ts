/// <reference path="../../typings/index.d.ts" />

import * as falcor from "falcor";

import {Observable} from "rxjs/Observable";

import "rxjs/add/observable/defer";
import "rxjs/add/observable/fromPromise";

import "rxjs/add/operator/catch";
import "rxjs/add/operator/map";

import {
    ICoreNode,
    IFillNode,
    IFullNode,
    ISequence,
    ModelCreator,
} from "../API";

interface IFalcorResult<T> {
    json: T;
}

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
            "sequence",
        ];

        this._propertiesFill = [
            "captured_at",
            "user",
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
            "ca",
            "calt",
            "cca",
            "cfocal",
            "gpano",
            "height",
            "merge_cc",
            "merge_version",
            "c_rotation",
            "orientation",
            "width",
        ];

        this._propertiesUser = [
            "username",
        ];
    };

    public imageByKeyFill$(keys: string[]): Observable<{ [key: string]: IFillNode }> {
        return this._catchInvalidateGet$(
            this._wrapPromise$<IFalcorResult<IImageByKey<IFillNode>>>(this._model.get([
                this._pathImageByKey,
                keys,
                this._propertiesKey
                    .concat(this._propertiesFill)
                    .concat(this._propertiesSpatial),
                this._propertiesKey
                    .concat(this._propertiesUser)]))
            .map<{ [key: string]: IFillNode }>(
                (value: IFalcorResult<IImageByKey<IFillNode>>): { [key: string]: IFillNode } => {
                    return value.json.imageByKey;
                }),
            this._pathImageByKey,
            keys);
    }

    public imageByKeyFull$(keys: string[]): Observable<{ [key: string]: IFullNode }> {
        return this._catchInvalidateGet$(
            this._wrapPromise$<IFalcorResult<IImageByKey<IFullNode>>>(this._model.get([
                this._pathImageByKey,
                keys,
                this._propertiesKey
                    .concat(this._propertiesCore)
                    .concat(this._propertiesFill)
                    .concat(this._propertiesSpatial),
                this._propertiesKey
                    .concat(this._propertiesUser)]))
            .map<{ [key: string]: IFullNode }>(
                (value: IFalcorResult<IImageByKey<IFullNode>>): { [key: string]: IFullNode } => {
                    return value.json.imageByKey;
                }),
            this._pathImageByKey,
            keys);
    }

    public imageCloseTo$(lat: number, lon: number): Observable<IFullNode> {
        let lonLat: string = `${lon}:${lat}`;
        return this._catchInvalidateGet$(
            this._wrapPromise$<IFalcorResult<IImageCloseTo<IFullNode>>>(this._model.get([
                this._pathImageCloseTo,
                [lonLat],
                this._propertiesKey
                    .concat(this._propertiesCore)
                    .concat(this._propertiesFill)
                    .concat(this._propertiesSpatial),
                this._propertiesKey
                    .concat(this._propertiesUser)]))
            .map<IFullNode>(
                (value: IFalcorResult<IImageCloseTo<IFullNode>>): IFullNode => {
                    return value != null ? value.json.imageCloseTo[lonLat] : null;
                }),
            this._pathImageCloseTo,
            [lonLat]);
    }

    public imagesByH$(hs: string[]): Observable<{ [h: string]: { [index: string]: ICoreNode } }> {
        return this._catchInvalidateGet$(
            this._wrapPromise$<IFalcorResult<IImagesByH<ICoreNode>>>(this._model.get([
                this._pathImagesByH,
                hs,
                { from: 0, to: this._pageCount },
                this._propertiesKey
                    .concat(this._propertiesCore),
                this._propertiesKey]))
            .map<{ [h: string]: { [index: string]: ICoreNode } }>(
                (value: IFalcorResult<IImagesByH<ICoreNode>>): { [h: string]: { [index: string]: ICoreNode } } => {
                    if (value == null) {
                        value = { json: { imagesByH: {} } };
                        for (let h of hs) {
                            value.json.imagesByH[h] = {};
                            for (let i: number = 0; i <= this._pageCount; i++) {
                                value.json.imagesByH[h][i] = null;
                            }
                        }
                    }

                    return value.json.imagesByH;
                }),
            this._pathImagesByH,
            hs);
    }

    public imageViewAdd$(keys: string[]): Observable<void> {
        return this._catchInvalidateCall$(
            this._wrapPromise$<void>(
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
            this._wrapPromise$<IFalcorResult<ISequenceByKey<ISequence>>>(this._model.get([
                this._pathSequenceByKey,
                sequenceKeys,
                this._propertiesKey
                    .concat(this._propertiesSequence)]))
            .map<{ [sequenceKey: string]: ISequence }>(
                (value: IFalcorResult<ISequenceByKey<ISequence>>): { [sequenceKey: string]: ISequence } => {
                    return value.json.sequenceByKey;
                }),
            this._pathSequenceByKey,
            sequenceKeys);
    }

    public sequenceViewAdd$(sequenceKeys: string[]): Observable<void> {
        return this._catchInvalidateCall$(
            this._wrapPromise$<void>(
                this._model.call(
                    [this._pathSequenceViewAdd],
                    [sequenceKeys])),
            this._pathSequenceViewAdd,
            sequenceKeys);
    }

    public get clientId(): string {
        return this._clientId;
    }

    private _catchInvalidateGet$<TResult>(observable: Observable<TResult>, path: APIPath, paths: string[]): Observable<TResult> {
        return observable
            .catch(
                (error: Error): Observable<TResult> => {
                    this._invalidateGet(path, paths);

                    throw error;
                });
    }

    private _catchInvalidateCall$<TResult>(observable: Observable<TResult>, path: APIPath, paths: string[]): Observable<TResult> {
        return observable
            .catch(
                (error: Error): Observable<TResult> => {
                    this._invalidateCall(path, paths);

                    throw error;
                });
    }

    private _invalidateGet(path: APIPath, paths: string[]): void {
        this._model.invalidate([path, paths]);
    }

    private _invalidateCall(path: APIPath, paths: string[]): void {
        this._model.invalidate([path], [paths]);
    }

    private _wrapPromise$<T>(promise: Promise<T>): Observable<T> {
        return Observable.defer(() => Observable.fromPromise(promise));
    }
}

export default APIv3;
