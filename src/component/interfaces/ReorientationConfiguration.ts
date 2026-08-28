import { ComponentConfiguration } from "./ComponentConfiguration";

/**
 * Interface for configuration of the reorientation component.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         reorientation: {
 *             movingSpeedMps: 1,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface ReorientationConfiguration extends ComponentConfiguration {
    /**
     * Whether a spatial navigation (the direction component's step, turn and
     * spherical arrows, and their keyboard equivalents) reorients the landing
     * image when it stays within the current sequence.
     *
     * Crossing into a new sequence with an arrow always keeps the carried view
     * regardless of this setting: the state layer has already matched the
     * angle, and reorienting on top of that fights the transition the arrow
     * just made. Within a sequence the carried view instead drifts off-axis as
     * the road bends, which is what reorientation corrects.
     *
     * @default true
     */
    reorientOnSpatialNav?: boolean;

    /**
     * Number of images ahead in the sequence to precompute the
     * reorientation for, so that a step lands on an already resolved
     * bearing and the transition stays smooth.
     *
     * @default 3
     */
    prefetchAhead?: number;

    /**
     * Minimum GPS speed, in meters per second, above which travel is
     * considered sustained motion and the GPS travel bearing is trusted.
     *
     * @default 1
     */
    movingSpeedMps?: number;

    /**
     * Below {@link movingSpeedMps}, a step is still accepted as motion
     * (a slow turn rather than GPS noise) when the compass angle agrees
     * with the travel bearing within {@link lowSpeedTurnMaxDeltaDeg} and
     * the step is longer than this distance in meters.
     *
     * Low enough to accept walking-pace capture, where frames are often only
     * about a metre apart; the compass agreement above is what separates that
     * from a stationary camera's GPS drift.
     *
     * @default 0.5
     */
    lowSpeedTurnDistanceM?: number;

    /**
     * Maximum angle, in degrees, between compass angle and travel bearing
     * for a low-speed step to be accepted as a genuine turn.
     *
     * @default 30
     */
    lowSpeedTurnMaxDeltaDeg?: number;

    /**
     * Maximum bearing change, in degrees, from the last confirmed moving
     * bearing before a step is rejected as a GPS outlier and the previous
     * bearing is held instead.
     *
     * @default 90
     */
    outlierMaxDeltaDeg?: number;

    /**
     * Number of preceding images to scan in cache for prior motion context.
     *
     * @default 5
     */
    previousContextWindow?: number;

    /**
     * Number of preceding images to scan when validating bearing continuity
     * for a moving image.
     *
     * @default 10
     */
    movingHistoryWindow?: number;

    /**
     * Number of preceding images to scan for the last confirmed moving
     * bearing when the current step is not itself moving.
     *
     * @default 100
     */
    fallbackHistoryWindow?: number;
}
