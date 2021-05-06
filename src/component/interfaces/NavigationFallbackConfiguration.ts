import { ComponentConfiguration } from "./ComponentConfiguration";

/**
 * Interface for configuration of navigation component.
 *
 * @interface
 *  @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         fallback: {
 *             navigation: {
 *                 spatial: false,
 *             },
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface NavigationFallbackConfiguration
    extends ComponentConfiguration {
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
