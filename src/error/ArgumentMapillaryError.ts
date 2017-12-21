import {MapillaryError} from "./MapillaryError";

export class ArgumentMapillaryError extends MapillaryError {
    constructor (message?: string) {
        super(message != null ? message : "The argument is not valid.");

        Object.setPrototypeOf(this, ArgumentMapillaryError.prototype);

        this.name = "ArgumentMapillaryError";
    }
}

export default ArgumentMapillaryError;
