import {IReconstructionPoint} from "../../../Component";

export interface IReconstruction {
    points: { [id: string]: IReconstructionPoint };
}

export default IReconstruction;
