/**
 * Interface for the popup offset with respect to its anchor point.
 *
 * @description An object of number arrays specifing an offset for
 * each float direction. Negative offsets indicate left and up.
 *
 * @interface
 *
 * @example
 * ```
 * var offset = = {
 *     bottom: [0, 10],
 *     bottomLeft: [-10, 10],
 *     bottomRight: [10, 10],
 *     center: [0, 0],
 *     left: [-10, 0],
 *     right: [10, 0],
 *     top: [0, -10],
 *     topLeft: [-10, -10],
 *     topRight: [10, -10],
 * }
 *
 * var popup = new Mapillary.PopupComponent.Popup({ offset: offset });
 * ```
 */
export interface IPopupOffset {
    bottom: number[];
    bottomLeft: number[];
    bottomRight: number[];
    center: number[];
    left: number[];
    right: number[];
    top: number[];
    topLeft: number[];
    topRight: number[];
}

export default IPopupOffset;
