import { SequenceEnt } from "../ents/SequenceEnt";

export interface SequencesResult {
    [sequenceId: string]: SequenceEnt;
}
