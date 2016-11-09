/// <reference path="../../typings/index.d.ts" />

import * as falcor from "falcor";
import * as HttpDataSource from "falcor-http-datasource";

import {Urls} from "../Utils";

type HttpDataSourceConfiguration = {
    crossDomain: boolean;
    withCredentials: boolean;
    headers?: { [key: string]: string } ;
}

export class ModelCreator {
    public createModel(clientId: string, token?: string): falcor.Model {
        const configuration: HttpDataSourceConfiguration = {
            crossDomain: true,
            withCredentials: false,
        };

        if (token != null) {
            configuration.headers = { "Authorization": `Bearer ${token}` };
        }

        return new falcor.Model({
            source: new HttpDataSource(Urls.falcorModel(clientId), configuration),
        });
    }
}

export default ModelCreator;
