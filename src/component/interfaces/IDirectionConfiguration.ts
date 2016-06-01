import {IComponentConfiguration} from "../../Component";

/**
 * Interface for configuration of direction Component
 *
 * @interface
 */
export interface IDirectionConfiguration extends IComponentConfiguration {
    /**
     * Determines if the sequence arrow appearance should be different from
     * the non sequence arrows.
     *
     * @description Needs to be set for the sequence suffixed classes to be
     * applied to the navigation elements. Additional calculations will be
     * performed resulting in a performance cost.
     */
    distinguishSequence?: boolean;

    /**
     * The node key representing the direction arrow to be highlighted.
     */
    highlightKey?: string;

    /**
     * The min width of the non transformed container element holding
     * the navigation arrows.
     *
     * @description If the min width is larger than the max width the
     * min width value will be used.
     * @default 260
     */
    minWidth?: number;

    /**
     * The max width of the non transformed container element holding
     * the navigation arrows.
     *
     * @description If the min width is larger than the max width the
     * min width value will be used.
     * @default 460
     */
    maxWidth?: number;

    /**
     * The scale for the offset of the direction arrows.
     *
     * @description Minimum value is 1.
     * @default 1
     */
    offsetScale?: number;
}

export default IDirectionConfiguration;
