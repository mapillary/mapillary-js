export class MapillaryError extends Error {
    public name: string;
    public message: string;
    public stack: string;

    constructor () {
        // fixme ERROR have not loaded correct props
        // this.stack = (new Error()).stack;
        super();
    }
}

export default MapillaryError;
