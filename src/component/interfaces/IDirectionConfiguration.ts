import {IComponentConfiguration} from "../../Component";

/**
 * Interface for configuration of direction Component
 *
 * @interface
 */
export interface IDirectionConfiguration extends IComponentConfiguration {
    /**
     * The scale for the offset of the direction arrows.
     *
     * @description Minimum value is 1.
     * @default 1
     */
    offsetScale?: number;
}

export default IDirectionConfiguration;
