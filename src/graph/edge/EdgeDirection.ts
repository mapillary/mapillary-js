/**
 * Enumeration for edge directions
 * @enum {number}
 * @readonly
 * @description Directions for edges in node graph describing
 * sequence, spatial and node type relations between nodes.
 */
export enum EdgeDirection {

    /**
     * Next node in the sequence
     */
    NEXT = 0,

    /**
     * Previous node in the sequence
     */
    PREV = 3,

    /**
     * Step to the left keeping viewing direction
     */
    STEP_LEFT,

    /**
     * Step to the right keeping viewing direction
     */
    STEP_RIGHT,

    /**
     * Step forward keeping viewing direction
     */
    STEP_FORWARD,

    /**
     * Step backward keeping viewing direction
     */
    STEP_BACKWARD,

    /**
     * Turn 90 degrees counter clockwise
     */
    TURN_LEFT,

    /**
     * Turn 90 degrees clockwise
     */
    TURN_RIGHT,

    /**
     * Turn 180 degrees
     */
    TURN_U,

    /**
     * Rotate with small counter clockwise angle change
     */
    ROTATE_LEFT,

    /**
     * Rotate with small clockwise angle change
     */
    ROTATE_RIGHT,

    /**
     * Panorama in general direction
     */
    PANO
};
