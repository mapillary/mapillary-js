/**
 * @interface ISimpleMarkerOptions
 *
 * Interface that represents the options for configuring a `SimpleMarker`.
 */
export interface ISimpleMarkerOptions {
    /**
     * The color of the ball inside the marker.
     *
     * @default "#f00"
     */
    ballColor?: number | string;

    /**
     * The opacity of the ball inside the marker.
     *
     * @default 0.8
     */
    ballOpacity?: number;

    /**
     * The color of the ice creame shape.
     *
     * @default "#f00"
     */
    color?: number | string;

    /**
     * Value indicating if the marker should be interactive or not.
     *
     * @description If the marker is configured to be interactive
     * it will be draggable in the viewer and retrievable with the
     * `getMarkerIdAt` method on the `MarkerComponent`.
     *
     * @default false
     */
    interactive?: boolean;

    /**
     * The opacity of the ice creame shape.
     *
     * @default 0.4
     */
    opacity?: number;

    /**
     * The radius of the ice cream shape in meters.
     *
     * @default 1
     */
    radius?: number;
}

export default ISimpleMarkerOptions;
