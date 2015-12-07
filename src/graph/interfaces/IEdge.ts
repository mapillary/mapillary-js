import {GraphConstants} from "../../Graph";

export interface IEdge {
    from: string;
    to: string;
    direction: GraphConstants.Direction;
    data: any;
}

export default IEdge;
