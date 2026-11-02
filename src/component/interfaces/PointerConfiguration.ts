import { ComponentConfiguration } from "./ComponentConfiguration";

/**
 * Interface for configuration of mouse component.
 *
 * @interface
 * @example
 * ```js
 * var viewer = new Viewer({
 *     ...
 *     component: {
 *         pointer: {
 *             dragPan: false,
 *             scrollZoom: false,
 *             touchZoom: false,
 *         },
 *     },
 *     ...
 * });
 * ```
 */
export interface PointerConfiguration extends ComponentConfiguration {
    /**
     * Activate or deactivate the `DragPanHandler`.
     *
     * @default true
     */
    dragPan?: boolean;

    /**
     * Activate or deactivate the `EarthControlHandler`.
     *
     * @default true
     */
    earthControl?: boolean;

    /**
     * Activate or deactivate the `ScrollZoomHandler`.
     *
     * @default true
     */
    scrollZoom?: boolean;

    /**
     * Activate or deactivate the `TouchZoomHandler`.
     *
     * @default true
     */
    touchZoom?: boolean;

    /**
     * Keep drag panning, and the bounce back after panning or zooming,
     * within a view window of the current image instead of its edges.
     *
     * @description The window is a perspective frustum from the render
     * camera's position and up vector, looking at `center` with the
     * vertical `fieldOfView`, at the viewport's aspect. Regular images
     * are additionally limited to their edges. `null` restores the image
     * edges.
     *
     * @default null
     */
    viewBounds?: PointerViewBounds | null;
}

/**
 * A view window of the current image for the pointer component.
 */
export interface PointerViewBounds {
    /** Window center in basic coordinates of the current image. */
    center: number[];

    /** Vertical field of view of the window, in degrees. */
    fieldOfView: number;
}
