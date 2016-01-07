/// <reference path="../../typings/when/when.d.ts" />

import * as _ from "underscore";
import * as when from "when";

import {InitializationMapillaryError, ParameterMapillaryError} from "../Error";
import {Node} from "../Graph";
import {EdgeConstants} from "../Edge";
import {IViewerOptions, Navigator, OptionsParser, UI} from "../Viewer";
import {IUI, EventUI} from "../UI";
import {CacheBot, IBot} from "../Bot";

export class Viewer {
    /**
     * Current active and used ui
     * @member Mapillary.Viewer#
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

    // fixme ugly eventui test
    public eventUI: EventUI;

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
     * Creates a viewer instance
     * @class Viewer
     * @param {string} id - `id` of an DOM element which will be transformed into the viewer
     * @param {string} clientId -  Mapillary API Client ID
     * @param {IViewerOptions} options - Like `imageKey`, etc.
     */
    constructor (id: string, clientId: string, options: IViewerOptions) {
        let optionsParser: OptionsParser = new OptionsParser();
        this.options = optionsParser.parseAndDefaultOptions(options);

        this.uis = {};
        this.navigator = new Navigator(clientId);
        this.container = this.setupContainer(id);

        for (let i: number = 0; i < this.options.uis.length; i++) {
            let name: string = this.options.uis[i];
            let ui: IUI = new UI.uis[name](this.container, this.navigator);
            this.addUI(name, ui);
        }

        this.activeUis = {};

        this.eventUI = new EventUI(this.navigator);
        this.addUI("event", this.eventUI);
        this.activateUI("event");

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
     * @method
     * @param {string} name - UI on viewer
     */
    public activateUI(name: string): void {
        if (!(name in this.uis)) {
            throw new ParameterMapillaryError();
        }
        this.uis[name].activate();
        this.activeUis[name] = this.uis[name];
    }


    /**
     * Activate a Bot
     * @method
     * @param {IBot} bot - Bot which will be activated
     */
    public activateBot(bot: IBot): void {
        bot.activate(this.navigator);
    }

    /**
     * Add ui to the viewer
     * @method
     * @param {IActivatableUI} add ui to viewer
     */
    public addUI(name: string, ui: IUI): void {
        this.uis[name] = ui;
    }

    /**
     * Move to a photo key
     * @method
     * @param {string} key Mapillary photo key to move to
     * @throws {ParamaterMapillaryError} If no key is provided
     * @return {Promise}
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
     * Move in a given direction
     * @method
     * @param {Direction} dir - Direction towards which to move
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

    /**
     * Move close to given latitude and longitude
     * @method
     * @param {Number} lat - Latitude
     * @param {Number} lon - Longitude
     * @return {Promise}
     */
    public moveCloseTo(lat: number, lon: number): when.Promise<Node> {
        return when.promise((resolve: (value: any) => void, reject: (reason: any) => void): void => {
            this.navigator.moveCloseTo(lat, lon).first().subscribe((node: Node) => {
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


/**
 * Move end event.
 *
 * @event moveend
 * @memberof Viewer
 * @type {Object}
 * @property {TODO} TODO
 */

/**
 * Move start event.
 *
 * @event movestart
 * @memberof Viewer
 * @type {Object}
 * @property {TODO} TODO
 */

/**
 * Node change event
 *
 * @event nodechange
 * @memberof Viewer
 * @type {Object}
 * @property {TODO} TODO
 */

/**
 * Load event
 *
 * @event load
 * @memberof Viewer
 * @type {Object}
 * @property {TODO} TODO
 */
