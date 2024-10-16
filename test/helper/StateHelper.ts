import { S2GeometryProvider } from "../../src/api/S2GeometryProvider";
import { Camera } from "../../src/geo/Camera";
import { IAnimationState } from "../../src/state/interfaces/IAnimationState";
import { IStateBase } from "../../src/state/interfaces/IStateBase";
import { State } from "../../src/state/State";
import { TransitionMode } from "../../src/state/TransitionMode";

export const createDefaultState = (): IAnimationState => {
    return {
        alpha: 0,
        camera: null,
        currentCamera: null,
        currentIndex: 0,
        currentImage: null,
        currentTransform: null,
        lastImage: null,
        motionless: false,
        imagesAhead: 0,
        previousCamera: null,
        previousImage: null,
        previousTransform: null,
        reference: null,
        state: State.Traversing,
        stateTransitionAlpha: 0,
        trajectory: null,
        zoom: 0,
    };
};

export function generateStateParams(): IStateBase {
    return {
        alpha: 1,
        camera: new Camera(),
        currentIndex: -1,
        geometry: new S2GeometryProvider(),
        reference: { alt: 0, lat: 0, lng: 0 },
        trajectory: [],
        transitionMode: TransitionMode.Default,
        zoom: 0,
    };
}
