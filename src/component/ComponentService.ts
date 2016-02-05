import {ParameterMapillaryError} from "../Error";
import {Container, Navigator} from "../Viewer";
import {CoverUI, Component, IComponentConfiguration} from "../Component";

import * as _ from "underscore";

interface IActiveComponent {
    active: boolean;
    component: Component;
}

export class ComponentService {
    public static registeredCoverUI: typeof CoverUI;
    public static registeredComponents: {[key: string]: typeof Component} = {};

    private _container: Container;
    private _coverActivated: boolean;
    private _coverUI: CoverUI;
    private _navigator: Navigator;
    private _components: {[key: string]: IActiveComponent} = {};

    constructor (container: Container, navigator: Navigator) {
        this._container = container;
        this._navigator = navigator;

        for (let component of _.values(ComponentService.registeredComponents)) {
            this._components[component.componentName] = {
                active: false,
                component: new component(component.componentName, container, navigator),
            };
        }

        this._coverUI = new ComponentService.registeredCoverUI("cover", container, navigator);
        this._coverUI.activate();
        this._coverActivated = true;
    }

    public static register(component: typeof Component): void {
        if (ComponentService.registeredComponents[component.componentName] === undefined) {
            ComponentService.registeredComponents[component.componentName] = component;
        }
    }

    public static registerCover(coverUI: typeof CoverUI): void {
        ComponentService.registeredCoverUI = coverUI;
    }

    public activateCover(): void {
        if (this._coverActivated) {
            return;
        }
        this._coverActivated = true;

        for (let component of _.values(this._components)) {
            if (component.active) {
                component.component.deactivate();
            }
        }
        return;
    }

    public deactivateCover(): void {
        if (!this._coverActivated) {
            return;
        }
        this._coverActivated = false;

        for (let component of _.values(this._components)) {
            if (component.active) {
                component.component.activate();
            }
        }
        return;
    }

    public activate(name: string): void {
        this.checkName(name);
        this._components[name].active = true;
        if (!this._coverActivated) {
            this.get(name).activate();
        }
    }

    public configure(name: string, conf: IComponentConfiguration): void {
        this.checkName(name);
        this.get(name).configure(conf);
    }

    public deactivate(name: string): void {
        this.checkName(name);
        this._components[name].active = false;
        if (!this._coverActivated) {
            this.get(name).deactivate();
        }
    }

    public get(name: string): Component {
        return this._components[name].component;
    }

    public getCover(): CoverUI {
        return this._coverUI;
    }

    private checkName(name: string): void {
        if (!(name in this._components)) {
            throw new ParameterMapillaryError(`Component does not exist: ${name}`);
        }
    }
}

export default ComponentService;
