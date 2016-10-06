import {MapillaryError} from "./MapillaryError";

export class ArgumentMapillaryError extends MapillaryError {
    constructor (message?: string) {
        super();

        this.name = "ArgumentMapillaryError";
        this.message = message != null ? message : "The argument is not valid.";
    }
}

export default ArgumentMapillaryError;
