
/**
 * @interface ICircleMarkerOptions
 *
 * Interface that represents the options for configuring a `CircleMarker`.
 */
export interface ICircleMarkerOptions {
    /**
     * The color of the marker.
     *
     * @default "#fff"
     */
    color?: number | string;

    /**
     * The opacity of the marker.
     *
     * @default 0.4
     */
    opacity?: number;

    /**
     * The radius of the circle in meters.
     *
     * @default 1
     */
    radius?: number;
}

export default ICircleMarkerOptions;
