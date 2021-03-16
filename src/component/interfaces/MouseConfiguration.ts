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
     * Enable or disable the `DoubleClickZoomHandler`.
     *
     * @default false
     */
    doubleClickZoom?: boolean;

    /**
     * Enable or disable the `DragPanHandler`.
     *
     * @default true
     */
    dragPan?: boolean;

    /**
     * Enable or disable the `ScrollZoomHandler`.
     *
     * @default true
     */
    scrollZoom?: boolean;

    /**
     * Enable or disable the `TouchZoomHandler`.
     *
     * @default true
     */
    touchZoom?: boolean;
}
