import { Camera } from "../../src/geo/Camera";
import { IStateBase } from "../../src/state/interfaces/IStateBase";
import { TransitionMode } from "../../src/state/TransitionMode";

export function generateStateParams(): IStateBase {
    return {
        alpha: 1,
        camera: new Camera(),
        currentIndex: -1,
        reference: { alt: 0, lat: 0, lng: 0 },
        trajectory: [],
        transitionMode: TransitionMode.Default,
        zoom: 0,
    };
}
