import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/operator/publishReplay";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/startWith";

import {IComponentConfiguration} from "../Component";
import {Container, Navigator} from "../Viewer";
import {EventEmitter} from "../Utils";

export abstract class Component<TConfiguration extends IComponentConfiguration> extends EventEmitter {
    /**
     * Component name. Used when interacting with component through the Viewer's API.
     */
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
            this._configurationSubject$
                .startWith(this.defaultConfiguration)
                .scan(
                    (conf: TConfiguration, newConf: TConfiguration): TConfiguration => {
                        for (let key in newConf) {
                            if (newConf.hasOwnProperty(key)) {
                                conf[key] = <any>newConf[key];
                            }
                        }

                        return conf;
                    })
                .publishReplay(1)
                .refCount();

        this._configuration$.subscribe();
    }

    public get activated(): boolean {
        return this._activated;
    }

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

    public get configuration$(): Observable<TConfiguration> {
        return this._configuration$;
    }

    public activate(conf?: TConfiguration): void {
        if (this._activated) {
            return;
        }

        if (conf !== undefined) {
            this._configurationSubject$.next(conf);
        }

        this._activate();
        this._activated = true;
        this._activated$.next(true);
    };

    public configure(conf: TConfiguration): void {
        this._configurationSubject$.next(conf);
    }

    public deactivate(): void {
        if (!this._activated) {
            return;
        }

        this._deactivate();
        this._container.domRenderer.clear(this._name);
        this._container.glRenderer.clear(this._name);
        this._activated = false;
        this._activated$.next(false);
    };

    /**
     * Detect the viewer's new width and height and resize the component's
     * rendered elements accordingly if applicable.
     */
    public resize(): void { return; }

    protected abstract _activate(): void;

    protected abstract _deactivate(): void;

    protected abstract _getDefaultConfiguration(): TConfiguration;
}

export default Component;
