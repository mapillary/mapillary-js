import { State } from "../state/State";
import { CameraControls } from "./enums/CameraControls";

export function cameraControlsToState(cameraControls: CameraControls): State {
    switch (cameraControls) {
        case CameraControls.Custom:
            return State.Custom;
        case CameraControls.Earth:
            return State.Earth;
        case CameraControls.Street:
            return State.Traversing;
        default:
            return null;
    }
}
