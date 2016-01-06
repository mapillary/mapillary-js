import APISearchIm from "./APISearchIm";

export class APISearch {
    public im: APISearchIm;
    private clientId: string;

    constructor (clientId: string) {
        this.clientId = clientId;
        this.im = new APISearchIm(clientId);
    };
}

export default APISearch;
