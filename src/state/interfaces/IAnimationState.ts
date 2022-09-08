import { State } from "../State";
import { Camera } from "../../geo/Camera";
import { Transform } from "../../geo/Transform";
import { LngLatAlt } from "../../api/interfaces/LngLatAlt";
import { Image } from "../../graph/Image";

export interface IAnimationState {
    alpha: number;
    camera: Camera;
    currentCamera: Camera;
    currentImage: Image;
    currentIndex: number;
    currentTransform: Transform;
    imagesAhead: number;
    lastImage: Image;
    motionless: boolean;
    previousCamera: Camera;
    previousImage: Image;
    previousTransform: Transform;
    reference: LngLatAlt;
    state: State;
    stateTransitionAlpha: number;
    trajectory: Image[];
    zoom: number;
}
