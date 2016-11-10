export class MapillaryError extends Error {
    constructor (message?: string) {
        super(message);

        this.name = "MapillaryError";
        this.stack = new Error().stack;
    }
}

export default MapillaryError;
