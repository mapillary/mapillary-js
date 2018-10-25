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
}

export default ISpatialDataConfiguration;
