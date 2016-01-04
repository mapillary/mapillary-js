/// <reference path="../../typings/when/when.d.ts" />

import * as _ from "underscore";
import * as when from "when";

import {InitializationMapillaryError, ParameterMapillaryError} from "../Error";
import {Node} from "../Graph";
import {EdgeConstants} from "../Edge";
import {IViewerOptions, Navigator, OptionsParser} from "../Viewer";
import {CoverUI, IUI, NoneUI, SimpleUI, GlUI, SimpleNavUI} from "../UI";
import {CacheBot, IBot} from "../Bot";

export class Viewer {

    /**
     * Current active and used ui
     * @member Mapillary.Viewer#ui
     * @public
     * @type {{[key: string]: IUI}}
     */
    public activeUis: {[key: string]: IUI};

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
     * @type {{[key: string]: IUI}}
     */
    private uis: {[key: string]: IUI};

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
        if (_.indexOf(this.options.uis, "cover") !== -1 ||
            _.indexOf(this.options.uis, "simple") !== -1 ||
            _.indexOf(this.options.uis, "gl") !== -1 ||
            _.indexOf(this.options.uis, "simplenav") !== -1) {
            this.container = this.setupContainer(id);

            if (_.indexOf(this.options.uis, "cover") !== -1) {
                let coverUI: CoverUI = new CoverUI(this.container);
                this.addUI("cover", coverUI);
            }

            if (_.indexOf(this.options.uis, "simple") !== -1) {
                let simpleUI: SimpleUI = new SimpleUI(this.container, this.navigator);
                this.addUI("simple", simpleUI);
            }

            if (_.indexOf(this.options.uis, "gl") !== -1) {
                let glUI: GlUI = new GlUI(this.container, this.navigator.state);
                this.addUI("gl", glUI);
            }

            if (_.indexOf(this.options.uis, "simplenav") !== -1) {
                let simpleNavUI: SimpleNavUI = new SimpleNavUI(this.container, this.navigator);
                this.addUI("simplenav", simpleNavUI);
            }
        }

        if (_.indexOf(this.options.uis, "none") !== -1) {
            let noneUI: NoneUI = new NoneUI();
            this.addUI("none", noneUI);
        }

        this.activeUis = {};
        _.map(this.options.uis, (ui: string) => {
            this.activateUI(ui);
        });

        if (this.options.key != null) {
            this.moveToKey(this.options.key);
        }

        this.activateBot(new CacheBot());
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

    public activateBot(bot: IBot): void {
        bot.activate(this.navigator);
    }

    /**
     * Add ui to the viewer
     * @method Mapillary.Viewer#addUI
     * @param {IActivatableUI} add ui to viewer
     */
    public addUI(name: string, ui: IUI): void {
        this.uis[name] = ui;
    }

    /**
     * Move to an image key
     * @method Mapillary.Viewer#moveToKey
     * @param {string} key Mapillary image key to move to
     * @throws {ParamaterMapillaryError} If no key is provided
     */
    public moveToKey(key: string): when.Promise<Node> {
        if (key == null) {
            throw new ParameterMapillaryError();
        }
        return when.promise((resolve: (value: any) => void, reject: (reason: any) => void): void => {
            this.navigator.moveToKey(key).first().subscribe((node: Node) => {
                resolve(node);
            });
        });
    }

    /**
     * Move in a direction
     * @method Mapillary.Viewer#moveToLngLat
     * @param {LatLng} latLng FIXME
     */
    public moveDir(dir: EdgeConstants.Direction): when.Promise<Node> {
        if (dir < 0 || dir >= 13) {
            throw new ParameterMapillaryError();
        }
        return when.promise((resolve: (value: any) => void, reject: (reason: any) => void): void => {
            this.navigator.moveDir(dir).first().subscribe((node: Node) => {
                resolve(node);
            });
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
}

export default Viewer;
