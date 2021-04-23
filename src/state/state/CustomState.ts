import { Matrix4, Vector3 } from "three";
import { StateBase } from "./StateBase";
import { IStateBase } from "../interfaces/IStateBase";

export class CustomState extends StateBase {
    constructor(state: IStateBase) {
        super(state);
    }

    public setViewMatrix(viewMatrix: number[]): void {
        const viewMatrixInverse = new Matrix4()
            .fromArray(viewMatrix)
            .invert();

        const me = viewMatrixInverse.elements;
        const eye = new Vector3(me[12], me[13], me[14]);
        const forward = new Vector3(-me[8], -me[9], -me[10]);
        const up = new Vector3(me[4], me[5], me[6]);

        const camera = this._camera;
        camera.position.copy(eye);
        camera.lookat.copy(eye
            .clone()
            .add(forward));
        camera.up.copy(up);

        const focal = 0.5 / Math.tan(Math.PI / 3);
        camera.focal = focal;
    }
}
