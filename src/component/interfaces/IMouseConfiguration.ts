import {IComponentConfiguration} from "../../Component";

/**
 * Interface for configuration of mouse component.
 *
 * @interface
 * @example
 * ```
 * var viewer = new Mapillary.Viewer('<element-id>', '<client-id>', '<image-key>',
 *     {
 *         component: {
 *             mouse: {
 *                 doubleClickZoom: false,
 *                 dragPan: false,
 *                 scrollZoom: false,
 *                 touchZoom: false,
 *             },
 *         },
 *     })
 * ```
 */
export interface IMouseConfiguration extends IComponentConfiguration {
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

export default IMouseConfiguration;
