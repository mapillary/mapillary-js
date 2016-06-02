import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {CoverComponent, ComponentService, ICoverConfiguration, Component, IComponentConfiguration} from "../Component";
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
            this._initializeComponents();
        } else {
            this._navigator.loadingService.loading$
                .filter((loading: boolean) => { return loading; }).first().subscribe((loading: boolean) => {
                    this._navigator.stateService.start();
                    this._navigator.stateService.currentNode$.first().subscribe((node: Node) => {
                        this._key = node.key;
                        this._initializeComponents();
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

    public resize(): void {
        this._componentService.resize();
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

    private _initializeComponents(): void {
        let options: IViewerOptions = this._options;

        this._uFalse(options.background, "background");
        this._uFalse(options.debug, "debug");
        this._uFalse(options.detection, "detection");
        this._uFalse(options.tag, "tag");
        this._uFalse(options.image, "image");
        this._uFalse(options.marker, "marker");
        this._uFalse(options.navigation, "navigation");
        this._uFalse(options.player, "player");
        this._uFalse(options.route, "route");
        this._uFalse(options.slider, "slider");
        this._uTrue(options.attribution, "attribution");
        this._uTrue(options.cache, "cache");
        this._uTrue(options.direction, "direction");
        this._uTrue(options.imageplane, "imageplane");
        this._uTrue(options.keyboard, "keyboard");
        this._uTrue(options.loading, "loading");
        this._uTrue(options.mouse, "mouse");
        this._uTrue(options.sequence, "sequence");

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

    private _uFalse(option: boolean | IComponentConfiguration, name: string): void {
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
        this._componentService.configure(name, <IComponentConfiguration>option);
        this._componentService.activate(name);
    }

    private _uTrue(option: boolean | IComponentConfiguration, name: string): void {
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
        this._componentService.configure(name, <IComponentConfiguration>option);
        this._componentService.activate(name);
    }
}
