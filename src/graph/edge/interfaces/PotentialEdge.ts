/**
 * Interface that describes the properties for a node that is the destination of a
 * potential edge from an origin node.
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
     * Change in viewing direction with respect to the origin node.
     * @property {number} directionChange
     */
    directionChange: number;

    /**
     * Distance to the origin node.
     * @property {number} distance
     */
    distance: number;

    /**
     * Determines if the destination node is spherical.
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
     * of the origin node.
     * @property {number} motionChange
     */
    motionChange: number;

    /**
     * General camera rotation with respect to the origin node.
     * @property {number} rotation
     */
    rotation: number;

    /**
     * Determines if the origin and destination node are considered
     * to be in the same merge connected component.
     * @property {boolean} sameMergeCC
     */
    sameMergeCC: boolean;

    /**
     * Determines if the origin and destination node are in the
     * same sequence.
     * @property {boolean} sameSequence
     */
    sameSequence: boolean;

    /**
     * Determines if the origin and destination node have been captured
     * by the same user.
     * @property {boolean} sameUser
     */
    sameUser: boolean;

    /**
     * Determines which sequence the destination node of the potential edge
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
     * @propery {number} worldMotionAzimuth
     */
    worldMotionAzimuth: number;
}
