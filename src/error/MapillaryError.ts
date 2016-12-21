export class MapillaryError extends Error {
    constructor (message?: string) {
        super(message);

        this.name = "MapillaryError";
    }
}

export default MapillaryError;
