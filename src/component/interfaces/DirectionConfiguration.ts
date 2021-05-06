import { ComponentConfiguration } from "./ComponentConfiguration";

/**
 * Interface for configuration of direction component.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         direction: {
 *             minWidth: 140,
 *             maxWidth: 340,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface DirectionConfiguration extends ComponentConfiguration {
    /**
     * Determines if the sequence arrow appearance should be different from
     * the non sequence arrows.
     *
     * @description Needs to be set to true for the sequence suffixed classes
     * to be applied to the navigation elements. Additional calculations will be
     * performed resulting in a performance cost.
     *
     * @default false
     */
    distinguishSequence?: boolean;

    /**
     * The image id representing the direction arrow to be highlighted.
     *
     * @description The arrow pointing towards the image corresponding to the
     * highlight id will be highlighted.
     *
     * @default undefined
     */
    highlightId?: string;

    /**
     * The min width of the non transformed container element holding
     * the navigation arrows.
     *
     * @description  Set min width of the non transformed
     * container element holding the navigation arrows.
     * If the min width is larger than the max width the
     * min width value will be used.
     *
     * The container element is automatically resized when the resize
     * method on the Viewer class is called.
     *
     * @default 260
     */
    minWidth?: number;

    /**
     * The max width of the non transformed container element holding
     * the navigation arrows.
     *
     * @description Set max width of the non transformed
     * container element holding the navigation arrows.
     * If the min width is larger than the max width the
     * min width value will be used.
     *
     * The container element is automatically resized when the resize
     * method on the Viewer class is called.
     *
     * @default 460
     */
    maxWidth?: number;
}
