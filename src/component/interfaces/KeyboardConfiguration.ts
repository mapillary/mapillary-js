import { ComponentConfiguration } from "./ComponentConfiguration";

/**
 * Interface for configuration of keyboard component.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         keyboard: {
 *             keyZoom: false,
 *             keySequenceNavigation: false,
 *             keySpatialNavigation: false,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface KeyboardConfiguration extends ComponentConfiguration {
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
