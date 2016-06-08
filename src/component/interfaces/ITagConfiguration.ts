import {IComponentConfiguration} from "../../Component";

/**
 * Interface for configuration of tag component.
 *
 * @interface
 */
export interface ITagConfiguration extends IComponentConfiguration {
    /**
     * Value indicating whether the component is in create mode.
     *
     * @default false
     */
    creating?: boolean;

    /**
     * String literal determining the geometry type the component
     * will create in create mode.
     */
    createType?: "polygon" | "rect";
}

export default ITagConfiguration;
