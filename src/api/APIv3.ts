/// <reference path="../../typings/index.d.ts" />

import * as falcor from "falcor";
import * as HttpDataSource from "falcor-http-datasource";

import {Observable} from "rxjs/Observable";

import "rxjs/add/observable/defer";
import "rxjs/add/observable/fromPromise";

import "rxjs/add/operator/map";

import {IFillNode, IFullNode, ISequence} from "../API";
import {Urls} from "../Utils";

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
        "atomic_scale",
        "calt",
        "captured_at",
        "cfocal",
        "gpano",
        "height",
        "merge_cc",
        "merge_version",
        "c_rotation",
        "orientation",
        "user",
        "width",
    ];

    private _keyProperties: string[] = [
        "key",
    ];

    private _sequenceProperties: string[] = [
        "keys",
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
        return this._wrapPromise(this._modelMagic.get([
                "imageByKey",
                keys,
                this._keyProperties.concat(this._fillProperties),
                this._keyProperties.concat(this._userProperties)]))
            .map<{ [key: string]: IFillNode }>(
                (value: any): { [key: string]: IFillNode } => {
                    return value.json.imageByKey;
                });
    }

    public imageByKeyFull(keys: string[]): Observable<{ [key: string]: IFullNode }> {
        return this._wrapPromise(this._modelMagic.get([
                "imageByKey",
                keys,
                this._keyProperties.concat(this._coreProperties).concat(this._fillProperties),
                this._keyProperties.concat(this._userProperties)]))
            .map<{ [key: string]: IFullNode }>(
                (value: any): { [key: string]: IFullNode } => {
                    return value.json.imageByKey;
                });
    }

    public sequenceByKey(sKeys: string[]): Observable<{ [key: string]: ISequence }> {
        return this._wrapPromise(this._modelMagic.get([
                "sequenceByKey",
                sKeys,
                this._keyProperties.concat(this._sequenceProperties)]))
            .map<{ [key: string]: ISequence }>(
                (value: any): { [key: string]: ISequence } => {
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
