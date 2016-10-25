import {IComponentConfiguration} from "../../Component";

/**
 * Interface for experimental configuration of image plane component.
 *
 * @interface
 */
export interface IImagePlaneConfiguration extends IComponentConfiguration {
    /**
     * Experimental maximum resolution of panorama images that are
     * retrieved when halted.
     *
     * @description 'auto' means that the viewer options settings will
     * be followed.
     * 'high' means an image width of 4096 pixels. If the width of the
     * original full resolution image is smaller than 4096 pixels the
     * original image size will be used.
     * 'full' means the original image size.
     */
    maxPanoramaResolution?: "auto" | "high" | "full";
}

export default IImagePlaneConfiguration;
