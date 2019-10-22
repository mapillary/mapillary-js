import {IComponentConfiguration} from "../../Component";
import { CameraVisualizationMode } from "../spatialdata/SpatialData";

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
     * Specify the camera visualization mode.
     *
     * @default CameraVisualizationMode.Default
     */
    cameraVisualizationMode?: CameraVisualizationMode;

    /**
     * Specify if the camera should be controlled in earth
     * mode.
     *
     * @description This is an experimental configuration property that
     * may be removed in a future minor release.
     *
     * @default false
     * @ignore
     */
    earthControls?: boolean;

    /**
     * @deprecated since v2.19.0
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
