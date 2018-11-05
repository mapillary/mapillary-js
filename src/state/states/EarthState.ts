import * as THREE from "three";

import {
    InteractiveWaitingState,
    IRotation,
    IState,
    StateBase,
    TraversingState,
    WaitingState,
} from "../../State";
import {
    Camera,
} from "../../Geo";

export class EarthState extends StateBase {
    constructor(state: IState) {
        super(state);

        const viewingDirection: THREE.Vector3 = this._camera.lookat
            .clone()
            .sub(this._camera.position)
            .normalize();

        this._camera.lookat.copy(this._camera.position);
        this._camera.position.z = state.camera.position.z + 20;
        this._camera.position.x = state.camera.position.x - 16 * viewingDirection.x;
        this._camera.position.y = state.camera.position.y - 16 * viewingDirection.y;
        this._camera.up.set(0, 0, 1);
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

    public dolly(delta: number): void {
        const camera: Camera = this._camera;
        const offset: THREE.Vector3 = new THREE.Vector3()
            .copy(camera.position)
            .sub(camera.lookat);

        const length: number = offset.length();
        const scaled: number = length * Math.pow(2, -delta);
        const clipped: number = Math.max(1, Math.min(scaled, 1000));

        offset.normalize();
        offset.multiplyScalar(clipped);

        camera.position.copy(camera.lookat).add(offset);
    }

    public orbit(rotation: IRotation): void {
        const camera: Camera = this._camera;
        const q: THREE.Quaternion = new THREE.Quaternion().setFromUnitVectors(camera.up, new THREE.Vector3( 0, 0, 1 ));
        const qInverse: THREE.Quaternion = q.clone().inverse();

        const offset: THREE.Vector3 = new THREE.Vector3();
        offset.copy(camera.position).sub(camera.lookat);
        offset.applyQuaternion(q);
        const length: number = offset.length();

        let phi: number = Math.atan2(offset.y, offset.x);
        phi += rotation.phi;

        let theta: number = Math.atan2(Math.sqrt(offset.x * offset.x + offset.y * offset.y), offset.z);
        theta += rotation.theta;
        theta = Math.max(0.1, Math.min(Math.PI - 0.1, theta));

        offset.x = Math.sin(theta) * Math.cos(phi);
        offset.y = Math.sin(theta) * Math.sin(phi);
        offset.z = Math.cos(theta);
        offset.applyQuaternion(qInverse);

        camera.position.copy(camera.lookat).add(offset.multiplyScalar(length));
    }

    public truck(direction: number[]): void {
        this._camera.position.add(new THREE.Vector3().fromArray(direction));
        this._camera.lookat.add(new THREE.Vector3().fromArray(direction));
    }

    public update(): void { /*noop*/ }
}

export default EarthState;
