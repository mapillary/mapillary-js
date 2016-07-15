import APIIm from "./APIIm";
import APINav from "./APINav";
import APISearch from "./APISearch";
import APIS from "./APIS";

export class APIv2 {
    public im: APIIm;
    public nav: APINav;
    public s: APIS;
    public search: APISearch;

    private _clientId: string;

   /**
    * Initializes an endpoint to the Mapillary API
    *
    * @class API
    * @classdesc An endpoint for the Mapillary API
    * @param {string} clientId - Mapillary API Client ID
    */
    constructor (clientId: string) {
        this._clientId = clientId;

        this.im = new APIIm(clientId);
        this.nav = new APINav(clientId);
        this.s = new APIS(clientId);
        this.search = new APISearch(clientId);
    };

    public auth(token?: string, projectKey?: string): void {
        this.im.auth(token, projectKey);
        this.nav.auth(token, projectKey);
        this.s.auth(token, projectKey);
        this.search.auth(token, projectKey);
    }
}

export default APIv2;
