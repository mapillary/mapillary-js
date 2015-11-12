/// <reference path="../../typings/when/when.d.ts" />

import * as when from "when";

import {GraphConstants, Graph, Node} from "../Graph";
import {IAPINavIm} from "../API";
import {ILatLon, IViewerOptions} from "../Viewer";
import {OptionsParser} from "./OptionsParser";
import {ParameterMapillaryError} from "../Error";
import {Prefetcher} from "./Prefetcher";

export class Viewer {
    /**
     * The node that the viewer is currently looking at
     * @member Mapillary.Viewer#currentNode
     * @public
     * @type {Node}
     */
    public currentNode: Node;

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
    public moveToKey(key: string): when.Promise<{}> {
        if (key == null) {
            throw new ParameterMapillaryError();
        }
        if (this.loading) {
            return when.reject("Viewer is Loading");
        }

        if (this.graph.keyIsWorthy(key)) {
            return when(this.graph.node(key));
        } else {
            let response: when.Promise<IAPINavIm> = this.prefetcher.loadFromKey(key);
            return response.then((data: IAPINavIm) => {
                this.graph.insertNodes(data);
                this.graph.updateGraphForKey(key);
                this.currentNode = this.graph.node(key);
                return this.currentNode;
            });
        }
    }

    /**
     * Move in a direction
     * @method Mapillary.Viewer#moveToLngLat
     * @param {LatLng} latLng FIXME
     */
    public moveDir(dir: GraphConstants.DirEnum): when.Promise<{}> {
        if (dir < 0 || dir >= 13) {
            throw new ParameterMapillaryError();
        }
        if (this.loading) {
            return when.reject("Viewer is Loading");
        }

        let nextNode: Node = this.graph.nextNode(this.currentNode, dir);
        if (nextNode == null) {
            return when.reject("There are no node in direction: " + dir);
        }

        return this.moveToKey(nextNode.key);
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
