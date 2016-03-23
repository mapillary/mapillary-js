/// <reference path="../../typings/browser.d.ts" />

import APISearchIm from "./APISearchIm";

export class APISearch {
    public im: APISearchIm;

    private _clientId: string;

    constructor (clientId: string) {
        this._clientId = clientId;
        this.im = new APISearchIm(clientId);
    };
}

export default APISearch;
