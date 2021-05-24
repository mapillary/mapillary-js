import { ComponentConfiguration } from "./ComponentConfiguration";

/**
 * Interface for configuration of mouse component.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         pointer: {
 *             dragPan: false,
 *             scrollZoom: false,
 *             touchZoom: false,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface PointerConfiguration extends ComponentConfiguration {
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
