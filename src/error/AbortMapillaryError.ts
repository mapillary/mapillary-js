import {MapillaryError} from "./MapillaryError";

/**
 * @class AbortMapillaryError
 *
 * @classdesc Error thrown when a move to request has been
 * aborted before completing because of a subsequent request.
 */
export class AbortMapillaryError extends MapillaryError {
    constructor (message?: string) {
        super(message != null ? message : "The request was aborted.");

        Object.setPrototypeOf(this, AbortMapillaryError.prototype);

        this.name = "AbortMapillaryError";
    }
}

export default AbortMapillaryError;
