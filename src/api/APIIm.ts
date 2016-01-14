import * as when from "when";

import {APIv2Call} from "../API";

export class APIIm extends APIv2Call {
    public callOr(imageId: string): when.Promise<any> {
        return this.callApi("im/" + imageId + "/or");
    }
}

export default APIIm
