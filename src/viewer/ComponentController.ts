import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {CoverComponent, ComponentService, ICoverConfiguration, Component} from "../Component";
import {IViewerOptions} from "../Viewer";

export class ComponentController {
    private _container: Container;
    private _coverComponent: CoverComponent;
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
        this.uTrue(options.direction, "direction");
        this.uTrue(options.keyboard, "keyboard");
        this.uTrue(options.loading, "loading");
        this.uTrue(options.mouse, "mouse");
        this.uTrue(options.imageplane, "imageplane");

        this._coverComponent = <CoverComponent> this._componentService.getCover();

        this._coverComponent.configure({key: key});
        if (options.cover === undefined || options.cover) {
            this.activateCover();
        } else {
            this.deactivateCover();
        }

        this._coverComponent.configuration$.subscribe((conf: ICoverConfiguration) => {
            if (conf.loading) {
                this._navigator.moveToKey(conf.key).subscribe((node: Node) => {
                    this._coverComponent.configure({loading: false, visible: false});
                    this._componentService.deactivateCover();
                });
            } else if (conf.visible) {
                this._componentService.activateCover();
            }
        });
    }

    public activateCover(): void {
        this._coverComponent.configure({loading: false, visible: true});
    }

    public deactivateCover(): void {
        this._coverComponent.configure({loading: true, visible: true});
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
