/// <reference path="../../typings/index.d.ts" />

import * as falcor from "falcor";
import * as HttpDataSource from "falcor-http-datasource";

import {Urls} from "../Utils";

export class APIv3 {
    private _clientId: string;
    private _model: falcor.Model;
    private _modelMagic: falcor.Model;

     private _spatialProperties: string[] = [
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

    private _coreProperties: string[] = [
        "ca",
        "cca",
        "cl",
        "l",
        "key",
        "sequence",
    ];

    private _sequenceProperties: string[] = [
        "key",
        "keys",
    ];

    private _userProperties: string[] = [
        "key",
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

    public imageByKeyFill(keys: string[]): any {
        return this._modelMagic.get(["imageByKey", keys, this._spatialProperties, this._userProperties]);
    }

    public imageByKeyFull(keys: string[]): any {
        return this._modelMagic.get(["imageByKey", keys, this._spatialProperties.concat(this._coreProperties), this._userProperties]);
    }

    public sequenceByKey(sKeys: string[]): any {
        return this._modelMagic.get(["sequenceByKey", sKeys, this._sequenceProperties]);
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
}

export default APIv3;
