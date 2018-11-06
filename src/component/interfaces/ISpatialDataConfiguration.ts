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
 *                 earthControls: true,
 *                 pointsVisible: false,
 *                 positionsVisible: true,
 *                 tilesVisible: true,
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
     * Specify if the camera should be controlled in earth
     * mode.
     *
     * @description This is an experimental configuration property that
     * may be removed in a future minor release.
     *
     * @default false
     */
    earthControls?: boolean;

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

    /**
     * Specify if the currently rendered tiles should be indicted on the ground.
     *
     * @default false
     */
    tilesVisible?: boolean;

}

export default ISpatialDataConfiguration;
