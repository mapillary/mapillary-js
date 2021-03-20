import { SequenceEnt } from "../ents/SequenceEnt";

export interface SequencesContract {
    [sequenceId: string]: SequenceEnt;
}
