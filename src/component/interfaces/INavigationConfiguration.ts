import { IComponentConfiguration } from "../../Component";

/**
 * Interface for configuration of navigation component.
 *
 * @interface
 *  @example
 * ```
 * var viewer = new Mapillary.Viewer({
 *     ...
 *     component: {
 *         navigation: {
 *             spatial: false,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface INavigationConfiguration extends IComponentConfiguration {
    /**
     * Enable or disable the sequence arrows.
     *
     * @default true
     */
    sequence?: boolean;

    /**
     * Enable or disable the spatial arrows.
     *
     * @default true
     */
    spatial?: boolean;
}

export default INavigationConfiguration;
