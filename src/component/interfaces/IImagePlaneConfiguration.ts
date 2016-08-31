import {IComponentConfiguration} from "../../Component";

/**
 * Interface for configuration of image plane component.
 *
 * @interface
 */
export interface IImagePlaneConfiguration extends IComponentConfiguration {
    /**
     * Maximum size of panorama images that are retrieved when halted.
     *
     * @description Size will be clamped to the interval [2048, 4096].
     */
    maxPanoramaSize?: number;

    /**
     * Value indicating whether high resolution panoramas should be fetched
     * when halted.
     *
     * @default false
     */
    enableHighResPanorama?: boolean;
}

export default IImagePlaneConfiguration;
