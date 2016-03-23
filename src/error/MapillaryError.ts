export class MapillaryError extends Error {
    public name: string;
    public message: string;
    public stack: string;

    constructor () {
        super();
        // fixme ERROR have not loaded correct props
        // this.stack = (new Error()).stack;
    }
}

export default MapillaryError;
