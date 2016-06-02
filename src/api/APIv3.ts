/// <reference path="../../typings/index.d.ts" />

import * as falcor from "falcor";
import * as HttpDataSource from "falcor-http-datasource";

import {Urls} from "../Utils";

export class APIv3 {
    private _clientId: string;
    private _model: falcor.Model;

    constructor (clientId: string) {
        this._clientId = clientId;

        this._model =
            new falcor.Model({
                source: new HttpDataSource(Urls.falcorModel(clientId), {
                    crossDomain: true,
                    withCredentials: false,
                }),
            });
    };

    public get model(): falcor.Model {
        return this._model;
    }

    public get clientId(): string {
        return this._clientId;
    }
}

export default APIv3;
