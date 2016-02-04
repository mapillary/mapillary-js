import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {CoverUI, UIService, ICoverUIConfiguration, UI} from "../UI";
import {IViewerOptions} from "../Viewer";

export class UIController {
    private _container: Container;
    private _coverUI: CoverUI;
    private _navigator: Navigator;
    private _uiService: UIService;

    constructor(container: Container, navigator: Navigator, key: string, options: IViewerOptions) {
        this._container = container;
        this._navigator = navigator;
        this._uiService = new UIService(this._container, this._navigator);

        this.uFalse(options.debug, "debug");
        this.uFalse(options.player, "player");
        this.uFalse(options.navigation, "navigation");
        this.uTrue(options.attribution, "attribution");
        this.uTrue(options.cache, "cache");
        this.uTrue(options.directions, "directions");
        this.uTrue(options.keyboard, "keyboard");
        this.uTrue(options.loading, "loading");
        this.uTrue(options.mouse, "mouse");
        this.uTrue(options.gl, "gl");

        this._coverUI = <CoverUI> this._uiService.getCover();

        this._coverUI.configure({key: key});
        if (options.cover === undefined || options.cover) {
            this.activateCover();
        } else {
            this.deactivateCover();
        }

        this._coverUI.configuration$.subscribe((conf: ICoverUIConfiguration) => {
            if (conf.loading) {
                this._navigator.moveToKey(conf.key).subscribe((node: Node) => {
                    this._coverUI.configure({loading: false, visible: false});
                    this._uiService.deactivateCover();
                });
            } else if (conf.visible) {
                this._uiService.activateCover();
            }
        });
    }

    public activateCover(): void {
        this._coverUI.configure({loading: false, visible: true});
    }

    public deactivateCover(): void {
        this._coverUI.configure({loading: true, visible: true});
    }

    public activate(name: string): void {
        this._uiService.activate(name);
    }

    public deactivate(name: string): void {
        this._uiService.deactivate(name);
    }

    public get(name: string): UI {
        return this._uiService.get(name);
    }

    private uFalse(option: boolean, name: string): void {
        if (option === undefined) {
            this._uiService.deactivate(name);
            return;
        }
        if (typeof option === "boolean") {
            if (option) {
                this._uiService.activate(name);
            } else {
                this._uiService.deactivate(name);
            }
            return;
        }
        this._uiService.configure(name, option);
        this._uiService.activate(name);
    }

    private uTrue(option: boolean, name: string): void {
        if (option === undefined) {
            this._uiService.activate(name);
            return;
        }
        if (typeof option === "boolean") {
            if (option) {
                this._uiService.activate(name);
            } else {
                this._uiService.deactivate(name);
            }
            return;
        }
        this._uiService.configure(name, option);
        this._uiService.activate(name);
    }
}
