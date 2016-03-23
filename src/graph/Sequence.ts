/// <reference path="../../typings/browser.d.ts" />

import * as _ from "underscore";

import {IAPINavImS} from "../API";

export class Sequence {
    public key: string;
    public keys: string[];
    public path: any;

    private _response: IAPINavImS;

    constructor (response: IAPINavImS) {
        this._response = response;

        this.key = response.key;
        this.keys = response.keys;
        this.path = response.path;
    }

    public findNextKey (key: string): string {
        let i: number = _.indexOf(this.keys, key);

        if ((i + 1) >= this.keys.length || i === -1) {
            return null;
        } else {
            return this.keys[i + 1];
        }
    }

    public findPrevKey (key: string): string {
        let i: number = _.indexOf(this.keys, key);

        if (i === 0 || i === -1) {
            return null;
        } else {
            return this.keys[i - 1];
        }
    }

}

export default Sequence
