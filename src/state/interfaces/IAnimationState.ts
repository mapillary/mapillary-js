import { State } from "../State";
import { Camera } from "../../geo/Camera";
import { Transform } from "../../geo/Transform";
import { LngLatAlt } from "../../api/interfaces/LngLatAlt";
import { Image } from "../../graph/Image";

export interface IAnimationState {
    reference: LngLatAlt;
    alpha: number;
    camera: Camera;
    zoom: number;
    currentImage: Image;
    currentCamera: Camera;
    previousImage: Image;
    trajectory: Image[];
    currentIndex: number;
    lastImage: Image;
    imagesAhead: number;
    currentTransform: Transform;
    previousTransform: Transform;
    motionless: boolean;
    state: State;
    stateTransitionAlpha: number;
}
