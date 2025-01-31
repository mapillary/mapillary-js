import {
    distinctUntilChanged,
    first,
    switchMap,
} from "rxjs/operators";

import {
    Observable,
    Subscription,
} from "rxjs";

import { Container } from "./Container";
import { Navigator } from "./Navigator";
import { Observer } from "./Observer";
import { ComponentOptions } from "./options/ComponentOptions";

import { Component } from "../component/Component";
import { ComponentService } from "../component/ComponentService";
import { CoverComponent } from "../component/cover/CoverComponent";
import { ComponentConfiguration }
    from "../component/interfaces/ComponentConfiguration";
import { CoverConfiguration }
    from "../component/interfaces/CoverConfiguration";
import { Image } from "../graph/Image";
import { CoverState } from "../component/cover/CoverState";
import { FallbackComponentName } from "../component/fallback/FallbackComponentName";
import { ComponentName } from "../component/ComponentName";

export class ComponentController {
    private _container: Container;
    private _coverComponent: CoverComponent;
    private _observer: Observer;
    private _navigator: Navigator;
    private _componentService: ComponentService;
    private _options: ComponentOptions;
    private _key: string;
    private _navigable: boolean;
    private _configurationSubscription: Subscription;

    constructor(
        container: Container,
        navigator: Navigator,
        observer: Observer,
        key: string,
        options: ComponentOptions,
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
            this._navigator.movedToId$.pipe(
                first(
                    (k: string): boolean => {
                        return k != null;
                    }))
                .subscribe(
                    (k: string): void => {
                        this._key = k;
                        this._componentService.deactivateCover();
                        this._coverComponent.configure({
                            id: this._key,
                            state: CoverState.Hidden,
                        });
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

    public get<TComponent extends Component<ComponentConfiguration>>(name: string): TComponent {
        return this._componentService.get<TComponent>(name);
    }

    public activate(name: ComponentName | FallbackComponentName): void {
        this._componentService.activate(name);
    }

    public activateCover(): void {
        this._coverComponent.configure({ state: CoverState.Visible });
    }

    public deactivate(name: ComponentName | FallbackComponentName): void {
        this._componentService.deactivate(name);
    }

    public deactivateCover(): void {
        this._coverComponent.configure({ state: CoverState.Loading });
    }

    public remove(): void {
        this._componentService.remove();

        if (this._configurationSubscription != null) {
            this._configurationSubscription.unsubscribe();
        }
    }

    private _initializeComponents(): void {
        const options = this._options;

        this._uFalse(options.fallback?.image, "imagefallback");
        this._uFalse(options.fallback?.navigation, "navigationfallback");

        this._uFalse(options.marker, "marker");
        this._uFalse(options.popup, "popup");
        this._uFalse(options.slider, "slider");
        this._uFalse(options.spatial, "spatial");
        this._uFalse(options.tag, "tag");

        this._uTrue(options.attribution, "attribution");
        this._uTrue(options.bearing, "bearing");
        this._uTrue(options.cache, "cache");
        this._uTrue(options.direction, "direction");
        this._uTrue(options.image, "image");
        this._uTrue(options.keyboard, "keyboard");
        this._uTrue(options.pointer, "pointer");
        this._uTrue(options.sequence, "sequence");
        this._uTrue(options.zoom, "zoom");
    }

    private _initilizeCoverComponent(): void {
        let options: ComponentOptions = this._options;

        this._coverComponent.configure({ id: this._key });
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
        this._configurationSubscription =
            this._coverComponent.configuration$.pipe(
                distinctUntilChanged(
                    undefined,
                    (c: CoverConfiguration): CoverState => {
                        return c.state;
                    }))
                .subscribe((conf: CoverConfiguration) => {
                    if (conf.state === CoverState.Loading) {
                        this._navigator.stateService.currentId$.pipe(
                            first(),
                            switchMap(
                                (key: string): Observable<Image> => {
                                    const keyChanged: boolean = key == null || key !== conf.id;

                                    if (keyChanged) {
                                        this._setNavigable(false);
                                    }

                                    return keyChanged ?
                                        this._navigator.moveTo$(conf.id) :
                                        this._navigator.stateService.currentImage$.pipe(
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
                        this._setNavigable(conf.id == null);
                    }
                });
    }

    private _uFalse<TConfiguration extends ComponentConfiguration>(
        option: boolean | TConfiguration,
        name: ComponentName | FallbackComponentName): void {
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

    private _uTrue<TConfiguration extends ComponentConfiguration>(
        option: boolean | TConfiguration,
        name: ComponentName | FallbackComponentName): void {
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
