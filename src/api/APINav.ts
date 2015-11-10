/// <reference path="../../typings/when/when.d.ts" />

import * as when from "when";

import APIc from "./APIc";

/* interfaces */
import IAPINavIm from "./interfaces/IAPINavIm";

export class APINav extends APIc {
    public callNav(path: string): when.Promise<any> {
        return this.callApi("nav/" + path).entity();
    }

    public h(id: string): when.Promise<IAPINavIm> {
        return this.callNav("h/" + id);
    }

    public im(key: string): when.Promise<IAPINavIm> {
        return this.callNav("im/" + key);
    }
}

export default APINav
