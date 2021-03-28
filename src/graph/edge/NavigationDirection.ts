/**
 * Enumeration for edge directions
 * @enum {number}
 * @readonly
 * @description Directions for edges in image graph describing
 * sequence, spatial and image type relations between nodes.
 */
export enum NavigationDirection {
    /**
     * Next image in the sequence.
     */
    Next,

    /**
     * Previous image in the sequence.
     */
    Prev,

    /**
     * Step to the left keeping viewing direction.
     */
    StepLeft,

    /**
     * Step to the right keeping viewing direction.
     */
    StepRight,

    /**
     * Step forward keeping viewing direction.
     */
    StepForward,

    /**
     * Step backward keeping viewing direction.
     */
    StepBackward,

    /**
     * Turn 90 degrees counter clockwise.
     */
    TurnLeft,

    /**
     * Turn 90 degrees clockwise.
     */
    TurnRight,

    /**
     * Turn 180 degrees.
     */
    TurnU,

    /**
     * Spherical in general direction.
     */
    Spherical,

    /**
     * Looking in roughly the same direction at rougly the same position.
     */
    Similar,
}
