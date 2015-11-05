import API from "./API";

class LatLng {
    public lat: number;
    public lon: number;
}

export class Viewer {
    private api: API;

    /**
     * Initializes a Mapillary viewer
     * @class Mapillary.Viewer
     * @classdesc A Viewer for viewing Mapillary Street Level Imagery
     * @param {string} id of element to transform into viewer
     * @param {string} clientId for Mapillary API
     */
    constructor (id: string, clientId: string) {
        this.api = new API("CLIENT_ID");
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
