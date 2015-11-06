import APIv2 from "../API";

export class Prefetcher {
    private apiV2: APIv2;

    constructor (clientId: string) {
        this.apiV2 = new APIv2(clientId);
    }
}

export default Prefetcher
