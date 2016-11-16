export class MapillaryError extends Error {
    constructor (message?: string) {
        super();

        this.message = message;
        this.name = "MapillaryError";
        this.stack = new Error().stack;
    }
}

export default MapillaryError;
