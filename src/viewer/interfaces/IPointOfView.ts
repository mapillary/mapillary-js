/**
 * @interface IPointOfView
 *
 * Interface that represents the point of view of the viewer.
 */
export interface IPointOfView {
    /**
     * Value indicating the current bearing of the viewer
     * measured in degrees clockwise with respect to north.
     * Ranges from 0° to 360°.
     */
    bearing: number;

    /**
     * The camera tilt in degrees, relative to a horizontal plane.
     * Ranges from 90° (directly upwards) to -90° (directly downwards).
     */
    tilt: number;
}

export default IPointOfView;
