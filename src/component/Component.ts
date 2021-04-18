import {
    publishReplay,
    refCount,
    scan,
    startWith,
} from "rxjs/operators";

import {
    BehaviorSubject,
    Observable,
    Subject,
} from "rxjs";

import { ComponentConfiguration } from "./interfaces/ComponentConfiguration";

import { Container } from "../viewer/Container";
import { Navigator } from "../viewer/Navigator";
import { EventEmitter } from "../util/EventEmitter";
import { SubscriptionHolder } from "../util/SubscriptionHolder";
import { IComponent } from "./interfaces/IComponent";
import { ComponentEventType } from "./events/ComponentEventType";
import { ComponentName } from "./ComponentName";
import { FallbackComponentName } from "./fallback/FallbackComponentName";

export abstract class Component
    <TConfiguration extends ComponentConfiguration>
    extends EventEmitter
    implements IComponent {

    public static componentName: ComponentName | FallbackComponentName;

    protected _activated: boolean;
    protected _container: Container;
    protected _name: string;
    protected _navigator: Navigator;
    protected readonly _subscriptions: SubscriptionHolder;

    protected _activated$: BehaviorSubject<boolean> =
        new BehaviorSubject<boolean>(false);
    protected _configuration$: Observable<TConfiguration>;
    protected _configurationSubject$: Subject<TConfiguration> =
        new Subject<TConfiguration>();

    constructor(name: string, container: Container, navigator: Navigator) {
        super();

        this._activated = false;
        this._container = container;
        this._name = name;
        this._navigator = navigator;
        this._subscriptions = new SubscriptionHolder();

        this._configuration$ =
            this._configurationSubject$.pipe(
                startWith(this.defaultConfiguration),
                scan(
                    (conf: TConfiguration, newConf: TConfiguration): TConfiguration => {
                        for (let key in newConf) {
                            if (newConf.hasOwnProperty(key)) {
                                conf[key] = <any>newConf[key];
                            }
                        }

                        return conf;
                    }),
                publishReplay(1),
                refCount());

        this._configuration$.subscribe(() => { /*noop*/ });
    }

    /**
     * Get activated.
     *
     * @returns {boolean} Value indicating if the component is
     * currently active.
     */
    public get activated(): boolean {
        return this._activated;
    }

    /** @ignore */
    public get activated$(): Observable<boolean> {
        return this._activated$;
    }

    /**
     * Get default configuration.
     *
     * @returns {TConfiguration} Default configuration for component.
     */
    public get defaultConfiguration(): TConfiguration {
        return this._getDefaultConfiguration();
    }

    /** @ignore */
    public get configuration$(): Observable<TConfiguration> {
        return this._configuration$;
    }

    /**
     * Get name.
     *
     * @description The name of the component. Used when interacting with the
     * component through the Viewer's API.
     */
    public get name(): string {
        return this._name;
    }

    /** @ignore */
    public activate(conf?: TConfiguration): void {
        if (this._activated) {
            return;
        }

        if (conf !== undefined) {
            this._configurationSubject$.next(conf);
        }

        this._activated = true;
        this._activate();
        this._activated$.next(true);
    }

    /**
     * Configure the component.
     *
     * @param configuration Component configuration.
     */
    public configure(configuration: TConfiguration): void {
        this._configurationSubject$.next(configuration);
    }

    /** @ignore */
    public deactivate(): void {
        if (!this._activated) {
            return;
        }

        this._activated = false;
        this._deactivate();
        this._container.domRenderer.clear(this._name);
        this._container.glRenderer.clear(this._name);
        this._activated$.next(false);
    }

    /** @inheritdoc */
    public fire<T>(
        type: ComponentEventType,
        event: T): void {
        super.fire(type, event);
    }

    /** @inheritdoc */
    public off<T>(
        type: ComponentEventType,
        handler: (event: T) => void): void {
        super.off(type, handler);
    }

    /** @inheritdoc */
    public on<T>(
        type: ComponentEventType,
        handler: (event: T) => void): void {
        super.on(type, handler);
    }

    /**
     * Detect the viewer's new width and height and resize the component's
     * rendered elements accordingly if applicable.
     *
     * @ignore
     */
    public resize(): void { return; }

    protected abstract _activate(): void;

    protected abstract _deactivate(): void;

    protected abstract _getDefaultConfiguration(): TConfiguration;
}
