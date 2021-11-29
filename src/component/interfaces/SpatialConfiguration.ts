import { ComponentConfiguration } from "./ComponentConfiguration";
import { CameraVisualizationMode } from "../spatial/enums/CameraVisualizationMode";
import { OriginalPositionMode } from "../spatial/enums/OriginalPositionMode";
import { PointVisualizationMode } from "../spatial/enums/PointVisualizationMode";

/**
 * Interface for configuration of spatial component.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         spatial: {
 *             cameraSize: 0.5,
 *             cameraVisualizationMode: CameraVisualizationMode.Cluster,
 *             cellsVisible: true,
 *             originalPositionMode: OriginalPositionMode.Altitude,
 *             pointSize: 0.5,
 *             pointVisualizationMode: PointVisualizationMode.Hidden,
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
     * Specify if the currently rendered cells should be visualize on
     * an approximated ground plane.
     *
     * @default false
     */
    cellsVisible?: boolean;

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
     * @deprecated `pointsVisible` will be removed in
     * v5.x. Use {@link pointVisualizationMode} instead.
     *
     * @default true
     */
    pointsVisible?: boolean;

    /**
     * Specify how point clouds should be visualized.
     *
     * @default PointVisualizationMode.Original
     */
    pointVisualizationMode?: PointVisualizationMode;
}
