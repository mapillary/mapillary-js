import { NavigationDirection } from "../NavigationDirection";

export interface TurnDirection {
    direction: NavigationDirection;
    directionChange: number;
    motionChange?: number;
}
