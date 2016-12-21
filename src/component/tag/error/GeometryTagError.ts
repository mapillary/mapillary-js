import {MapillaryError} from "../../../Error";

export class GeometryTagError extends MapillaryError {
    constructor (message?: string) {
        super(message != null ? message : "The provided geometry value is incorrect");

        this.name = "GeometryTagError";
    }
}

export default MapillaryError;
