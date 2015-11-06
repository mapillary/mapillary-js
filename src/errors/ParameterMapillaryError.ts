import MapillaryError from "./MapillaryError";

export class ParameterMapillaryError extends MapillaryError {
    constructor () {
        this.name = "ParameterMapillaryError";
        this.message = "The function was not called with correct parameters";
        super();
    }
}

export default ParameterMapillaryError;
