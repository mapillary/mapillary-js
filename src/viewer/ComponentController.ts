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
        this._coverComponent = this._componentService.getCover();

        this._initializeComponents();

        if (key) {
            this._initilizeCoverComponent();
            this._subscribeCoverComponent();
        } else {
            this._navigator.movedToKey$
                .first()
                .subscribe(
                    (movedToKey: string): void => {
                        this._key = movedToKey;
                        this._componentService.deactivateCover();
                        this._coverComponent.configure({ key: this._key, loading: false, visible: false });
                        this._subscribeCoverComponent();
                        this._navigator.stateService.start();
                    });
        }
    }

    public get<TComponent extends Component<IComponentConfiguration>>(name: string): TComponent {
        return this._componentService.get<TComponent>(name);
    }

    public activate(name: string): void {
        this._componentService.activate(name);
    }

    public activateCover(): void {
        this._coverComponent.configure({ loading: false, visible: true });
    }

    public deactivate(name: string): void {
        this._componentService.deactivate(name);
    }

    public deactivateCover(): void {
        this._coverComponent.configure({ loading: true, visible: true });
    }

    public resize(): void {
        this._componentService.resize();
    }

    private _initializeComponents(): void {
        let options: IViewerOptions = this._options;

        this._uFalse(options.background, "background");
        this._uFalse(options.debug, "debug");
        this._uFalse(options.image, "image");
        this._uFalse(options.marker, "marker");
        this._uFalse(options.navigation, "navigation");
        this._uFalse(options.route, "route");
        this._uFalse(options.slider, "slider");
        this._uFalse(options.stats, "stats");
        this._uFalse(options.tag, "tag");

        this._uTrue(options.attribution, "attribution");
        this._uTrue(options.bearing, "bearing");
        this._uTrue(options.cache, "cache");
        this._uTrue(options.direction, "direction");
        this._uTrue(options.imageplane, "imageplane");
        this._uTrue(options.keyboard, "keyboard");
        this._uTrue(options.loading, "loading");
        this._uTrue(options.mouse, "mouse");
        this._uTrue(options.sequence, "sequence");
    }

    private _initilizeCoverComponent(): void {
        let options: IViewerOptions = this._options;

        this._coverComponent.configure({ key: this._key });
        if (options.cover === undefined || options.cover) {
            this.activateCover();
        } else {
            this.deactivateCover();
        }
    }

    private _subscribeCoverComponent(): void {
        this._coverComponent.configuration$.subscribe((conf: ICoverConfiguration) => {
            if (conf.loading) {
                this._navigator.moveToKey(conf.key).subscribe((node: Node) => {
                    this._navigator.stateService.start();
                    this._coverComponent.configure({ loading: false, visible: false });
                    this._componentService.deactivateCover();
                });
            } else if (conf.visible) {
                this._navigator.stateService.stop();
                this._componentService.activateCover();
            }
        });
    }

    private _uFalse<TConfiguration extends IComponentConfiguration>(option: boolean | TConfiguration, name: string): void {
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
        this._componentService.configure(name, <TConfiguration>option);
        this._componentService.activate(name);
    }

    private _uTrue<TConfiguration extends IComponentConfiguration>(option: boolean | TConfiguration, name: string): void {
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
        this._componentService.configure(name, <TConfiguration>option);
        this._componentService.activate(name);
    }
}
