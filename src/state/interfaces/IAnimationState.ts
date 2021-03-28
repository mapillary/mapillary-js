import { State } from "../State";
import { Camera } from "../../geo/Camera";
import { Transform } from "../../geo/Transform";
import { LatLonAlt } from "../../api/interfaces/LatLonAlt";
import { Image } from "../../graph/Image";

export interface IAnimationState {
    reference: LatLonAlt;
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
}
