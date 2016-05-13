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
     * A string referencing the sprite data property to pull from.
     */
    icon?: string;

    /**
     * Color for the edge lines of the color specified as a hexadecimal number.
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
