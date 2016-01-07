import APINav from "./APINav";
import APISearch from "./APISearch";

export class APIv2 {
    public nav: APINav;
    public search: APISearch;

    private clientId: string;

   /**
    * Initializes an endpoint to the Mapillary API
    *
    * @class API
    * @classdesc An endpoint for the Mapillary API
    * @param {string} clientId - Mapillary API Client ID
    */
    constructor (clientId: string) {
        this.clientId = clientId;
        this.nav = new APINav(clientId);
        this.search = new APISearch(clientId);
    };
}

export default APIv2;
