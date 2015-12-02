/// <reference path="../../typings/rest/rest.d.ts" />
/// <reference path="../../typings/when/when.d.ts" />

import * as rest from "rest";
import * as mime from "rest/interceptor/mime";

import * as when from "when";

export class APIv2Call {
    private clientId: string;
    private httpsUrl: string;
    private client: rest.Client;

    constructor (clientId: string) {
        this.clientId = clientId;
        this.httpsUrl = "https://a.mapillary.com/v2/";
        this.client = rest.wrap(mime);
    };

    public callApi(path: string): when.Promise<{}> {
        return this.client(this.httpsUrl + path + "?client_id=" + this.clientId).entity();
    }
};

export default APIv2Call
