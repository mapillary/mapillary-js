import { KeyedEnt } from "./KeyedEnt";

/**
 * Interface that describes the raw image sequence properties.
 *
 * @interface SequenceEnt
 */
export interface SequenceEnt extends KeyedEnt {
    /**
     * The ordered image keys of the sequence.
     */
    keys: string[];
}
