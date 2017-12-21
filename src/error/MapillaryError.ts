export class MapillaryError extends Error {
    constructor (message?: string) {
        super(message);

        Object.setPrototypeOf(this, MapillaryError.prototype);

        this.name = "MapillaryError";
    }
}

export default MapillaryError;
