/// <reference path="../../typings/index.d.ts" />

import * as falcor from "falcor";
import * as HttpDataSource from "falcor-http-datasource";

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
} from "../API";
import {Urls} from "../Utils";

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
    "sequenceByKey";

export class APIv3 {
    private _clientId: string;

    private _model: falcor.Model;

    private _pageCount: number;

    private _pathImageByKey: APIPath;
    private _pathImageCloseTo: APIPath;
    private _pathImagesByH: APIPath;
    private _pathSequenceByKey: APIPath;

    private _propertiesCore: string[];
    private _propertiesFill: string[];
    private _propertiesKey: string[];
    private _propertiesSequence: string[];
    private _propertiesSpatial: string[];
    private _propertiesUser: string[];

    constructor (clientId: string, model?: falcor.Model) {
        this._clientId = clientId;

        this._model = model != null ?
            model :
            new falcor.Model({
                source: new HttpDataSource(Urls.falcorModel(clientId), {
                    crossDomain: true,
                    withCredentials: false,
                }),
            });

        this._pageCount = 999;

        this._pathImageByKey = "imageByKey";
        this._pathImageCloseTo = "imageCloseTo";
        this._pathImagesByH = "imagesByH";
        this._pathSequenceByKey = "sequenceByKey";

        this._propertiesCore = [
            "cl",
            "l",
            "sequence",
        ];

        this._propertiesFill = [
            "captured_at",
            "user",
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
        return this._catchInvalidate$(
            this._wrapPromise$<IFalcorResult<IImageByKey<IFillNode>>>(this._model.get([
                this._pathImageByKey,
                keys,
                this._propertiesKey.concat(this._propertiesFill).concat(this._propertiesSpatial),
                this._propertiesKey.concat(this._propertiesUser)]))
            .map<{ [key: string]: IFillNode }>(
                (value: IFalcorResult<IImageByKey<IFillNode>>): { [key: string]: IFillNode } => {
                    return value.json.imageByKey;
                }),
            this._pathImageByKey,
            keys);
    }

    public imageByKeyFull$(keys: string[]): Observable<{ [key: string]: IFullNode }> {
        return this._catchInvalidate$(
            this._wrapPromise$<IFalcorResult<IImageByKey<IFullNode>>>(this._model.get([
                this._pathImageByKey,
                keys,
                this._propertiesKey.concat(this._propertiesCore).concat(this._propertiesFill).concat(this._propertiesSpatial),
                this._propertiesKey.concat(this._propertiesUser)]))
            .map<{ [key: string]: IFullNode }>(
                (value: IFalcorResult<IImageByKey<IFullNode>>): { [key: string]: IFullNode } => {
                    return value.json.imageByKey;
                }),
            this._pathImageByKey,
            keys);
    }

    public imageCloseTo$(lat: number, lon: number): Observable<IFullNode> {
        let lonLat: string = `${lon}:${lat}`;
        return this._catchInvalidate$(
            this._wrapPromise$<IFalcorResult<IImageCloseTo<IFullNode>>>(this._model.get([
                this._pathImageCloseTo,
                [lonLat],
                this._propertiesKey.concat(this._propertiesCore).concat(this._propertiesFill).concat(this._propertiesSpatial),
                this._propertiesKey.concat(this._propertiesUser)]))
            .map<IFullNode>(
                (value: IFalcorResult<IImageCloseTo<IFullNode>>): IFullNode => {
                    return value != null ? value.json.imageCloseTo[lonLat] : null;
                }),
            this._pathImageCloseTo,
            [lonLat]);
    }

    public imagesByH$(hs: string[]): Observable<{ [h: string]: { [index: string]: ICoreNode } }> {
        return this._catchInvalidate$(
            this._wrapPromise$<IFalcorResult<IImagesByH<ICoreNode>>>(this._model.get([
                this._pathImagesByH,
                hs,
                { from: 0, to: this._pageCount },
                this._propertiesKey.concat(this._propertiesCore),
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

    public invalidateImageByKey(keys: string[]): void {
        this._invalidate(this._pathImageByKey, keys);
    }

    public invalidateImagesByH(hs: string[]): void {
        this._invalidate(this._pathImagesByH, hs);
    }

    public invalidateSequenceByKey(sKeys: string[]): void {
        this._invalidate(this._pathSequenceByKey, sKeys);
    }

    public sequenceByKey$(sequenceKeys: string[]): Observable<{ [sequenceKey: string]: ISequence }> {
        return this._catchInvalidate$(
            this._wrapPromise$<IFalcorResult<ISequenceByKey<ISequence>>>(this._model.get([
                this._pathSequenceByKey,
                sequenceKeys,
                this._propertiesKey.concat(this._propertiesSequence)]))
            .map<{ [sequenceKey: string]: ISequence }>(
                (value: IFalcorResult<ISequenceByKey<ISequence>>): { [sequenceKey: string]: ISequence } => {
                    return value.json.sequenceByKey;
                }),
            this._pathSequenceByKey,
            sequenceKeys);
    }

    public get model(): falcor.Model {
        return this._model;
    }

    public get clientId(): string {
        return this._clientId;
    }

    private _catchInvalidate$<TResult>(observable: Observable<TResult>, path: APIPath, paths: string[]): Observable<TResult> {
        return observable
            .catch(
                (error: Error): Observable<TResult> => {
                    this._invalidate(path, paths);

                    throw error;
                });
    }

    private _invalidate(path: APIPath, paths: string[]): void {
        this._model.invalidate([path, paths]);
    }

    private _wrapPromise$<T>(promise: Promise<T>): Observable<T> {
        return Observable.defer(() => Observable.fromPromise(promise));
    }
}

export default APIv3;
