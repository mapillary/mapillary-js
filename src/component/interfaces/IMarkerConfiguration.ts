import {IComponentConfiguration} from "../../Component";

/**
 * Interface for configuration of marker component.
 *
 * @interface
 */
export interface IMarkerConfiguration extends IComponentConfiguration {
    /**
     * The size of the bounding box for which markers will be visible.
     *
     * @description Provided values will be clamped to the [1, 200]
     * interval.
     *
     * @default 100
     */
    visibleBBoxSize?: number;
}

export default IMarkerConfiguration;
