import { IStateBase } from "../interfaces/IStateBase";
import { TraversingState } from "./TraversingState";
import { Image } from "../../graph/Image";
import { Vector3 } from "three";

const UP = new Vector3(0, 0, 1);

export class GravityTraversingState extends TraversingState {
    constructor(state: IStateBase) {
        super(state);
        this._camera.up.copy(UP);
        this._alignCameras();
        this._alignTrajectory();
    }

    public append(images: Image[]): void {
        super.append(images);
        this._alignTrajectory();
    }

    public prepend(images: Image[]): void {
        super.prepend(images);
        this._alignTrajectory();
    }

    public set(images: Image[]): void {
        super.set(images);
        this._alignCameras();
        this._alignTrajectory();
    }

    public update(delta: number): void {
        super.update(delta);
    }

    private _alignTrajectory(): void {
        for (const camera of this._trajectoryCameras) {
            camera.up.copy(UP);
        }
    }

    private _alignCameras(): void {
        this._previousCamera?.up.copy(UP);
        this._currentCamera?.up.copy(UP);

    }
}
