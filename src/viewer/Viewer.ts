/// <reference path="../../typings/when/when.d.ts" />

import * as _ from "underscore";
import * as when from "when";

import {IAPINavIm} from "../API";
import {MoveTypeMapillaryError, InitializationMapillaryError, ParameterMapillaryError} from "../Error";
import {Graph, GraphConstants, Node} from "../Graph";
import {AssetCache, ILatLon, IViewerOptions, OptionsParser, Prefetcher} from "../Viewer";
import {CoverUI, IActivatableUI, NoneUI, SimpleUI, GlUI} from "../UI";
import {StateContext} from "../State";

interface IActivatableUIMap {
    [name: string]: IActivatableUI;
}

export class Viewer {
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
     * true if Viewer is loading internally, false if not.
     * @member Mapillary.Viewer#loading
     * @public
     * @type {boolean}
     */
    public loading: boolean;

    /**
     * Current active and used ui
     * @member Mapillary.Viewer#ui
     * @public
     * @type {IActivatableUI}
     */
    public ui: IActivatableUI;

    /**
     * Cache for assets
     * @member Mapillary.Viewer#assetCache
     * @private
     * @type {Graph}
     */
    private assetCache: AssetCache;

    /**
     * HTML element containing the Mapillary viewer
     * @member Mapillary.Viewer#container
     * @private
     * @type {HTMLElement}
     */
    private container: HTMLElement;

    /**
     * Named dictionary of availble uis
     * @member Mapillary.Viewer#uis
     * @private
     * @type {IActivatableUIMap}
     */
    private uis: IActivatableUIMap;

    /**
     * Representation of the walkable graph
     * @member Mapillary.Viewer#graph
     * @private
     * @type {Graph}
     */
    private graph: Graph;

    /**
     * Options to used to tweak the viewer. Optional if not
     * provided Viewer will be set do default.
     * @member Mapillary.Viewer#options
     * @private
     * @type {IViewerOptions}
     */
    private options: IViewerOptions;

    /**
     * Used for prefetching information about keys from Mapillary API
     * @member Mapillary.Viewer#loading
     * @private
     * @type {Prefetcher}
     */
    private prefetcher: Prefetcher;

    /**
     * Holds the current state
     * @member Mapillary.Viewer#state
     * @private
     * @type {StateContext}
     */
    private state: StateContext;

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

        this.assetCache = new AssetCache();
        this.assetCache.enableAsset("image");
        // this.assetCache.enableAsset("mesh");

        this.graph = new Graph();
        this.prefetcher = new Prefetcher(clientId);

        this.state = new StateContext();

        this.uis = {};

        // fixme unuglify these switches

        if (_.indexOf(this.options.uiList, "cover") !== -1 ||
            _.indexOf(this.options.uiList, "simple") !== -1 ||
            _.indexOf(this.options.uiList, "gl") !== -1) {
            this.container = this.setupContainer(id);

            if (_.indexOf(this.options.uiList, "cover") !== -1) {
                let coverUI: CoverUI = new CoverUI(this.container);
                this.addUI("cover", coverUI);
            }

            if (_.indexOf(this.options.uiList, "simple") !== -1) {
                let simpleUI: SimpleUI = new SimpleUI(this.container);
                this.addUI("simple", simpleUI);
            }

            if (_.indexOf(this.options.uiList, "gl") !== -1) {
                let glUI: GlUI = new GlUI(this.container, this.state);
                this.addUI("gl", glUI);
            }
        }

        if (_.indexOf(this.options.uiList, "none") !== -1) {
            let noneUI: NoneUI = new NoneUI(true);
            this.addUI("none", noneUI);
        }

        this.activateUI(this.options.ui);

        if (this.options.key != null) {
            this.moveToKey(this.options.key);
        }
    }

    /**
     * Activate an ui (means disabling current ui)
     * @method Mapillary.Viewer#activateUI
     * @param {IActivatableUI} activate ui on viewer
     */
    public activateUI(name: string): void {
        if (!(name in this.uis)) {
            throw new ParameterMapillaryError();
        }

        if (this.ui != null) {
            this.ui.deactivate();
        }

        this.uis[name].activate();
        this.ui = this.uis[name];

        if (this.currentNode) {
            this.moveToKey(this.currentNode.key);
        }
    }

    /**
     * Add ui to the viewer
     * @method Mapillary.Viewer#addUI
     * @param {IActivatableUI} add ui to viewer
     */
    public addUI(name: string, ui: IActivatableUI): void {
        this.uis[name] = ui;
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
        this.loading = true;

        if (this.ui.graphSupport) {
            if (this.graph.keyIsWorthy(key)) {
                return this.cacheNode(this.graph.node(key));
            } else {
                return this.prefetcher.loadFromKey(key).then((data: IAPINavIm) => {
                    this.graph.insertNodes(data);
                    return this.cacheNode(this.graph.node(key));
                });
            }
        } else {
            let node: Node = this.graph.insertNoneWorthyNodeFromKey(key);
            this.setCurrentNode(node);
            return when(node);
        }
    }

    /**
     * Move in a direction
     * @method Mapillary.Viewer#moveToLngLat
     * @param {LatLng} latLng FIXME
     */
    public moveDir(dir: GraphConstants.Direction): when.Promise<{}> {
        if (!this.ui.graphSupport) {
            throw new MoveTypeMapillaryError();
        }
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

    private cacheNode(wantedNode: Node): when.Promise<{}> {
        let cacheNodes: Node[] = this.graph.updateGraph(wantedNode);

        if (this.assetCache.isCached(wantedNode)) {
            this.setCurrentNode(wantedNode);
        }

        return this.assetCache.cache(cacheNodes).then((data: any) => {
            this.setCurrentNode(wantedNode);
            return when(wantedNode);
        });
    }

    private setupContainer(id: string): HTMLElement {
        let element: HTMLElement = document.getElementById(id);

        if (element == null) {
            throw new InitializationMapillaryError();
        }

        element.classList.add("mapillary-js");
        return element;
    }

    private setCurrentNode(node: Node): void {
        this.loading = false;
        this.state.move(node);
        this.ui.display(node);
    }
}

export default Viewer;
