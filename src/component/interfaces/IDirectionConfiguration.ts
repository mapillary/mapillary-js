import { IComponentConfiguration } from "../../Component";

/**
 * Interface for configuration of direction component.
 *
 * @interface
 * @example
 * ```
 * var viewer = new Mapillary.Viewer({
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
export interface IDirectionConfiguration extends IComponentConfiguration {
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
     * The node key representing the direction arrow to be highlighted.
     *
     * @default undefined
     */
    highlightKey?: string;

    /**
     * The min width of the non transformed container element holding
     * the navigation arrows.
     *
     * @description If the min width is larger than the max width the
     * min width value will be used.
     *
     * @default 260
     */
    minWidth?: number;

    /**
     * The max width of the non transformed container element holding
     * the navigation arrows.
     *
     * @description If the min width is larger than the max width the
     * min width value will be used.
     *
     * @default 460
     */
    maxWidth?: number;
}

export default IDirectionConfiguration;
