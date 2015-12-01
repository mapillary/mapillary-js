import {GraphConstants} from "../../Graph";

export interface IEdge {
    from: string;
    to: string;
    direction: GraphConstants.DirEnum;
    data: any;
}

export default IEdge;
