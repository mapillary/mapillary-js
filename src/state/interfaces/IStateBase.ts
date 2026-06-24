import { Camera } from "../../geo/Camera";
import { LngLatAlt } from "../../api/interfaces/LngLatAlt";
import { TransitionMode } from "../TransitionMode";
import { Image } from "../../graph/Image";
import { IGeometryProvider } from "../../mapillary";

export interface IStateBase {
    alpha: number;
    camera: Camera;
    currentIndex: number;
    geometry: IGeometryProvider,
    reference: LngLatAlt;
    // Per-image desired basic center [x, y], applied to an image as it becomes
    // current on a motionless (instant) transition so it renders already
    // oriented instead of flashing the carried view for one frame. Shared by
    // reference across state transitions.
    reorientations?: Map<string, number[]>;
    trajectory: Image[];
    transitionMode: TransitionMode;
    zoom: number;
}
