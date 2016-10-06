/// <reference path="../../typings/index.d.ts" />

import * as falcor from "falcor";
import * as HttpDataSource from "falcor-http-datasource";

import {Observable} from "rxjs/Observable";

import "rxjs/add/observable/defer";
import "rxjs/add/observable/fromPromise";

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

export class APIv3 {
    private _clientId: string;
    private _model: falcor.Model;
    private _modelMagic: falcor.Model;

    private _coreProperties: string[] = [
        "ca",
        "cca",
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
        "calt",
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

    constructor (clientId: string) {
        this._clientId = clientId;

        this._model =
            new falcor.Model({
                source: new HttpDataSource(Urls.falcorModel(clientId), {
                    crossDomain: true,
                    withCredentials: false,
                }),
            });

        this._modelMagic =
            new falcor.Model({
                source: new HttpDataSource(Urls.falcorModelMagic(clientId), {
                    crossDomain: true,
                    withCredentials: false,
                }),
            });
    };

    public imageByKeyFill(keys: string[]): Observable<{ [key: string]: IFillNode }> {
        return this._wrapPromise<IFalcorResult<IImageByKey<IFillNode>>>(this._modelMagic.get([
                "imageByKey",
                keys,
                this._keyProperties.concat(this._fillProperties).concat(this._spatialProperties),
                this._keyProperties.concat(this._userProperties)]))
            .map<{ [key: string]: IFillNode }>(
                (value: IFalcorResult<IImageByKey<IFillNode>>): { [key: string]: IFillNode } => {
                    return value.json.imageByKey;
                });
    }

    public imageByKeyFull(keys: string[]): Observable<{ [key: string]: IFullNode }> {
        return this._wrapPromise<IFalcorResult<IImageByKey<IFullNode>>>(this._modelMagic.get([
                "imageByKey",
                keys,
                this._keyProperties.concat(this._coreProperties).concat(this._fillProperties).concat(this._spatialProperties),
                this._keyProperties.concat(this._userProperties)]))
            .map<{ [key: string]: IFullNode }>(
                (value: IFalcorResult<IImageByKey<IFullNode>>): { [key: string]: IFullNode } => {
                    return value.json.imageByKey;
                });
    }

    public imageCloseTo(lat: number, lon: number): Observable<IFullNode> {
        let latLon: string = `${lon}:${lat}`;
        return this._wrapPromise<IFalcorResult<IImageCloseTo<IFullNode>>>(this._modelMagic.get([
                "imageCloseTo",
                latLon,
                this._keyProperties.concat(this._coreProperties).concat(this._fillProperties).concat(this._spatialProperties),
                this._keyProperties.concat(this._userProperties)]))
            .map<IFullNode>(
                (value: IFalcorResult<IImageCloseTo<IFullNode>>): IFullNode => {
                    return value != null ? value.json.imageCloseTo[latLon] : null;
                });
    }

    public imagesByH(hs: string[]): Observable<{ [key: string]: { [index: string]: ICoreNode } }> {
        return this._wrapPromise<IFalcorResult<IImagesByH<ICoreNode>>>(this._modelMagic.get([
                "imagesByH",
                hs,
                { from: 0, to: 1000 },
                this._keyProperties.concat(this._coreProperties),
                this._keyProperties]))
            .map<{ [key: string]: { [index: string]: ICoreNode } }>(
                (value: IFalcorResult<IImagesByH<ICoreNode>>): { [key: string]: { [index: string]: ICoreNode } } => {
                    return value.json.imagesByH;
                });
    }

    public sequenceByKey(sKeys: string[]): Observable<{ [key: string]: ISequence }> {
        return this._wrapPromise<IFalcorResult<ISequenceByKey<ISequence>>>(this._modelMagic.get([
                "sequenceByKey",
                sKeys,
                this._keyProperties.concat(this._sequenceProperties)]))
            .map<{ [key: string]: ISequence }>(
                (value: IFalcorResult<ISequenceByKey<ISequence>>): { [key: string]: ISequence } => {
                    return value.json.sequenceByKey;
                });
    }

    public get model(): falcor.Model {
        return this._model;
    }

    public get modelMagic(): falcor.Model {
        return this._modelMagic;
    }

    public get clientId(): string {
        return this._clientId;
    }

    private _wrapPromise<T>(promise: Promise<T>): Observable<T> {
        return Observable.defer(() => Observable.fromPromise(promise));
    }
}

export default APIv3;
