import {IComponentConfiguration} from "../../Component";

/**
 * Interface for configuration of navigation component.
 *
 * @interface
 *  @example
 * ```
 * var viewer = new Mapillary.Viewer('<element-id>', '<client-id>', '<photo-key>',
 *     {
 *         component: {
 *             navigation: {
 *                 spatialVisible: false,
 *             },
 *         },
 *     })
 * ```
 */
export interface INavigationConfiguration extends IComponentConfiguration {
    /**
     * Determines if the sequence arrows should be visibile.
     *
     * @default true
     */
    sequenceVisible?: boolean;

    /**
     * Determines if the spatial arrows should be visibile.
     *
     * @default true
     */
    spatialVisible?: boolean;
}

export default INavigationConfiguration;
