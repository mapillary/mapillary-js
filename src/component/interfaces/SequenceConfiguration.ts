import { ComponentConfiguration } from "./ComponentConfiguration";
import { NavigationDirection } from "../../graph/edge/NavigationDirection";

/**
 * Interface for configuration of sequence component.
 *
 * @interface
 * @example
 * ```
 * var viewer = new Mapillary.Viewer({
 *     ...
 *     component: {
 *         sequence: {
 *             minWidth: 40,
 *             maxWidth: 80,
 *             visible: false,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface SequenceConfiguration extends ComponentConfiguration {
    /**
     * Set the direction to follow when playing.
     *
     * @default EdgeDirection.Next
     */
    direction?: NavigationDirection;

    /**
     * The node key representing the direction arrow to be highlighted.
     *
     * @description When set to null no direction will be highlighted.
     *
     * @default undefined
     */
    highlightKey?: string;

    /**
     * The max width of the sequence container.
     *
     * @description If the min width is larger than the max width the
     * min width value will be used.
     * @default 117
     */
    maxWidth?: number;

    /**
     * The min width of the sequence container.
     *
     * @description If the min width is larger than the max width the
     * min width value will be used.
     * @default 70
     */
    minWidth?: number;

    /**
     * Indicating wheter the component is playing.
     *
     * @default false
     */
    playing?: boolean;

    /**
     * Determine if the component should be visible.
     *
     * @default true
     */
    visible?: boolean;
}
