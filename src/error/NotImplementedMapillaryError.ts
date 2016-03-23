import {MapillaryError} from "./MapillaryError";

export class NotImplementedMapillaryError extends MapillaryError {
    constructor () {
        super();

        this.name = "NotImplementedMapillaryError";
        this.message = "This function has not yet been implemented";
    }
}

export default NotImplementedMapillaryError;
