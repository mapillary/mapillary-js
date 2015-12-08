import {GraphConstants} from "../../Graph";

export interface IEdge {
    to: string;
    direction: GraphConstants.Direction;
    data?: any;
}

export default IEdge;
