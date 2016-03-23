import {MapillaryError} from "./MapillaryError";

export class MoveTypeMapillaryError extends MapillaryError {
    constructor () {
        super();

        this.name = "MoveTypeMapillaryError";
        this.message = "The type of ui you use does not support this move";
    }
}

export default MoveTypeMapillaryError;
