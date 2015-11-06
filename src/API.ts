import APINav from "./api/APINav";

export class APIv2 {
    public nav: APINav;

    private clientId: string;

   /**
    * Initializes an endpoint to the Mapillary API
    * @class Mapillary.API
    * @classdesc An endpoint for the Mapillary API
    * @param {string} clientId for Mapillary API
    */
    constructor (clientId: string) {
        this.clientId = clientId;
        this.nav = new APINav(clientId);
    };
}

export default APIv2;
