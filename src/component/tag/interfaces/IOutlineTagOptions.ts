import {Alignment} from "../../../Component";

/**
 * Interface for the options that define the behavior and
 * appearance of the outline tag.
 *
 * @interface
 */
export interface IOutlineTagOptions {
    /**
     * Indicate whether the tag geometry should be editable.
     * @default false
     */
    editable?: boolean;

    /**
     * Color for the interior fill as a hexadecimal number.
     * @default 0xFFFFFF
     */
    fillColor?: number;

    /**
     * Opacity of the interior fill between 0 and 1.
     * @default 0.3
     */
    fillOpacity?: number;

    /**
     * A string referencing the sprite data property to pull from.
     */
    icon?: string;

    /**
     * Alignment value determining how to align the icon when rendering
     *
     * @default {Alignment.Outer}
     */
    iconAlignment: Alignment;

    /**
     * Number representing the index for where to show the icon or
     * text for a rectangle geometry.
     *
     * @description The default index corresponds to the bottom right corner.
     *
     * @default 3
     */
    iconIndex?: number;

    /**
     * Color for the edge lines as a hexadecimal number.
     * @default 0xFFFFFF
     */
    lineColor?: number;

    /**
     * Line width in pixels.
     * @default 1
     */
    lineWidth?: number;

    /**
     * Text shown as label if no icon is provided.
     */
    text?: string;

    /**
     * Text color as hexadecimal number.
     * @default 0xFFFFFF
     */
    textColor?: number;
}

export default IOutlineTagOptions;
