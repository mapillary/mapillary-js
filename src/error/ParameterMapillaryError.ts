import {MapillaryError} from "./MapillaryError";

export class ParameterMapillaryError extends MapillaryError {
    constructor (message?: string) {
        this.name = "ParameterMapillaryError";
        this.message = message != null ? message : "The function was not called with correct parameters";
        super();
    }
}

export default ParameterMapillaryError;
