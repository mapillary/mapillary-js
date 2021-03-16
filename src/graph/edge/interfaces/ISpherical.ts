import { EdgeDirection } from "../EdgeDirection";

export interface ISpherical {
    direction: EdgeDirection;
    prev: EdgeDirection;
    next: EdgeDirection;
    directionChange: number;
}
