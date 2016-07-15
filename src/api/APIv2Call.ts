/// <reference path="../../typings/index.d.ts" />

import * as rest from "rest";
import * as mime from "rest/interceptor/mime";
import * as oAuth from "rest/interceptor/oAuth";

import * as when from "when";

export class APIv2Call {
    private _clientId: string;
    private _projectKey: string;

    private _httpsUrl: string;
    private _client: rest.Client;

    constructor (clientId: string) {
        this._clientId = clientId;
        this._projectKey = null;

        this._httpsUrl = "https://a.mapillary.com/v2/";
        this._client = this._createClient();
    };

    public auth(token?: string, projectKey?: string): void {
        this._client = this._createClient(token);
        this._projectKey = projectKey;
    }

    public callApi(path: string): when.Promise<{}> {
        let uri: string = this._httpsUrl + path;

        let projectParam: string = !!this._projectKey ?
            "&project=" + this._projectKey :
            "";

        if (path.indexOf("?") > -1) {
            uri += "&client_id=" + this._clientId + projectParam;
        } else {
            uri += "?client_id=" + this._clientId + projectParam;
        }

        return this._client(uri).entity();
    }

    private _createClient(token?: string): rest.Client {
        let client: rest.Client = rest.wrap(mime);

        if (!!token) {
            client = client.wrap(oAuth, { token: "bearer " + token });
        }

        return client;
    }
};

export default APIv2Call;
