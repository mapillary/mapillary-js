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
 *                 connectedComponents: true,
 *                 pointsVisible: false,
 *                 positionsVisible: true,
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
     * Specify if the color of the cameras should
     * indicate the connected components they belong to.
     *
     * @description Only applicable when cameras are visible.
     *
     * @default false
     */
    connectedComponents?: boolean;

    /**
     * Specify if the points should be visible or not.
     *
     * @default true
     */
    pointsVisible?: boolean;

    /**
     * Specify if the original GPS positions should be visible or not.
     *
     * @default false
     */
    positionsVisible?: boolean;

}

export default ISpatialDataConfiguration;
