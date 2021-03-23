import { ComponentConfiguration } from "./ComponentConfiguration";

/**
 * Interface for configuration of mouse component.
 *
 * @interface
 * @example
 * ```
 * var viewer = new Mapillary.Viewer({
 *     ...
 *     component: {
 *         mouse: {
 *             doubleClickZoom: false,
 *             dragPan: false,
 *             scrollZoom: false,
 *             touchZoom: false,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface MouseConfiguration extends ComponentConfiguration {
    /**
     * Activate or deactivate the `DragPanHandler`.
     *
     * @default true
     */
    dragPan?: boolean;

    /**
     * Activate or deactivate the `EarthControlHandler`.
     *
     * @default true
     */
    earthControl?: boolean;

    /**
     * Activate or deactivate the `ScrollZoomHandler`.
     *
     * @default true
     */
    scrollZoom?: boolean;

    /**
     * Activate or deactivate the `TouchZoomHandler`.
     *
     * @default true
     */
    touchZoom?: boolean;
}
