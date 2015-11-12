import {MapillaryError} from "./MapillaryError";

export class NotImplementedMapillaryError extends MapillaryError {
    constructor () {
        this.name = "NotImplementedMapillaryError";
        this.message = "This function has not yet been implemented";
        super();
    }
}

export default NotImplementedMapillaryError;
