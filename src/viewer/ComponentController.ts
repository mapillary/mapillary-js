import {first, switchMap, distinctUntilChanged} from "rxjs/operators";
import {Observable} from "rxjs";

import {Node} from "../Graph";
import {
    Component,
    ComponentService,
    CoverComponent,
    CoverState,
    IComponentConfiguration,
    ICoverConfiguration,
} from "../Component";
import {
    Container,
    IComponentOptions,
    Navigator,
    Observer,
} from "../Viewer";

export class ComponentController {
    private _container: Container;
    private _coverComponent: CoverComponent;
    private _observer: Observer;
    private _navigator: Navigator;
    private _componentService: ComponentService;
    private _options: IComponentOptions;
    private _key: string;
    private _navigable: boolean;

    constructor(
        container: Container,
        navigator: Navigator,
        observer: Observer,
        key: string,
        options: IComponentOptions,
        componentService?: ComponentService) {
        this._container = container;
        this._observer = observer;
        this._navigator = navigator;
        this._options = options != null ? options : {};
        this._key = key;
        this._navigable = key == null;
        this._componentService = !!componentService ?
            componentService :
            new ComponentService(this._container, this._navigator);

        this._coverComponent = this._componentService.getCover();

        this._initializeComponents();

        if (key) {
            this._initilizeCoverComponent();
            this._subscribeCoverComponent();
        } else {
            this._navigator.movedToKey$.pipe(
                first(
                    (k: string): boolean => {
                        return k != null;
                    }))
                .subscribe(
                    (k: string): void => {
                        this._key = k;
                        this._componentService.deactivateCover();
                        this._coverComponent.configure({ key: this._key, state: CoverState.Hidden });
                        this._subscribeCoverComponent();
                        this._navigator.stateService.start();
                        this._navigator.cacheService.start();
                        this._navigator.panService.start();
                        this._observer.startEmit();
                    });
        }
    }

    public get navigable(): boolean {
        return this._navigable;
    }

    public get<TComponent extends Component<IComponentConfiguration>>(name: string): TComponent {
        return this._componentService.get<TComponent>(name);
    }

    public activate(name: string): void {
        this._componentService.activate(name);
    }

    public activateCover(): void {
        this._coverComponent.configure({ state: CoverState.Visible });
    }

    public deactivate(name: string): void {
        this._componentService.deactivate(name);
    }

    public deactivateCover(): void {
        this._coverComponent.configure({ state: CoverState.Loading });
    }

    private _initializeComponents(): void {
        let options: IComponentOptions = this._options;

        this._uFalse(options.background, "background");
        this._uFalse(options.debug, "debug");
        this._uFalse(options.image, "image");
        this._uFalse(options.marker, "marker");
        this._uFalse(options.navigation, "navigation");
        this._uFalse(options.popup, "popup");
        this._uFalse(options.route, "route");
        this._uFalse(options.slider, "slider");
        this._uFalse(options.spatialData, "spatialData");
        this._uFalse(options.tag, "tag");

        this._uTrue(options.attribution, "attribution");
        this._uTrue(options.bearing, "bearing");
        this._uTrue(options.cache, "cache");
        this._uTrue(options.direction, "direction");
        this._uTrue(options.imagePlane, "imagePlane");
        this._uTrue(options.keyboard, "keyboard");
        this._uTrue(options.loading, "loading");
        this._uTrue(options.mouse, "mouse");
        this._uTrue(options.sequence, "sequence");
        this._uTrue(options.stats, "stats");
        this._uTrue(options.zoom, "zoom");
    }

    private _initilizeCoverComponent(): void {
        let options: IComponentOptions = this._options;

        this._coverComponent.configure({ key: this._key });
        if (options.cover === undefined || options.cover) {
            this.activateCover();
        } else {
            this.deactivateCover();
        }
    }

    private _setNavigable(navigable: boolean): void {
        if (this._navigable === navigable) {
            return;
        }

        this._navigable = navigable;
        this._observer.navigable$.next(navigable);
    }

    private _subscribeCoverComponent(): void {
        this._coverComponent.configuration$.pipe(
            distinctUntilChanged(
                undefined,
                (c: ICoverConfiguration): CoverState => {
                    return c.state;
                }))
        .subscribe((conf: ICoverConfiguration) => {
            if (conf.state === CoverState.Loading) {
                this._navigator.stateService.currentKey$.pipe(
                    first(),
                    switchMap(
                        (key: string): Observable<Node> => {
                            const keyChanged: boolean = key == null || key !== conf.key;

                            if (keyChanged) {
                                this._setNavigable(false);
                            }

                            return keyChanged ?
                                this._navigator.moveToKey$(conf.key) :
                                this._navigator.stateService.currentNode$.pipe(
                                    first());
                        }))
                    .subscribe(
                        (): void => {
                            this._navigator.stateService.start();
                            this._navigator.cacheService.start();
                            this._navigator.panService.start();
                            this._observer.startEmit();
                            this._coverComponent.configure({ state: CoverState.Hidden });
                            this._componentService.deactivateCover();
                            this._setNavigable(true);
                        },
                        (error: Error): void => {
                            console.error("Failed to deactivate cover.", error);

                            this._coverComponent.configure({ state: CoverState.Visible });
                        });
            } else if (conf.state === CoverState.Visible) {
                this._observer.stopEmit();
                this._navigator.stateService.stop();
                this._navigator.cacheService.stop();
                this._navigator.playService.stop();
                this._navigator.panService.stop();
                this._componentService.activateCover();
                this._setNavigable(conf.key == null);
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
