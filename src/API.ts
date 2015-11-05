///<reference path="../typings/rest/rest.d.ts" />

import * as rest from "rest";

export class API {
    private clientId: string;

    /**
     * Initializes an endpoint to the Mapillary API
     * @class Mapillary.API
     * @classdesc An endpoint for the Mapillary API
     * @param {string} clientId for Mapillary API
     */
    constructor (clientId: string) {
        this.clientId = clientId;
    };


    /**
     * FIXME
     * @method Mapillary.API#v2NavIm
     * @param {string} key FIXME
     */
    public v2NavIm(key: string): any {
        return rest("");
    };
};

export default API;
