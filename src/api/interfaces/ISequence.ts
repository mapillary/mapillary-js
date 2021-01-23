import { IKey } from "./IKey";

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
