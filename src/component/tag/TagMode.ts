/**
 * Enumeration for tag modes
 * @enum {number}
 * @readonly
 * @description Modes for the interaction in the tag component.
 */
export enum TagMode {
    /**
     * Disables creating tags.
     */
    Default,

    /**
     * Create a point geometry through a click.
     */
    CreatePoint,

    /**
     * Create a points geometry through clicks.
     */
    CreatePoints,

    /**
     * Create a polygon geometry through clicks.
     */
    CreatePolygon,

    /**
     * Create a rect geometry through clicks.
     */
    CreateRect,

    /**
     * Create a rect geometry through drag.
     *
     * @description Claims the mouse which results in mouse handlers like
     * drag pan and scroll zoom becoming inactive.
     */
    CreateRectDrag,
}

export default TagMode;
