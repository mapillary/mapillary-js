import {IComponentConfiguration} from "../Component";
import {Container, Navigator} from "../Viewer";
import {EventEmitter} from "../Utils";

import * as rx from "rx";

export abstract class Component extends EventEmitter {
    /**
     * Component name. Used when interacting with component through the Viewer's API.
     */
    public static componentName: string = "not_worthy";

    protected _activated: boolean;
    protected _activated$: rx.BehaviorSubject<boolean> = new rx.BehaviorSubject<boolean>(false);
    protected _configurationSubject$: rx.Subject<IComponentConfiguration> = new rx.Subject<IComponentConfiguration>();
    protected _configuration$: rx.Observable<IComponentConfiguration>;
    protected _container: Container;
    protected _name: string;
    protected _navigator: Navigator;

    constructor (name: string, container: Container, navigator: Navigator) {
        super();

        this._navigator = navigator;
        this._container = container;
        this._activated = false;
        this._name = name;

        this._configuration$ =
            this._configurationSubject$
                .startWith(this.defaultConfiguration)
                .scan<IComponentConfiguration>(
                    (conf: IComponentConfiguration, newConf: IComponentConfiguration): IComponentConfiguration => {
                        for (let key in newConf) {
                            if (newConf.hasOwnProperty(key)) {
                                conf[key] = <any>newConf[key];
                            }
                        }

                        return conf;
                    })
                .shareReplay(1);

        this._configuration$.subscribe();
    }

    public get activated(): boolean {
        return this._activated;
    }

    public get activated$(): rx.Observable<boolean> {
        return this._activated$;
    }

    public get defaultConfiguration(): IComponentConfiguration {
        return {};
    }

    public get configuration$(): rx.Observable<IComponentConfiguration> {
        return this._configuration$;
    }

    public activate(conf?: IComponentConfiguration): void {
        if (this._activated) {
            return;
        }

        if (conf !== undefined) {
            this._configurationSubject$.onNext(conf);
        }

        this._activate();
        this._activated = true;
        this._activated$.onNext(true);
    };

    public configure(conf: IComponentConfiguration): void {
        this._configurationSubject$.onNext(conf);
    }

    public deactivate(): void {
        if (!this._activated) {
            return;
        }

        this._deactivate();
        this._container.domRenderer.clear(this._name);
        this._container.glRenderer.clear(this._name);
        this._activated = false;
        this._activated$.onNext(false);
    };

    /**
     * Detect the viewer's new width and height and resize the component's
     * rendered elements accordingly if applicable.
     */
    public resize(): void { return; }

    protected abstract _activate(): void;

    protected abstract _deactivate(): void;
}

export default Component;
