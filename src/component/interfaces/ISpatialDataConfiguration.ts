import {IComponentConfiguration} from "../../Component";

/**
 * Interface for configuration of spatial data component.
 *
 * @interface
 * @example
 * ```
 * var viewer = new Mapillary.Viewer('<element-id>', '<client-id>', '<image-key>',
 *     {
 *         component: {
 *             spatialData: {
 *                 camerasVisible: true,
 *                 pointsVisible: true,
 *             },
 *         },
 *     })
 * ```
 */
export interface ISpatialDataConfiguration extends IComponentConfiguration {
    /**
     * Specify if the cameras should be visible or not.
     *
     * @default false
     */
    camerasVisible?: boolean;

    /**
     * Specify if the points should be visible or not.
     *
     * @default true
     */
    pointsVisible?: boolean;

}

export default ISpatialDataConfiguration;
