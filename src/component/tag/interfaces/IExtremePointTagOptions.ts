/**
 * Interface for the options that define the behavior and
 * appearance of the outline tag.
 *
 * @interface
 */
export interface IExtremePointTagOptions {
    /**
     * Indicate whether the tag geometry should be editable.
     *
     * @description Polygon tags with two dimensional domain
     * are never editable.
     *
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
     * Determines whether vertices should be indicated by points
     * when tag is editable.
     *
     * @default true
     */
    indicateVertices?: boolean;

    /**
     * Color for the edge lines as a hexadecimal number.
     * @default 0xFFFFFF
     */
    lineColor?: number;

    /**
     * Opacity of the edge lines on [0, 1].
     * @default 1
     */
    lineOpacity?: number;

    /**
     * Line width in pixels.
     * @default 1
     */
    lineWidth?: number;
}

export default IExtremePointTagOptions;
