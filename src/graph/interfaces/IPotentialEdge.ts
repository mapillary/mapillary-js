import {IAPINavImIm} from "../../API";

export interface IPotentialEdge {
    distance: number;
    motionChange: number;
    directionChange: number;
    rotation: number;
    apiNavImIm: IAPINavImIm;
}

export default IPotentialEdge;
