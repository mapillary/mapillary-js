import {MapillaryError} from "./MapillaryError";

export class InitializationMapillaryError extends MapillaryError {
    constructor () {
        super();

        this.name = "InitializationMapillaryError";
        this.message = "Could not initialize";
    }
}

export default InitializationMapillaryError;
