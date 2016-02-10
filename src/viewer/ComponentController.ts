import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {CoverComponent, ComponentService, ICoverConfiguration, Component} from "../Component";
import {IViewerOptions} from "../Viewer";

export class ComponentController {
    private _container: Container;
    private _coverComponent: CoverComponent;
    private _navigator: Navigator;
    private _componentService: ComponentService;
    private _options: IViewerOptions;
    private _key: string;

    constructor(container: Container, navigator: Navigator, key: string, options: IViewerOptions) {
        this._container = container;
        this._navigator = navigator;
        this._options = options;
        this._key = key;
        this._componentService = new ComponentService(this._container, this._navigator);

        if (key) {
            this.initializeComponents();
        } else {
            this._navigator.keyRequested$.filter((k: string) => { return k !== null; }).first().subscribe((k: string) => {
                this._navigator.stateService.start();
                this._navigator.stateService.currentNode$.first().subscribe((node: Node) => {
                    this._key = node.key;
                    this.initializeComponents();
                });
            });
        }
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

    private initializeComponents(): void {
        let options: IViewerOptions = this._options;

        this.uFalse(options.background, "background");
        this.uFalse(options.debug, "debug");
        this.uFalse(options.image, "image");
        this.uFalse(options.navigation, "navigation");
        this.uFalse(options.player, "player");
        this.uFalse(options.route, "route");
        this.uTrue(options.attribution, "attribution");
        this.uTrue(options.cache, "cache");
        this.uTrue(options.direction, "direction");
        this.uTrue(options.imageplane, "imageplane");
        this.uTrue(options.keyboard, "keyboard");
        this.uTrue(options.loading, "loading");
        this.uTrue(options.mouse, "mouse");

        this._coverComponent = <CoverComponent> this._componentService.getCover();

        this._coverComponent.configure({key: this._key});
        if (options.cover === undefined || options.cover) {
            this.activateCover();
        } else {
            this.deactivateCover();
        }

        this._coverComponent.configuration$.subscribe((conf: ICoverConfiguration) => {
            if (conf.loading) {
                this._navigator.moveToKey(conf.key).subscribe((node: Node) => {
                    this._navigator.stateService.start();
                    this._coverComponent.configure({loading: false, visible: false});
                    this._componentService.deactivateCover();
                });
            } else if (conf.visible) {
                this._navigator.stateService.stop();
                this._componentService.activateCover();
            }
        });
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
