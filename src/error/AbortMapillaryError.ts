import {MapillaryError} from "./MapillaryError";

export class AbortMapillaryError extends MapillaryError {
    constructor (message?: string) {
        super(message != null ? message : "The request was aborted.");

        Object.setPrototypeOf(this, AbortMapillaryError.prototype);

        this.name = "AbortMapillaryError";
    }
}

export default AbortMapillaryError;
