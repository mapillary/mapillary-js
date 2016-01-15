import {EdgeDirection} from "../../../Edge";

export interface IPano {
    direction: EdgeDirection;
    prev: EdgeDirection;
    next: EdgeDirection;
    directionChange: number;
}
