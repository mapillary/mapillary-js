/// <reference path="../typings/when/when.d.ts" />

import * as when from "when";

import Graph from "./Graph";
import Prefetcher from "./viewer/Prefetcher";

/* Errors */
import ParameterMapillaryError from "./errors/ParameterMapillaryError";

/* Interfaces */
import IAPINavIm from "./interfaces/IAPINavIm";
import ILatLon from "./interfaces/ILatLon";

export class Viewer {
    /**
     * true if Viewer is loading internally, false if not.
     * @member Mapillary.Viewer#loading
     * @public
     * @type {boolean}
     */
    public loading: boolean;

    /**
     * Representation of the walkable graph
     * @member Mapillary.Viewer#graph
     * @private
     * @type {Graph}
     */
    private graph: Graph;

    /**
     * Used for prefetching information about keys from Mapillary API
     * @member Mapillary.Viewer#loading
     * @private
     * @type {Prefetcher}
     */
    private prefetcher: Prefetcher;

    /**
     * Initializes a Mapillary viewer
     * @class Mapillary.Viewer
     * @classdesc A Viewer for viewing Mapillary Street Level Imagery
     * @param {string} id of element to transform into viewer
     * @param {string} clientId for Mapillary API
     */
    constructor (id: string, clientId: string) {
        this.loading = false;

        this.graph = new Graph();
        this.prefetcher = new Prefetcher(clientId);
    }

    /**
     * Move to an image key
     * @method Mapillary.Viewer#moveToKey
     * @param {string} key Mapillary image key to move to
     * @throws {ParamaterMapillaryError} If no key is provided
     */
    public moveToKey(key: string, cb?: (data: IAPINavIm) => void): boolean {
        if (key == null) {
            throw new ParameterMapillaryError();
        }
        if (this.loading) {
            return false;
        }

        if (this.graph.keyIsWorthy(key)) {
            console.log("MOVE ON");
        } else {
            let response: when.Promise<IAPINavIm> = this.prefetcher.loadFromKey(key);
            response.then((data: IAPINavIm) => {
                console.log(data);
                if (cb != null) {
                    cb(data);
                }
            });
        }
    }

    /**
     * Move to a latitude longitude
     * @method Mapillary.Viewer#moveToLngLat
     * @param {LatLng} latLng FIXME
     */
    public moveToLngLat(latLon: ILatLon): boolean {
        return true;
    }

    /**
     * Move to a key that looks at a specific latitude longitude
     * @method Mapillary.Viewer#moveToKey
     * @param {LatLng} latLng FIXME
     */
    public moveToLookAtLngLat(latLon: ILatLon): boolean {
        return true;
    }
}

export default Viewer;
