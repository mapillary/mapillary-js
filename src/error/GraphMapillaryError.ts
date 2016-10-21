import {MapillaryError} from "./MapillaryError";

export class GraphMapillaryError extends MapillaryError {
    constructor (message: string) {
        super();

        this.name = "GraphMapillaryError";
        this.message = message;
    }
}

export default GraphMapillaryError;
