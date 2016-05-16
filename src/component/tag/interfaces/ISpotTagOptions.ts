/**
 * Interface for the options that define the behavior and
 * appearance of the spot tag.
 *
 * @interface
 */
export interface ISpotTagOptions {
    /**
     * Color for the spot specified as a hexadecimal number.
     * @default 0xFFFFFF
     */
    color?: number;

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
     * Text shown as label if no icon is provided.
     */
    text?: string;

    /**
     * Text color as hexadecimal number.
     * @default 0xFFFFFF
     */
    textColor?: number;
}

export default ISpotTagOptions;
