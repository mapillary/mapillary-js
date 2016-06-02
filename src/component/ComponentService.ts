import {ParameterMapillaryError} from "../Error";
import {Container, Navigator} from "../Viewer";
import {CoverComponent, Component, IComponentConfiguration} from "../Component";

import * as _ from "underscore";

interface IActiveComponent {
    active: boolean;
    component: Component;
}

export class ComponentService {
    public static registeredCoverComponent: typeof CoverComponent;
    public static registeredComponents: {[key: string]: typeof Component} = {};

    private _container: Container;
    private _coverActivated: boolean;
    private _coverComponent: CoverComponent;
    private _navigator: Navigator;
    private _components: {[key: string]: IActiveComponent} = {};

    public static register(component: typeof Component): void {
        if (ComponentService.registeredComponents[component.componentName] === undefined) {
            ComponentService.registeredComponents[component.componentName] = component;
        }
    }

    public static registerCover(coverComponent: typeof CoverComponent): void {
        ComponentService.registeredCoverComponent = coverComponent;
    }

    constructor (container: Container, navigator: Navigator) {
        this._container = container;
        this._navigator = navigator;

        for (let component of _.values(ComponentService.registeredComponents)) {
            this._components[component.componentName] = {
                active: false,
                component: new component(component.componentName, container, navigator),
            };
        }

        this._coverComponent = new ComponentService.registeredCoverComponent("cover", container, navigator);
        this._coverComponent.activate();
        this._coverActivated = true;
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
        this._checkName(name);
        this._components[name].active = true;
        if (!this._coverActivated) {
            this.get(name).activate();
        }
    }

    public configure(name: string, conf: IComponentConfiguration): void {
        this._checkName(name);
        this.get(name).configure(conf);
    }

    public deactivate(name: string): void {
        this._checkName(name);
        this._components[name].active = false;
        if (!this._coverActivated) {
            this.get(name).deactivate();
        }
    }

    public resize(): void {
        for (let component of _.values(this._components)) {
            component.component.resize();
        }
    }

    public get(name: string): Component {
        return this._components[name].component;
    }

    public getCover(): CoverComponent {
        return this._coverComponent;
    }

    private _checkName(name: string): void {
        if (!(name in this._components)) {
            throw new ParameterMapillaryError(`Component does not exist: ${name}`);
        }
    }
}

export default ComponentService;
