import { ComponentConfiguration } from "./ComponentConfiguration";
import { CameraVisualizationMode } from "../spatial/CameraVisualizationMode";
import { OriginalPositionMode } from "../spatial/OriginalPositionMode";

/**
 * Interface for configuration of spatial component.
 *
 * @interface
 * @example
 * ```js
 * var mode = Mapillary.SpatialComponent.CameraVisualizationMode;
 * var viewer = new mapillary.Viewer({
 *     ...
 *     component: {
 *         spatial: {
 *             cameraSize: 0.5,
 *             cameraVisualizationMode: mode.Cluster,
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
export interface SpatialConfiguration extends ComponentConfiguration {
    /**
     * The camera size on the interval [0.01, 1].
     *
     * @default 0.1
     */
    cameraSize?: number;

    /**
     * Specify the camera visualization mode.
     *
     * @default CameraVisualizationMode.Homogeneous
     */
    cameraVisualizationMode?: CameraVisualizationMode;

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
     * Specify if the currently rendered tiles should be indicted on the ground.
     *
     * @default false
     */
    tilesVisible?: boolean;
}
