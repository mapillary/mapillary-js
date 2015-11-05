import API from "./API";

"use strict";

class LatLng {
    public lat: number;
    public lon: number;
}

export class Viewer {
    private apiV2: API.APIv2;

    /**
     * Initializes a Mapillary viewer
     * @class Mapillary.Viewer
     * @classdesc A Viewer for viewing Mapillary Street Level Imagery
     * @param {string} id of element to transform into viewer
     * @param {string} clientId for Mapillary API
     */
    constructor (id: string, clientId: string) {
        this.apiV2 = new API.APIv2(clientId);
    }

    /**
     * Move to an image key
     * @method Mapillary.Viewer#moveToKey
     * @param {string} key Mapillary image key to move to
     */
    public moveToKey(key: string): boolean {
        return true;
    }

    /**
     * Move to a latitude longitude
     * @method Mapillary.Viewer#moveToLngLat
     * @param {LatLng} latLng FIXME
     */
    public moveToLngLat(latLng: LatLng): boolean {
        return true;
    }

    /**
     * Move to a key that looks at a specific latitude longitude
     * @method Mapillary.Viewer#moveToKey
     * @param {LatLng} latLng FIXME
     */
    public moveToLookAtLngLat(latLng: LatLng): boolean {
        return true;
    }
}

export default Viewer;
