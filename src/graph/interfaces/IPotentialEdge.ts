import {IAPINavImIm} from "../../API";

export interface IPotentialEdge {
    distance: number;
    directionChange: number;
    apiNavImIm: IAPINavImIm;
}

export default IPotentialEdge;
