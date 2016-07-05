import {IComponentConfiguration} from "../../Component";

/**
 * Interface for configuration of mouse component.
 *
 * @interface
 */
export interface IMouseConfiguration extends IComponentConfiguration {
    /**
     * Determines if free camera movement is enabled for perspective images.
     *
     * @description Free camera movement in perspective images means that
     * void will be shown around the image when panning or tilting.
     *
     * @default false
     */
    freePerspectiveMovement?: boolean;
}

export default IMouseConfiguration;
