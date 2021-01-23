import { EdgeDirection } from "../EdgeDirection";

export interface IPano {
    direction: EdgeDirection;
    prev: EdgeDirection;
    next: EdgeDirection;
    directionChange: number;
}
