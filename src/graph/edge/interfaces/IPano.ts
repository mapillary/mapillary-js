import {EdgeConstants} from "../../../Edge";

export interface IPano {
    direction: EdgeConstants.EdgeDirection;
    prev: EdgeConstants.EdgeDirection;
    next: EdgeConstants.EdgeDirection;
    directionChange: number;
}
