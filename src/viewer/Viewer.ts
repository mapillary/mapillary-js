/// <reference path="../../typings/when/when.d.ts" />

/* Interface Exports */
export * from "./interfaces/interfaces"

import * as when from "when";

import {Debug} from "../utils/Debug";
import {Graph} from "../graph/Graph";
import {Prefetcher} from "./Prefetcher";
import {OptionsParser} from "./OptionsParser";

/* Errors */
import ParameterMapillaryError from "../errors/ParameterMapillaryError";

/* Interfaces */
import {IAPINavIm} from "../api/API";
import {ILatLon, IViewerOptions} from "./interfaces/interfaces";

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
     * Options to used to tweak the viewer. Optional if not
     * provided Viewer will be set do default.
     * @member Mapillary.Viewer#options
     * @private
     * @type {Prefetcher}
     */
    private options: IViewerOptions;

    /**
     * Initializes a Mapillary viewer
     * @class Mapillary.Viewer
     * @classdesc A Viewer for viewing Mapillary Street Level Imagery
     * @param {string} id of element to transform into viewer
     * @param {string} clientId for Mapillary API
     * @param {IViewerOptions} Options for the viewer
     */
    constructor (id: string, clientId: string, options: IViewerOptions) {
        this.loading = false;

        let optionsParser: OptionsParser = new OptionsParser();
        this.options = optionsParser.parseAndDefaultOptions(options);

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
            Debug.log("MOVE ON");
        } else {
            let response: when.Promise<IAPINavIm> = this.prefetcher.loadFromKey(key);
            response.then((data: IAPINavIm) => {
                if (cb != null) {
                    Debug.debug(data);
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
