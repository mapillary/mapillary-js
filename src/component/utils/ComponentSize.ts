/**
 * Enumeration for component size.
 * @enum {number}
 * @readonly
 * @description May be used by a component to allow for resizing
 * of the UI elements rendered by the component.
 */
export enum ComponentSize {
    /**
     * Automatic size. The size of the elements will automatically
     * change at a predefined threshold.
     */
    Automatic,

    /**
     * Large size. The size of the elements will be fixed until another
     * component size is configured.
     */
    Large,

    /**
     * Small size. The size of the elements will be fixed until another
     * component size is configured.
     */
    Small,
}

export default ComponentSize;
