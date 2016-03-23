import {MapillaryError} from "./MapillaryError";

export class ParameterMapillaryError extends MapillaryError {
    constructor (message?: string) {
        super();

        this.name = "ParameterMapillaryError";
        this.message = message != null ? message : "The function was not called with correct parameters";
    }
}

export default ParameterMapillaryError;
