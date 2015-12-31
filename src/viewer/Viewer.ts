/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as _ from "underscore";
import * as rx from "rx";

import {InitializationMapillaryError, ParameterMapillaryError} from "../Error";
import {Node} from "../Graph";
import {EdgeConstants} from "../Edge";
import {IViewerOptions, Navigator, OptionsParser} from "../Viewer";
import {CoverUI, IActivatableUI, NoneUI, SimpleUI, GlUI, CssUI} from "../UI";

interface IActivatableUIMap {
    [name: string]: IActivatableUI;
}

export class Viewer {

    /**
     * Current active and used ui
     * @member Mapillary.Viewer#ui
     * @public
     * @type {IActivatableUI}
     */
    public activeUis: {[key: string]: IActivatableUI};

    /**
     * Navigator used to Navigate the vast seas of Mapillary
     * @member Mapillary.Viewer#navigator
     * @public
     * @type {Navigator}
     */
    public navigator: Navigator;

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
     * Options to used to tweak the viewer. Optional if not
     * provided Viewer will be set do default.
     * @member Mapillary.Viewer#options
     * @private
     * @type {IViewerOptions}
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
        let optionsParser: OptionsParser = new OptionsParser();
        this.options = optionsParser.parseAndDefaultOptions(options);

        this.uis = {};
        this.navigator = new Navigator(clientId);

        // fixme unuglify these switches
        if (_.indexOf(this.options.uiList, "cover") !== -1 ||
            _.indexOf(this.options.uiList, "simple") !== -1 ||
            _.indexOf(this.options.uiList, "gl") !== -1 ||
            _.indexOf(this.options.uiList, "css") !== -1) {
            this.container = this.setupContainer(id);

            if (_.indexOf(this.options.uiList, "cover") !== -1) {
                let coverUI: CoverUI = new CoverUI(this.container);
                this.addUI("cover", coverUI);
            }

            if (_.indexOf(this.options.uiList, "simple") !== -1) {
                let simpleUI: SimpleUI = new SimpleUI(this.container, this.navigator);
                this.addUI("simple", simpleUI);
            }

            if (_.indexOf(this.options.uiList, "gl") !== -1) {
                let glUI: GlUI = new GlUI(this.container, this.navigator.state);
                this.addUI("gl", glUI);
            }

            if (_.indexOf(this.options.uiList, "css") !== -1) {
                let cssUI: CssUI = new CssUI(this.container, this.navigator);
                this.addUI("css", cssUI);
            }
        }

        if (_.indexOf(this.options.uiList, "none") !== -1) {
            let noneUI: NoneUI = new NoneUI(true);
            this.addUI("none", noneUI);
        }

        this.activeUis = {};
        _.map(this.options.uis, (ui: string) => {
            this.activateUI(ui);
        });

        if (this.options.key != null) {
            this.moveToKey(this.options.key).first().subscribe();
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
        this.uis[name].activate();
        this.activeUis[name] = this.uis[name];
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
    public moveToKey(key: string): rx.Observable<Node> {
        if (key == null) {
            throw new ParameterMapillaryError();
        }
        return this.navigator.moveToKey(key);
    }

    /**
     * Move in a direction
     * @method Mapillary.Viewer#moveToLngLat
     * @param {LatLng} latLng FIXME
     */
    public moveDir(dir: EdgeConstants.Direction): rx.Observable<Node> {
        if (dir < 0 || dir >= 13) {
            throw new ParameterMapillaryError();
        }
        return this.navigator.moveDir(dir);
    }

    private setupContainer(id: string): HTMLElement {
        let element: HTMLElement = document.getElementById(id);

        if (element == null) {
            throw new InitializationMapillaryError();
        }

        element.classList.add("mapillary-js");
        return element;
    }
}

export default Viewer;
