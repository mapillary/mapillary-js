/// <reference path="../../typings/index.d.ts" />

import * as falcor from "falcor";
import * as HttpDataSource from "falcor-http-datasource";

import {Observable} from "rxjs/Observable";

import "rxjs/add/observable/defer";
import "rxjs/add/observable/fromPromise";

import "rxjs/add/operator/catch";
import "rxjs/add/operator/map";

import {ICoreNode, IFillNode, IFullNode, ISequence} from "../API";
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
    sequenceByKey: { [key: string]: T };
}

type APIPath =
    "imageByKey" |
    "imageCloseTo" |
    "imagesByH" |
    "sequenceByKey";

export class APIv3 {
    private _clientId: string;
    private _model: falcor.Model;

    private _imageByKeyPath: APIPath = "imageByKey";
    private _imageCloseToPath: APIPath = "imageCloseTo";
    private _imagesByHPath: APIPath = "imagesByH";
    private _pageCount: number = 999;
    private _sequenceByKeyPath: APIPath = "sequenceByKey";

    private _coreProperties: string[] = [
        "cl",
        "l",
        "sequence",
    ];

    private _fillProperties: string[] = [
        "captured_at",
        "user",
    ];

    private _keyProperties: string[] = [
        "key",
    ];

    private _sequenceProperties: string[] = [
        "keys",
    ];

    private _spatialProperties: string[] = [
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

    private _userProperties: string[] = [
        "username",
    ];

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
    };

    public imageByKeyFill$(keys: string[]): Observable<{ [key: string]: IFillNode }> {
        return this._catchInvalidate$(
            this._wrapPromise$<IFalcorResult<IImageByKey<IFillNode>>>(this._model.get([
                this._imageByKeyPath,
                keys,
                this._keyProperties.concat(this._fillProperties).concat(this._spatialProperties),
                this._keyProperties.concat(this._userProperties)]))
            .map<{ [key: string]: IFillNode }>(
                (value: IFalcorResult<IImageByKey<IFillNode>>): { [key: string]: IFillNode } => {
                    return value.json.imageByKey;
                }),
            this._imageByKeyPath,
            keys);
    }

    public imageByKeyFull$(keys: string[]): Observable<{ [key: string]: IFullNode }> {
        return this._catchInvalidate$(
            this._wrapPromise$<IFalcorResult<IImageByKey<IFullNode>>>(this._model.get([
                this._imageByKeyPath,
                keys,
                this._keyProperties.concat(this._coreProperties).concat(this._fillProperties).concat(this._spatialProperties),
                this._keyProperties.concat(this._userProperties)]))
            .map<{ [key: string]: IFullNode }>(
                (value: IFalcorResult<IImageByKey<IFullNode>>): { [key: string]: IFullNode } => {
                    return value.json.imageByKey;
                }),
            this._imageByKeyPath,
            keys);
    }

    public imageCloseTo$(lat: number, lon: number): Observable<IFullNode> {
        let latLon: string = `${lon}:${lat}`;
        return this._catchInvalidate$(
            this._wrapPromise$<IFalcorResult<IImageCloseTo<IFullNode>>>(this._model.get([
                this._imageCloseToPath,
                [latLon],
                this._keyProperties.concat(this._coreProperties).concat(this._fillProperties).concat(this._spatialProperties),
                this._keyProperties.concat(this._userProperties)]))
            .map<IFullNode>(
                (value: IFalcorResult<IImageCloseTo<IFullNode>>): IFullNode => {
                    return value != null ? value.json.imageCloseTo[latLon] : null;
                }),
            this._imageCloseToPath,
            [latLon]);
    }

    public imagesByH$(hs: string[]): Observable<{ [h: string]: { [index: string]: ICoreNode } }> {
        return this._catchInvalidate$(
            this._wrapPromise$<IFalcorResult<IImagesByH<ICoreNode>>>(this._model.get([
                this._imagesByHPath,
                hs,
                { from: 0, to: this._pageCount },
                this._keyProperties.concat(this._coreProperties),
                this._keyProperties]))
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
            this._imagesByHPath,
            hs);
    }

    public invalidateImageByKey(keys: string[]): void {
        this._invalidate(this._imageByKeyPath, keys);
    }

    public invalidateImagesByH(hs: string[]): void {
        this._invalidate(this._imagesByHPath, hs);
    }

    public invalidateSequenceByKey(sKeys: string[]): void {
        this._invalidate(this._sequenceByKeyPath, sKeys);
    }

    public sequenceByKey$(sKeys: string[]): Observable<{ [key: string]: ISequence }> {
        return this._catchInvalidate$(
            this._wrapPromise$<IFalcorResult<ISequenceByKey<ISequence>>>(this._model.get([
                this._sequenceByKeyPath,
                sKeys,
                this._keyProperties.concat(this._sequenceProperties)]))
            .map<{ [key: string]: ISequence }>(
                (value: IFalcorResult<ISequenceByKey<ISequence>>): { [key: string]: ISequence } => {
                    return value.json.sequenceByKey;
                }),
            this._sequenceByKeyPath,
            sKeys);
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
