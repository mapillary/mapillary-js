import {IComponentConfiguration} from "../../Component";

/**
 * Interface for configuration of keyboard component.
 *
 * @interface
 * @example
 * ```
 * var viewer = new Mapillary.Viewer('<element-id>', '<client-id>', '<image-key>',
 *     {
 *         component: {
 *             keyboard: {
 *                 keyZoom: false,
 *                 keySequenceNavigation: false,
 *                 keySpatialNavigation: false,
 *             },
 *         },
 *     })
 * ```
 */
export interface IKeyboardConfiguration extends IComponentConfiguration {
    /**
     * Enable or disable the `KeyPlayHandler`.
     *
     * @default true
     */
    keyPlay?: boolean;

    /**
     * Enable or disable the `KeySequenceNavigationHandler`.
     *
     * @default true
     */
    keySequenceNavigation?: boolean;

    /**
     * Enable or disable the `KeySpatialNavigationHandler`.
     *
     * @default true
     */
    keySpatialNavigation?: boolean;

    /**
     * Enable or disable the `KeyZoomHandler`.
     *
     * @default true
     */
    keyZoom?: boolean;
}

export default IKeyboardConfiguration;
