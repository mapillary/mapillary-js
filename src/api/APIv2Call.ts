/// <reference path="../../typings/rest/rest.d.ts" />
/// <reference path="../../typings/when/when.d.ts" />

import * as rest from "rest";
import * as mime from "rest/interceptor/mime";

import * as when from "when";

export class APIv2Call {
    public static vcr: any = {};

    private clientId: string;
    private httpsUrl: string;
    private client: rest.Client;

    constructor (clientId: string) {
        this.clientId = clientId;
        this.httpsUrl = "https://a.mapillary.com/v2/";
        this.client = rest.wrap(mime);
    };

    public callApi(path: string): when.Promise<{}> {
        let uri: string = this.httpsUrl + path;

        if (path.indexOf("?") > -1) {
            uri += "&client_id=" + this.clientId;
        } else {
            uri += "?client_id=" + this.clientId;
        }

        return this.client(uri).entity();
    }
};

export default APIv2Call
