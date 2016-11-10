import {MapillaryError} from "./MapillaryError";

export class GraphMapillaryError extends MapillaryError {
    constructor (message: string) {
        super(message);

        this.name = "GraphMapillaryError";
    }
}

export default GraphMapillaryError;
