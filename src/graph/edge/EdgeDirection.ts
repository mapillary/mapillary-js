/**
 * Enumeration for edge directions
 * @enum {number}
 * @readonly
 * @description Directions for edges in node graph describing
 * sequence, spatial and node type relations between nodes.
 */
export enum EdgeDirection {
    /**
     * Next node in the sequence.
     */
    Next,

    /**
     * Previous node in the sequence.
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
     * Panorama in general direction.
     */
    Pano,

    /**
     * Looking in roughly the same direction at rougly the same position.
     */
    Similar,
}
