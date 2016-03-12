/**
 * Enumeration for render mode
 * @enum {number}
 * @readonly
 * @description Modes for specifying how rendering is done
 * in the viewer. All modes preserves the original aspect
 * ratio of the images.
 */
export enum RenderMode {

    /**
     * Displays all content within the viewer.
     *
     * @description Black bars shown on both
     * sides of the content. Bars are shown
     * either below and above or to the left
     * and right of the content depending on
     * the aspect ratio relation between the
     * image and the viewer.
     */
    Letterbox,

    /**
     * Fills the viewer by cropping content.
     *
     * @description Cropping is done either
     * in horizontal or vertical direction
     * depending on the aspect ratio relation
     * between the image and the viewer.
     */
    Fill,
}

export default RenderMode;
