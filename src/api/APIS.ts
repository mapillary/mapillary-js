import * as when from "when";

import {APIv2Call, IAPISGet} from "../API";

export class APIS extends APIv2Call {
    public callS(path: string): when.Promise<any> {
        return this.callApi("s/" + path);
    }

    public get(sequenceKey: string): when.Promise<IAPISGet> {
        return this.callS(sequenceKey);
    }
}

export default APIS
