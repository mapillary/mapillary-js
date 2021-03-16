import { IDEnt } from "./IDEnt";

/**
 * Interface that describes the raw image sequence properties.
 *
 * @interface SequenceEnt
 */
export interface SequenceEnt extends IDEnt {
    /**
     * The image IDs of the sequence sorted in
     * acsending order based on capture time.
     */
    image_ids: string[];
}
