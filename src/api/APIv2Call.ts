/// <reference path="../../typings/browser.d.ts" />

import * as rest from "rest";
import * as mime from "rest/interceptor/mime";

import * as when from "when";

export class APIv2Call {
    private _clientId: string;
    private _httpsUrl: string;
    private _client: rest.Client;

    constructor (clientId: string) {
        this._clientId = clientId;
        this._httpsUrl = "https://a.mapillary.com/v2/";
        this._client = rest.wrap(mime);
    };

    public callApi(path: string): when.Promise<{}> {
        let uri: string = this._httpsUrl + path;

        if (path.indexOf("?") > -1) {
            uri += "&client_id=" + this._clientId;
        } else {
            uri += "?client_id=" + this._clientId;
        }

        return this._client(uri).entity();
    }
};

export default APIv2Call
