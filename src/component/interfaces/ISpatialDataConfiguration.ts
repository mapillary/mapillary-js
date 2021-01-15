import { IComponentConfiguration } from "../../Component";
import CameraVisualizationMode from "../spatialdata/CameraVisualizationMode";
import OriginalPositionMode from "../spatialdata/OriginalPositionMode";

/**
 * Interface for configuration of spatial data component.
 *
 * @interface
 * @example
 * ```
 * var mode = Mapilary.SpatialDataComponent.CameraVisualizationMode;
 * var viewer = new Mapillary.Viewer({
 *     ...
 *     component: {
 *         spatialData: {
 *             cameraSize: 0.5,
 *             camerasVisible: true,
 *             cameraVisualizationMode: mode.Cluster,
 *             earthControls: true,
 *             pointSize: 0.5,
 *             pointsVisible: false,
 *             positionsVisible: true,
 *             tilesVisible: true,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface ISpatialDataConfiguration extends IComponentConfiguration {
    /**
     * The camera size on the interval [0.01, 1].
     *
     * @default 0.1
     */
    cameraSize?: number;

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
     * @deprecated Deprecated since v2.19.0. Use cameraVisualizationMode
     * property instead.
     */
    connectedComponents?: boolean;

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
     * Specify the original position visualization mode.
     *
     * @description The original positions are hidden
     * by default.
     *
     * @default OriginalPositionMode.Hidden
     */
    originalPositionMode?: OriginalPositionMode;

    /**
     * The point size on the interval [0.01, 1].
     *
     * @default 0.1
     */
    pointSize?: number;

    /**
     * Specify if the points should be visible or not.
     *
     * @default true
     */
    pointsVisible?: boolean;

    /**
     * @deprecated Deprecated since v3.1.0. Use originalPositionMode
     * property instead.
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
