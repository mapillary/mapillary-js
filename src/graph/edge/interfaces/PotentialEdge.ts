/**
 * Interface that describes the properties for a image that is the destination of a
 * potential edge from an origin image.
 *
 * @interface PotentialEdge
 */
export interface PotentialEdge {

    /**
     * Timestamp when the image was captured.
     * @property {number} capturedAt
     */
    capturedAt: number;

    /**
     * Change in viewing direction with respect to the origin image.
     * @property {number} directionChange
     */
    directionChange: number;

    /**
     * Distance to the origin image.
     * @property {number} distance
     */
    distance: number;

    /**
     * Determines if the destination image is spherical.
     * @property {boolean} spherical
     */
    spherical: boolean;

    /**
     * Unique image id.
     * @property {string} id
     */
    id: string;

    /**
     * Change in motion with respect to the viewing direction
     * of the origin image.
     * @property {number} motionChange
     */
    motionChange: number;

    /**
     * General camera rotation with respect to the origin image.
     * @property {number} rotation
     */
    rotation: number;

    /**
     * Determines if the origin and destination image are considered
     * to be in the same merge connected component.
     * @property {boolean} sameMergeCC
     */
    sameMergeCC: boolean;

    /**
     * Determines if the origin and destination image are in the
     * same sequence.
     * @property {boolean} sameSequence
     */
    sameSequence: boolean;

    /**
     * Determines if the origin and destination image have been captured
     * by the same user.
     * @property {boolean} sameUser
     */
    sameUser: boolean;

    /**
     * Determines which sequence the destination image of the potential edge
     * belongs to.
     * @property {string} sequenceId
     */
    sequenceId: string;

    /**
     * Change in viewing direction with respect to the XY-plane.
     * @property {number} verticalDirectionChange
     */
    verticalDirectionChange: number;

    /**
     * The angle between motion vector and the XY-plane
     * @property {number} verticalMotion
     */
    verticalMotion: number;

    /**
     * The counter clockwise horizontal rotation angle from
     * the X-axis in a spherical coordiante system.
     * @property {number} worldMotionAzimuth
     */
    worldMotionAzimuth: number;
}
