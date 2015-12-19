/// <reference path="../../typings/rest/rest.d.ts" />
/// <reference path="../../typings/when/when.d.ts" />

import * as rest from "rest";
import * as mime from "rest/interceptor/mime";

import * as when from "when";

import {VCR} from "../VCR";

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
        let uri: string = this.httpsUrl + path + "?client_id=" + this.clientId;

        if (process.env.VCR === undefined) {
            return this.client(uri).entity();
        } else if (process.env.VCR === "recording") {
            if (VCR.get("apicall", uri) !== undefined) {
                return when(VCR.get("apicall", uri));
            } else {
                VCR.set("apicall", uri, undefined);
            }
            return this.client(uri).entity().then((data: any): any => {
                VCR.set("apicall", uri, data);
                return data;
            });
        } else if (process.env.VCR === "playback") {
            return when(VCR.get("apicall", uri));
        }
    }
};

export default APIv2Call
