import {EdgeConstants} from "../../../Edge";

export interface IPano {
    direction: EdgeConstants.Direction;
    prev: EdgeConstants.Direction;
    next: EdgeConstants.Direction;
    directionChange: number;
}
