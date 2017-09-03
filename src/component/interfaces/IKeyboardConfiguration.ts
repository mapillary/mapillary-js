import {IComponentConfiguration} from "../../Component";

/**
 * Interface for configuration of keyboard component.
 *
 * @interface
 * @example
 * ```
 * var viewer = new Mapillary.Viewer('<element-id>', '<client-id>', '<photo-key>',
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
     * Enable or disable the `KeyHandler`.
     *
     * @default true
     */
    keyZoom?: boolean;

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
}

export default IKeyboardConfiguration;
