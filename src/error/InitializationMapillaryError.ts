import {MapillaryError} from "./MapillaryError";

export class InitializationMapillaryError extends MapillaryError {
    constructor () {
        this.name = "InitializationMapillaryError";
        this.message = "Could not initialize";
        super();
    }
}

export default InitializationMapillaryError;
