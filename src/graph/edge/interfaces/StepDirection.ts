import { NavigationDirection } from "../NavigationDirection";

export interface StepDirection {
    direction: NavigationDirection;
    motionChange: number;
    useFallback: boolean;
}
