import { ComponentConfiguration } from "./ComponentConfiguration";

export interface IComponent {
    /**
     * Value indicating if the component is currently active.
     */
    readonly activated: boolean;

    /**
     * Default configuration for the component.
     */
    readonly defaultConfiguration: ComponentConfiguration;

    /**
     * The name of the component. Used when interacting with the
     * component through the Viewer's API.
     */
    readonly name: string;

    /**
     * Configure the component.
     */
    configure(configuration: ComponentConfiguration): void;
}
