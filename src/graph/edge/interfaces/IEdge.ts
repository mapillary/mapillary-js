import {EdgeConstants} from "../../../Edge";

export interface IEdgeData {
    worldMotionAzimuth: number;
}

export interface IEdge {
    to: string;
    direction: EdgeConstants.Direction;
    data: IEdgeData;
}

export default IEdge;
