/// <reference path="../../typings/rest/rest.d.ts" />
/// <reference path="../../typings/when/when.d.ts" />

import * as fs from "fs";
import * as nodePath from "path";

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
        if (process.env.VCR === undefined) {
            return this.client(this.httpsUrl + path + "?client_id=" + this.clientId).entity();
        } else if (process.env.VCR === "recording") {
            if (APIv2Call.vcr[path] !== undefined) {
                return when(APIv2Call.vcr[path]);
            }
            return this.client(this.httpsUrl + path + "?client_id=" + this.clientId).entity().then((data: any): any => {
                APIv2Call.vcr[path] = data;
                return data;
            });
        } else if (process.env.VCR === "playback") {
            let vcr: any = JSON.parse(fs.readFileSync(nodePath.join(__dirname, "../../vcr/vcr.json"), "utf8"));
            return when(vcr[path]);
        }
    }
};

export default APIv2Call
