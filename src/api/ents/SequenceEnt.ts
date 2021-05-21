import { IDEnt } from "./IDEnt";

/**
 * Ent representing sequence properties.
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
