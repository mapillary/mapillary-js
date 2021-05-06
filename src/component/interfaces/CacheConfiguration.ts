import { ComponentConfiguration } from "./ComponentConfiguration";

/**
 * Interface for configuration of cache depth.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         cache: {
 *             depth: {
 *                 spherical: 2,
 *                 sequence: 3,
 *             }
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface CacheDepthConfiguration {
    /**
     * Cache depth in the sequence directions.
     *
     * @description Max value is 4. Value will be clamped
     * to the interval [0, 4].
     * @default 2
     */
    sequence: number;

    /**
     * Cache depth in the spherical direction.
     *
     * @description Max value is 2. Value will be clamped
     * to the interval [0, 2].
     * @default 1
     */
    spherical: number;

    /**
     * Cache depth in the step directions.
     *
     * @description Max value is 3. Value will be clamped
     * to the interval [0, 3].
     * @default 1
     */
    step: number;

    /**
     * Cache depth in the turn directions.
     *
     * @description Max value is 1. Value will be clamped
     * to the interval [0, 1].
     * @default 0
     */
    turn: number;
}

/**
 * Interface for configuration of cache component.
 *
 * @interface
 */
export interface CacheConfiguration extends ComponentConfiguration {
    /**
     * Cache depth struct.
     */
    depth?: CacheDepthConfiguration;
}
