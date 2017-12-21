import {MapillaryError} from "./MapillaryError";

export class GraphMapillaryError extends MapillaryError {
    constructor (message: string) {
        super(message);

        Object.setPrototypeOf(this, GraphMapillaryError.prototype);

        this.name = "GraphMapillaryError";
    }
}

export default GraphMapillaryError;
