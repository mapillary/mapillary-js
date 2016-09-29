import {IKey} from "../../API";

/**
 * Interface that describes the raw image sequence properties.
 *
 * @interface ISequence
 */
export interface ISequence extends IKey {
    /**
     * The ordered image keys of the sequence.
     */
    keys: string[];
}

export default ISequence;
