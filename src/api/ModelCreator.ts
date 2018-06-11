import * as falcor from "falcor";
import XmlHttpSource from "falcor-http-datasource";

import {Urls} from "../Utils";

type HttpDataSourceConfiguration = {
    crossDomain: boolean;
    withCredentials: boolean;
    headers?: { [key: string]: string } ;
};

/**
 * @class ModelCreator
 *
 * @classdesc Creates API models.
 */
export class ModelCreator {
    /**
     * Creates a Falcor model.
     *
     * @description Max cache size will be set to 16 MB. Authorization
     * header will be added if bearer token is supplied.
     *
     * @param {number} clientId - Client id for API requests.
     * @param {number} [token] - Optional bearer token for API requests of
     * protected resources.
     * @returns {falcor.Model} Falcor model for HTTP requests.
     */
    public createModel(clientId: string, token?: string): falcor.Model {
        const configuration: HttpDataSourceConfiguration = {
            crossDomain: true,
            withCredentials: false,
        };

        if (token != null) {
            configuration.headers = { "Authorization": `Bearer ${token}` };
        }

        return new falcor.Model({
            maxSize: 16 * 1024 * 1024,
            source: new XmlHttpSource(Urls.falcorModel(clientId), configuration),
        });
    }
}

export default ModelCreator;
