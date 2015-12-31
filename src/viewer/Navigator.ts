/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {GraphService, Node} from "../Graph";
import {EdgeConstants} from "../Edge";
import {StateService, StateContext} from "../State";

export class Navigator {
    /**
     * The node that the viewer is currently looking at
     * @member Mapillary.Viewer#currentNode
     * @public
     * @type {Node}
     */
    public get currentNode(): Node {
        return this.state.current.node;
    }

    /**
     * Service for handling the graph
     * @member Mapillary.Viewer#graphService
     * @public
     * @type {GraphService}
     */
    public graphService: GraphService;

    /**
     * Service for handling the state
     * @member Mapillary.Viewer#stateService
     * @public
     * @type {StateService}
     */
    public stateService: StateService;

    /**
     * Holds the current state
     * @member Mapillary.Viewer#state
     * @private
     * @type {StateContext}
     */
    public state: StateContext;

    /**
     * true if Viewer is loading internally, false if not.
     * @member Mapillary.Viewer#loading
     * @public
     * @type {boolean}
     */
    public loading: boolean;

    /**
     * Initializes a Mapillary viewer
     * @class Mapillary.Viewer
     * @classdesc A Viewer for viewing Mapillary Street Level Imagery
     * @param {string} id of element to transform into viewer
     * @param {string} clientId for Mapillary API
     * @param {IViewerOptions} Options for the viewer
     */
    constructor (clientId: string) {
        this.loading = false;

        this.state = new StateContext();
        this.graphService = new GraphService(clientId);
        this.stateService = new StateService();
    }

    /**
     * Move to an image key
     * @method Mapillary.Viewer#moveToKey
     * @param {string} key Mapillary image key to move to
     * @throws {ParamaterMapillaryError} If no key is provided
     */
    public moveToKey(key: string): rx.Observable<Node> {
        if (this.loading) {
            return rx.Observable.throw<Node>(new Error("viewer is loading"));
        }
        this.loading = true;

        return this.graphService.getNode(key).map<Node>((node: Node): Node => {
            this.loading = false;
            this.state.move(node);
            this.stateService.startMove([node]);
            return node;
        });
    }

    /**
     * Move in a direction
     * @method Mapillary.Viewer#moveToLngLat
     * @param {LatLng} latLng FIXME
     */
    public moveDir(dir: EdgeConstants.Direction): rx.Observable<Node> {
        if (this.loading) {
            return rx.Observable.throw<Node>(new Error("viewer is loading"));
        }
        return this.graphService.getNextNode(this.currentNode, dir).flatMap((node: Node) => {
            return this.moveToKey(node.key);
        });
    }
}

export default Navigator;
