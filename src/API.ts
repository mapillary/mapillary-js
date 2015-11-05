///<reference path="../typings/rest/rest.d.ts" />

import * as rest from "rest";
import * as mime from "rest/interceptor/mime";

export namespace API {
    "use strict";

    export class APIc {
        private clientId: string;
        private httpsUrl: string;
        private client: rest.Client;

        constructor (clientId: string) {
            this.clientId = clientId;
            this.httpsUrl = "https://a.mapillary.com/v2/";
            this.client = rest.wrap(mime);
        };

        public callApi(path: string): any {
            return this.client(this.httpsUrl + path + "?client_id=" + this.clientId);
        }
    };

    class NavAPIc extends APIc {
        public callNav(path: string): any {
            return this.callApi("nav/" + path);
        }

        public h(id: string): any {
            return this.callNav("h/" + id);
        }

        public im(key: string): any {
            return this.callNav("im/" + key);
        }
    }

    export class APIv2 {
        public nav: APIc;

        private clientId: string;

       /**
        * Initializes an endpoint to the Mapillary API
        * @class Mapillary.API
        * @classdesc An endpoint for the Mapillary API
        * @param {string} clientId for Mapillary API
        */
        constructor (clientId: string) {
            this.clientId = clientId;
            this.nav = new NavAPIc(clientId);
        };
    }
}

export default API;
