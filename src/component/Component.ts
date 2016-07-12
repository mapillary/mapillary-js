import {IComponentConfiguration} from "../Component";
import {Container, Navigator} from "../Viewer";
import {EventEmitter} from "../Utils";

import "rxjs/add/operator/publishReplay";
import "rxjs/add/operator/scan";
import "rxjs/add/operator/startWith";

import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

export abstract class Component extends EventEmitter {
    /**
     * Component name. Used when interacting with component through the Viewer's API.
     */
    public static componentName: string = "not_worthy";

    protected _activated: boolean;
    protected _container: Container;
    protected _name: string;
    protected _navigator: Navigator;

    protected _activated$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    protected _configurationSubject$: Subject<IComponentConfiguration> = new Subject<IComponentConfiguration>();
    protected _configuration$: Observable<IComponentConfiguration>;

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

    public get defaultConfiguration(): IComponentConfiguration {
        return {};
    }

    public get configuration$(): Observable<IComponentConfiguration> {
        return this._configuration$;
    }

    public activate(conf?: IComponentConfiguration): void {
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

    public configure(conf: IComponentConfiguration): void {
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
}

export default Component;
