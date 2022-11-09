import { State } from "../../state/State";
import { CameraVisualizationMode } from "./enums/CameraVisualizationMode";

export function isModeVisible(mode: CameraVisualizationMode): boolean {
    return mode !== CameraVisualizationMode.Hidden;
}

export function isOverviewState(state: State): boolean {
    return state === State.Custom || state === State.Earth;
}
