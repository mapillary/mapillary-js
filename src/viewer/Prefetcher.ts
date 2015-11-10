/// <reference path="../../typings/when/when.d.ts" />

import * as when from "when";

import APIv2 from "../api/API";

/* Interfaces */
import {IAPINavIm} from "../api/interfaces/IAPINavIm";

/* Internal Interfaces */
interface IHash {
    lastUsed: number;
    data: IAPINavIm;
}

interface IHashes {
    [key: string]: IHash;
};

export class Prefetcher {
    private apiV2: APIv2;
    private cacheMaxSize: number;

    constructor (clientId: string, cacheMaxSize?: number) {
        this.apiV2 = new APIv2(clientId);

        this.cacheMaxSize = 30;
        if (cacheMaxSize != null) {
            this.cacheMaxSize = cacheMaxSize;
        }
    }

    public loadFromKey(key: string): when.Promise<IAPINavIm> {
        return this.apiV2.nav.im(key);
    }

    public loadFromHash(hash: string): when.Promise<IAPINavIm> {
        return this.apiV2.nav.h(hash);
    }

}

export default Prefetcher
