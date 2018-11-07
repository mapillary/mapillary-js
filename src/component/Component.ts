import {refCount, publishReplay, scan, startWith} from "rxjs/operators";
import {BehaviorSubject, Observable, Subject} from "rxjs";

import {IComponentConfiguration} from "../Component";
import {
    Container,
    Navigator,
} from "../Viewer";
import {EventEmitter} from "../Utils";

export abstract class Component<TConfiguration extends IComponentConfiguration> extends EventEmitter {
    public static componentName: string = "not_worthy";

    protected _activated: boolean;
    protected _container: Container;
    protected _name: string;
    protected _navigator: Navigator;

    protected _activated$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    protected _configuration$: Observable<TConfiguration>;
    protected _configurationSubject$: Subject<TConfiguration> = new Subject<TConfiguration>();

    constructor (name: string, container: Container, navigator: Navigator) {
        super();

        this._activated = false;
        this._container = container;
        this._name = name;
        this._navigator = navigator;

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

    public configure(conf: TConfiguration): void {
        this._configurationSubject$.next(conf);
    }

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

export default Component;
