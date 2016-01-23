import {EdgeDirection} from "../Edge";
import {IViewerOptions, Container, Navigator, UIService} from "../Viewer";
// import {EventUI, IUI} from "../UI";
import {EventEmitter, Settings} from "../Utils";

export class Viewer extends EventEmitter {
    /**
     * Container handling the space occupied by the viewer
     * @private
     * @type {Container}
     */
    private container: Container;

    /**
     * Navigator used to Navigate the vast seas of Mapillary
     * @private
     * @type {Navigator}
     */
    private navigator: Navigator;

    /**
     * Service used to keep track of UIs
     * @private
     * @type {Navigator}
     */
    private uiService: UIService;

    /**
     * Creates a viewer instance
     * @class Viewer
     * @param {string} id - `id` of an DOM element which will be transformed into the viewer
     * @param {string} clientId -  Mapillary API Client ID
     * @param {IViewerOptions} options - Like `imageKey`, etc.
     */
    constructor (id: string, clientId: string, options: IViewerOptions) {
        this.navigator = new Navigator(clientId);
        this.container = new Container(id, options.key, this.navigator.stateService.currentState$);
        this.uiService = new UIService(this, this.container, this.navigator);

        Settings.setOptions({});

        for (let name of options.uis) {
            this.uiService.activate(name);
        }

        this.uiService.get("event").configure({eventEmitter: this});
        this.uiService.activate("event");

        if (options.key != null) {
            this.moveToKey(options.key);
        }

        super();
    }

    /**
     * Move to a photo key
     * @method
     * @param {string} key Mapillary photo key to move to
     * @throws {ParamaterMapillaryError} If no key is provided
     */
    public moveToKey(key: string): void {
        this.navigator.moveToKey(key).first().subscribe();
    }

    /**
     * Move in a given direction
     * @method
     * @param {Direction} dir - Direction towards which to move
     */
    public moveDir(dir: EdgeDirection): void {
        this.navigator.moveDir(dir).first().subscribe();
    }

    /**
     * Move close to given latitude and longitude
     * @method
     * @param {Number} lat - Latitude
     * @param {Number} lon - Longitude
     */
    public moveCloseTo(lat: number, lon: number): void {
        this.navigator.moveCloseTo(lat, lon).first().subscribe();
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
 * The loading state changed
 *
 * @event loadingchanged
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
