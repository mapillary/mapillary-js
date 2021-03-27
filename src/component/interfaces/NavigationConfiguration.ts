import { ComponentConfiguration } from "./ComponentConfiguration";

/**
 * Interface for configuration of navigation component.
 *
 * @interface
 *  @example
 * ```js
 * var viewer = new mapillary.Viewer({
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
export interface NavigationConfiguration extends ComponentConfiguration {
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
