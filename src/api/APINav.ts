import * as when from "when";

import {APIv2Call, IAPINavIm} from "../API";

export class APINav extends APIv2Call {
    public callNav(path: string): when.Promise<any> {
        return this.callApi("nav/" + path);
    }

    public h(id: string): when.Promise<IAPINavIm> {
        return this.callNav("h/" + id);
    }

    public im(key: string): when.Promise<IAPINavIm> {
        return this.callNav("im/" + key);
    }
}

export default APINav
