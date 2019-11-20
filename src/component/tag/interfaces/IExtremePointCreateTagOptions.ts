/**
 * Interface for the options that define the behavior and
 * appearance of the extreme point create tag.
 *
 * @interface
 */
export interface IExtremePointCreateTagOptions {
    /**
     * Text color as hexadecimal number.
     * @default 0xFFFFFF
     */
    color?: number;

    /**
     * Show an indicator at the centroid of the extreme
     * point tag rectrangle that creates the geometry when
     * clicked.
     * @default true
     */
    indicateCompleter?: boolean;
}

export default IExtremePointCreateTagOptions;
