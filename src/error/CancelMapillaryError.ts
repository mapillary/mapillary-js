import { MapillaryError } from "./MapillaryError";

/**
 * @class CancelMapillaryError
 *
 * @classdesc Error thrown when a move to request has been
 * cancelled before completing because of a subsequent request.
 */
export class CancelMapillaryError extends MapillaryError {
    constructor(message?: string) {
        super(message != null ? message : "The request was cancelled.");

        Object.setPrototypeOf(this, CancelMapillaryError.prototype);

        this.name = "CancelMapillaryError";
    }
}
