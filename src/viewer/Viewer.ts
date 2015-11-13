/// <reference path="../../typings/when/when.d.ts" />

import * as when from "when";

import {GraphConstants, Graph, Node} from "../Graph";
import {IAPINavIm} from "../API";
import {AssetCache, Cover, ILatLon, IViewerOptions, OptionsParser, Prefetcher} from "../Viewer";
import {ParameterMapillaryError, InitializationMapillaryError} from "../Error";

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
     * Cache for assets
     * @member Mapillary.Viewer#assetCache
     * @private
     * @type {Graph}
     */
    private assetCache: AssetCache;

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
     * @type {IViewerOptions}
     */
    private options: IViewerOptions;

    /**
     * HTML element containing the Mapillary viewer
     * @member Mapillary.Viewer#container
     * @private
     * @type {HTMLElement}
     */
    private container: HTMLElement;

    /**
     * Cover of one image that will show before viewer is correctly initialized
     * @member Mapillary.Viewer#cover
     * @private
     * @type {Cover}
     */
    private cover: Cover;

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
        this.assetCache.enableAsset("mesh");

        this.graph = new Graph();
        this.prefetcher = new Prefetcher(clientId);

        this.container = this.setupContainer(id);

        this.cover = new Cover(this.container);
        if (options.initialNode != null) {
            this.cover.set(options.initialNode);
        }
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
            return this.cacheNode(this.graph.node(key));
        } else {
            return this.prefetcher.loadFromKey(key).then((data: IAPINavIm) => {
                this.graph.insertNodes(data);
                return this.cacheNode(this.graph.node(key));
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
        this.currentNode = node;
    }
}

export default Viewer;
