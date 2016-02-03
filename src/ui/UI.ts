import {IUIConfiguration} from "../UI";
import {Container, Navigator} from "../Viewer";

import * as rx from "rx";

export abstract class UI {
    public static uiName: string = "not_worthy";

    protected _activated: boolean;
    protected _configurationSubject$: rx.Subject<IUIConfiguration> = new rx.Subject<IUIConfiguration>();
    protected _configuration$: rx.Observable<IUIConfiguration>;
    protected _container: Container;
    protected _name: string;
    protected _navigator: Navigator;

    constructor (name: string, container: Container, navigator: Navigator) {
        this._navigator = navigator;
        this._container = container;
        this._activated = false;
        this._name = name;

        this._configuration$ =
            this._configurationSubject$.scan<IUIConfiguration>(
                (conf: IUIConfiguration, newConf: IUIConfiguration): IUIConfiguration => {
                    for (let key in newConf) {
                        if (newConf.hasOwnProperty(key)) {
                            conf[key] = <any>newConf[key];
                        }
                    }
                    return conf;
                }).shareReplay(1);
        this._configuration$.subscribe();
    }

    public activate(conf?: IUIConfiguration): void {
        if (this._activated) {
            return;
        }

        if (conf === undefined) {
            this._configurationSubject$.onNext(this.defaultConfiguration);
        } else {
            this._configurationSubject$.onNext(conf);
        }

        this._activate();
        this._activated = true;
    };

    protected abstract _activate(): void;

    public deactivate(): void {
        if (!this._activated) {
            return;
        }

        this._container.domRenderer.clear(this._name);
        this._container.glRenderer.clear(this._name);
        this._deactivate();
        this._activated = false;
    };

    protected abstract _deactivate(): void;

    public get activated(): boolean {
        return this._activated;
    }

    public configure(conf: IUIConfiguration): void {
        this._configurationSubject$.onNext(conf);
    }

    public get defaultConfiguration(): IUIConfiguration {
        return {};
    }

    public get configuration$(): rx.Observable<IUIConfiguration> {
        return this._configuration$;
    }
}

export default UI;
