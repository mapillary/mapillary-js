import { NavigationDirection } from "../NavigationDirection";

export interface SphericalDirection {
    direction: NavigationDirection;
    prev: NavigationDirection;
    next: NavigationDirection;
    directionChange: number;
}
