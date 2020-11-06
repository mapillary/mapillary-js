import * as falcor from "falcor";
import XmlHttpSource from "falcor-http-datasource";

type HttpDataSourceConfiguration = {
    crossDomain: boolean;
    withCredentials: boolean;
    headers?: { [key: string]: string };
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
     * header will be added if user bearer token is supplied.
     *
     * @param {number} url - Json graph URL for API requests.
     * @param {number} [userToken] - Optional user bearer token for API requests of
     * protected resources.
     * @returns {falcor.Model} Falcor model for HTTP requests.
     */
    public createModel(url: string, userToken?: string): falcor.Model {
        const configuration: HttpDataSourceConfiguration = {
            crossDomain: true,
            withCredentials: false,
        };

        if (userToken != null) {
            configuration.headers = { "Authorization": `Bearer ${userToken}` };
        }

        return new falcor.Model({
            maxSize: 16 * 1024 * 1024,
            source: new XmlHttpSource(url, configuration),
        });
    }
}

export default ModelCreator;
