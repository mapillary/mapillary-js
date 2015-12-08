import {EdgeConstants} from "../../Graph";

export interface IEdge {
    to: string;
    direction: EdgeConstants.Direction;
    data?: any;
}

export default IEdge;
