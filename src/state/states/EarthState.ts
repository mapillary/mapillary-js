import * as THREE from "three";

import {
    IState,
    StateBase,
    TraversingState,
    InteractiveWaitingState,
    WaitingState,
} from "../../State";

export class EarthState extends StateBase {
    constructor(state: IState) {
        super(state);

        const viewingDirection: THREE.Vector3 = this._camera.lookat
            .clone()
            .sub(this._camera.position)
            .normalize();

        this._camera.lookat.copy(this._camera.position);
        this._camera.position.z = state.camera.position.z + 10;
        this._camera.position.x = state.camera.position.x - 8 * viewingDirection.x;
        this._camera.position.y = state.camera.position.y - 8 * viewingDirection.y;
    }

    public traverse(): StateBase {
        return new TraversingState(this);
    }

    public wait(): StateBase {
        return new WaitingState(this);
    }

    public waitInteractively(): StateBase {
        return new InteractiveWaitingState(this);
    }

    public pan(direction: number[]): void {
        this._camera.position.add(new THREE.Vector3().fromArray(direction));
        this._camera.lookat.add(new THREE.Vector3().fromArray(direction));
    }

    public update(): void { /*noop*/ }
}

export default EarthState;
