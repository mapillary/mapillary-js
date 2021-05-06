import { ComponentConfiguration } from "./ComponentConfiguration";

/**
 * Interface for configuration of marker component.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         marker: {
 *             visibleBBoxSize: 80,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface MarkerConfiguration extends ComponentConfiguration {
    /**
     * The size of the bounding box for which markers will be visible.
     *
     * @description Provided values will be clamped to the [1, 200]
     * interval.
     *
     * @default 100
     */
    visibleBBoxSize?: number;
}
