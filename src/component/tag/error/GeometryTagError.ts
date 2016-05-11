import {MapillaryError} from "../../../Error";

export class GeometryTagError extends MapillaryError {
    constructor (message?: string) {
        super();

        this.name = "GeometryTagError";
        this.message = message != null ? message : "The provided geometry value is incorrect";
    }
}

export default MapillaryError;
