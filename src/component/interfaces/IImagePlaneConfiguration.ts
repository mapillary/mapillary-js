import {IComponentConfiguration} from "../../Component";

/**
 * Interface for experimental configuration of image plane component.
 *
 * @interface
 */
export interface IImagePlaneConfiguration extends IComponentConfiguration {
    /**
     * Experimental setting specifying if image tiling should be used
     * on zoom. Support for this configuration may be
     * changed or removed in a future minor release.
     */
    imageTiling?: boolean;
}

export default IImagePlaneConfiguration;
