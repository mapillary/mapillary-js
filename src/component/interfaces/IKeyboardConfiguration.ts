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
 *                 sequence: false,
 *                 spatial: false,
 *             },
 *         },
 *     })
 * ```
 */
export interface IKeyboardConfiguration extends IComponentConfiguration {
    /**
     * Enable or disable the `SequenceHandler`.
     *
     * @default true
     */
    sequence?: boolean;

    /**
     * Enable or disable the `SpatialHandler`.
     *
     * @default true
     */
    spatial?: boolean;
}

export default IKeyboardConfiguration;
