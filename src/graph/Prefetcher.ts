/// <reference path="../../typings/when/when.d.ts" />

import * as when from "when";

import {IAPINavIm} from "../API";
import {APIv2} from "../API";

interface IHash {
    lastUsed: Date;
    data: IAPINavIm;
}

interface IHashes {
    [key: string]: IHash;
};

export class Prefetcher {
    private apiV2: APIv2;
    private cacheMaxSize: number;
    private hashes: IHashes;

    constructor (clientId: string, cacheMaxSize?: number) {
        this.apiV2 = new APIv2(clientId);

        this.cacheMaxSize = 30;
        if (cacheMaxSize != null) {
            this.cacheMaxSize = cacheMaxSize;
        }

        this.hashes = {};
    }

    public loadFromKey(key: string): when.Promise<IAPINavIm> {
        return this.apiV2.nav.im(key).then((data: IAPINavIm): IAPINavIm => {
            for (let h in data.hs) {
                if (data.hs.hasOwnProperty(h)) {
                    let hkey: string = data.hs[h];
                    if (!this.hashIsCached(hkey)) {
                        this.addToCache(hkey, data);
                    }
                }
            }

            return data;
        });
    }

    public loadFromHash(hkey: string): when.Promise<IAPINavIm> {
        if (this.hashIsCached(hkey)) {
            let hash: IHash = this.getFromCache(hkey);
            return when(hash.data);
        } else {
            return this.apiV2.nav.h(hkey);
        }
    }

    private addToCache(hkey: string, data: IAPINavIm): void {
        let hash: IHash = {
            data: data,
            lastUsed: new Date,
        };

        this.hashes[hkey] = hash;
    }

    private getFromCache(hkey: string): IHash {
        let hash: IHash = this.hashes[hkey];
        hash.lastUsed = new Date;
        return hash;
    }

    private hashIsCached(hkey: string): boolean {
        return (hkey in this.hashes);
    }

}

export default Prefetcher
