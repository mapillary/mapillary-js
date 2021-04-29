import { ComponentConfiguration } from "./ComponentConfiguration";
import { CameraVisualizationMode } from "../spatial/enums/CameraVisualizationMode";
import { OriginalPositionMode } from "../spatial/enums/OriginalPositionMode";

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
 *             cellsVisible: true,
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
     * Cell grid depth from the cell of the currently
     * selected camera.
     *
     * @description Max value is 3. Value will be clamped
     * to the interval [1, 3].
     * @default 1
     */
    cellGridDepth?: number;

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
     * Specify if the currently rendered cells should be indicted on the ground.
     *
     * @default false
     */
    cellsVisible?: boolean;
}
