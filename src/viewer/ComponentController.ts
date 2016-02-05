import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {CoverUI, ComponentService, ICoverUIConfiguration, Component} from "../Component";
import {IViewerOptions} from "../Viewer";

export class ComponentController {
    private _container: Container;
    private _coverUI: CoverUI;
    private _navigator: Navigator;
    private _componentService: ComponentService;

    constructor(container: Container, navigator: Navigator, key: string, options: IViewerOptions) {
        this._container = container;
        this._navigator = navigator;
        this._componentService = new ComponentService(this._container, this._navigator);

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

        this._coverUI = <CoverUI> this._componentService.getCover();

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
                    this._componentService.deactivateCover();
                });
            } else if (conf.visible) {
                this._componentService.activateCover();
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
        this._componentService.activate(name);
    }

    public deactivate(name: string): void {
        this._componentService.deactivate(name);
    }

    public get(name: string): Component {
        return this._componentService.get(name);
    }

    private uFalse(option: boolean, name: string): void {
        if (option === undefined) {
            this._componentService.deactivate(name);
            return;
        }
        if (typeof option === "boolean") {
            if (option) {
                this._componentService.activate(name);
            } else {
                this._componentService.deactivate(name);
            }
            return;
        }
        this._componentService.configure(name, option);
        this._componentService.activate(name);
    }

    private uTrue(option: boolean, name: string): void {
        if (option === undefined) {
            this._componentService.activate(name);
            return;
        }
        if (typeof option === "boolean") {
            if (option) {
                this._componentService.activate(name);
            } else {
                this._componentService.deactivate(name);
            }
            return;
        }
        this._componentService.configure(name, option);
        this._componentService.activate(name);
    }
}
