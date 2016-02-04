/** Enumeration for directions
 * @enum string
 * @readonly
 */
export enum EdgeDirection {
    /**
     * Next photo in the sequence
     */
    NEXT = 0,

    /**
     * Previous photo in the sequence
     */
    PREV = 3,

    /**
     * Step to the photo on the left
     */
    STEP_LEFT,

    /**
     * Step to the photo on the right
     */
    STEP_RIGHT,

    /**
     * Step to the photo forward (equivalent of moving forward)
     */
    STEP_FORWARD,

    /**
     * Step to the photo backward (equivalent of moving backward)
     */
    STEP_BACKWARD,

    /**
     * Rotate ~90deg to the left from the current photo
     */
    TURN_LEFT,

    /**
     * Rotate ~90deg to the right from the current photo
     */
    TURN_RIGHT,

    /**
     * Turn around, relative to the dirrection of the current photo
     */
    TURN_U,
    ROTATE_LEFT,
    ROTATE_RIGHT,
    HOMOGRAPHY,
    CLOSE,
    PANO
};
