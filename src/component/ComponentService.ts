import { Component } from "./Component";
import { CoverComponent } from "./cover/CoverComponent";
import { ComponentConfiguration } from "./interfaces/ComponentConfiguration";

import { ArgumentMapillaryError } from "../error/ArgumentMapillaryError";
import { Container } from "../viewer/Container";
import { Navigator } from "../viewer/Navigator";

interface ActiveComponent {
    active: boolean;
    component: Component<ComponentConfiguration>;
}

export class ComponentService {
    public static registeredCoverComponent: typeof CoverComponent;
    public static registeredComponents: { [key: string]: { new(...args: any[]): Component<ComponentConfiguration>; } } = {};

    private _coverActivated: boolean;
    private _coverComponent: CoverComponent;
    private _components: { [key: string]: ActiveComponent } = {};

    constructor(container: Container, navigator: Navigator) {
        for (const componentName in ComponentService.registeredComponents) {
            if (!ComponentService.registeredComponents.hasOwnProperty(componentName)) {
                continue;
            }

            const component: new (...args: any[]) => Component<ComponentConfiguration> =
                ComponentService.registeredComponents[componentName];

            this._components[componentName] = {
                active: false,
                component: new component(componentName, container, navigator),
            };
        }

        this._coverComponent = new ComponentService.registeredCoverComponent("cover", container, navigator);
        this._coverComponent.activate();
        this._coverActivated = true;
    }

    public static register<T extends Component<ComponentConfiguration>>(
        component: { componentName: string, new(...args: any[]): T; }): void {
        if (ComponentService.registeredComponents[component.componentName] === undefined) {
            ComponentService.registeredComponents[component.componentName] = component;
        }
    }

    public static registerCover(coverComponent: typeof CoverComponent): void {
        ComponentService.registeredCoverComponent = coverComponent;
    }

    public get coverActivated(): boolean {
        return this._coverActivated;
    }

    public activateCover(): void {
        if (this._coverActivated) {
            return;
        }

        this._coverActivated = true;

        for (const componentName in this._components) {
            if (!this._components.hasOwnProperty(componentName)) {
                continue;
            }

            const component: ActiveComponent = this._components[componentName];

            if (component.active) {
                component.component.deactivate();
            }
        }
    }

    public deactivateCover(): void {
        if (!this._coverActivated) {
            return;
        }

        this._coverActivated = false;

        for (const componentName in this._components) {
            if (!this._components.hasOwnProperty(componentName)) {
                continue;
            }

            const component: ActiveComponent = this._components[componentName];

            if (component.active) {
                component.component.activate();
            }
        }
    }

    public activate(name: string): void {
        this._checkName(name);
        this._components[name].active = true;

        if (!this._coverActivated) {
            this.get(name).activate();
        }
    }

    public configure<TConfiguration extends ComponentConfiguration>(name: string, conf: TConfiguration): void {
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

    public get<TComponent extends Component<ComponentConfiguration>>(name: string): TComponent {
        return <TComponent>this._components[name].component;
    }

    public getCover(): CoverComponent {
        return this._coverComponent;
    }

    public remove(): void {
        this._coverComponent.deactivate();

        for (const componentName in this._components) {
            if (!this._components.hasOwnProperty(componentName)) {
                continue;
            }

            this._components[componentName].component.deactivate();
        }
    }

    private _checkName(name: string): void {
        if (!(name in this._components)) {
            throw new ArgumentMapillaryError(`Component does not exist: ${name}`);
        }
    }
}
