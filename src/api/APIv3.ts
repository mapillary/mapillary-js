/// <reference path="../../typings/index.d.ts" />

import * as falcor from "falcor";
import * as HttpDataSource from "falcor-http-datasource";

import {Urls} from "../Utils";

export class APIv3 {
    private _clientId: string;
    private _model: falcor.Model;
    private _modelMagic: falcor.Model;

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
            (<any> new falcor.Model({
                source: new HttpDataSource(Urls.falcorModelMagic(clientId), {
                    crossDomain: true,
                    withCredentials: false,
                }),
            })).batch(40);
    };

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
