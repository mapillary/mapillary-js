import * as when from "when";

import {APIv2Call, IAPISearchImClose2} from "../API";

export class APISearchIm extends APIv2Call {
    public callSearchIm(path: string): when.Promise<any> {
        return this.callApi("search/im/" + path);
    }

    public close2(lat: number, lon: number): when.Promise<IAPISearchImClose2> {
        return this.callSearchIm(`close2?lat=${lat}&lon=${lon}`);
    }
}

export default APISearchIm
