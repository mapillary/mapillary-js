import { ComponentConfiguration } from "./ComponentConfiguration";
import { NavigationDirection } from "../../graph/edge/NavigationDirection";

/**
 * Interface for configuration of sequence component.
 *
 * @interface
 * @example
 * ```js
 * const viewer = new Viewer({
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
     * The node id representing the direction arrow to be highlighted.
     *
     * @description When set to null no direction will be highlighted.
     * The arrow pointing towards the node corresponding to the
     * highlight id will be highlighted.
     *
     * @default undefined
     *
     * @ignore
     */
    highlightId?: string;

    /**
     * The max width of the sequence container.
     *
     * @description Set max width of the container element holding
     * the sequence navigation elements. If the min width is larger than the
     * max width the min width value will be used.
     *
     * The container element is automatically resized when the resize
     * method on the Viewer class is called.
     *
     * @default 117
     */
    maxWidth?: number;

    /**
     * The min width of the sequence container.
     *
     * @description Set min width of the container element holding
     * the sequence navigation elements. If the min width is larger than the
     * max width the min width value will be used.
     *
     * The container element is automatically resized when the resize
     * method on the Viewer class is called.
     *
     * @default 70
     */
    minWidth?: number;

    /**
     * Indicating whether the component is playing.
     *
     * @default false
     */
    playing?: boolean;

    /**
     * Determine whether the sequence UI elements
     * should be visible.
     *
     * @default true
     */
    visible?: boolean;
}
