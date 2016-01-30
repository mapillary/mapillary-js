import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {ICoverUIConfiguration, UIService, UIState} from "../UI";
import {IViewerOptions} from "../Viewer";

export class UIController {
    private _container: Container;
    private _navigator: Navigator;
    private _uiService: UIService;
    private _options: IViewerOptions;

    constructor(container: Container, navigator: Navigator, uiService: UIService, key: string, options: IViewerOptions) {
        this._container = container;
        this._navigator = navigator;
        this._uiService = uiService;
        this._options = options;

        this._uiService.uiState$.subscribe((uiState: UIState): void => {
            return;
        });

        this.uTrue(options.cover, "cover");
        this._uiService.configure("cover", {buttonClicked: this.handleCoverClick, key: key, loading: false, that: this, visible: true});
        this.uFalse(this._options.debug, "debug");
        this._uiService.configure("debug", {uiState$: this._uiService.uiState$});
    }

    public uFalse(option: boolean, name: string): void {
        if (option === undefined || option === false) {
            this._uiService.deactivate(name);
        }
        this._uiService.activate(name);
    }

    public uTrue(option: boolean, name: string): void {
        if (option === undefined || option === true) {
            this._uiService.activate(name);
            return;
        }
        this._uiService.deactivate(name);
    }

    private handleCoverClick(conf: ICoverUIConfiguration): void {
        let that: any = conf.that;
        that._uiService.configure("cover", {loading: true});
        that._navigator.moveToKey(conf.key).subscribe((node: Node) => {
            that._uiService.configure("cover", {visible: false});
            that.uTrue(that._options.attribution, "attribution");
            that.uTrue(that._options.cache, "cache");
            that.uTrue(that._options.directions, "directions");
            that.uTrue(that._options.keyboard, "keyboard");
            that.uTrue(that._options.loading, "loading");
            that.uTrue(that._options.mouse, "mouse");
            that.uTrue(that._options.gl, "gl");
        });
    }
}
