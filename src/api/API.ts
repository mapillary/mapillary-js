import APINav from "./APINav";

/* Interface Exports Start */
import {IAPINavIm} from "./interfaces/IAPINavIm";
import {IAPINavImIm} from "./interfaces/IAPINavImIm";
import {IAPINavImS} from "./interfaces/IAPINavImS";

export {IAPINavIm} from "./interfaces/IAPINavIm";
export {IAPINavImIm} from "./interfaces/IAPINavImIm";
export {IAPINavImS} from "./interfaces/IAPINavImS";
/* Interface Exports End */

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
