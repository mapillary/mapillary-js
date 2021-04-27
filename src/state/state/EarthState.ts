import * as THREE from "three";

import { StateBase } from "./StateBase";
import { EulerRotation } from "../interfaces/EulerRotation";
import { IStateBase } from "../interfaces/IStateBase";

export class EarthState extends StateBase {
    constructor(state: IStateBase) {
        super(state);

        const lookat = this._camera.lookat;
        const position = this._camera.position;
        const viewingDirection = lookat
            .clone()
            .sub(position)
            .normalize();

        lookat.copy(position);
        lookat.z = -2;

        position.x -= 16 * viewingDirection.x;
        position.y -= 16 * viewingDirection.y;
        position.z = position.z < lookat.z ?
            position.z - 20 : position.z + 20;

        this._camera.up.set(0, 0, 1);
    }

    public dolly(delta: number): void {
        const camera = this._camera;
        const offset = camera.position
            .clone()
            .sub(camera.lookat);

        const length = offset.length();
        const scaled = length * Math.pow(2, -delta);
        const clipped = Math.max(1, Math.min(scaled, 4000));

        offset.normalize();
        offset.multiplyScalar(clipped);

        camera.position
            .copy(camera.lookat)
            .add(offset);
    }

    public orbit(rotation: EulerRotation): void {
        const camera = this._camera;
        const q = new THREE.Quaternion()
            .setFromUnitVectors(
                camera.up,
                new THREE.Vector3(0, 0, 1));
        const qInverse = q
            .clone()
            .invert();

        const offset = camera.position
            .clone()
            .sub(camera.lookat);
        offset.applyQuaternion(q);
        const length = offset.length();

        let phi = Math.atan2(offset.y, offset.x);
        phi += rotation.phi;

        let theta = Math.atan2(
            Math.sqrt(offset.x * offset.x + offset.y * offset.y),
            offset.z);
        theta += rotation.theta;
        theta = Math.max(0.1, Math.min(Math.PI - 0.1, theta));

        offset.x = Math.sin(theta) * Math.cos(phi);
        offset.y = Math.sin(theta) * Math.sin(phi);
        offset.z = Math.cos(theta);
        offset.applyQuaternion(qInverse);

        camera.position
            .copy(camera.lookat)
            .add(offset.multiplyScalar(length));
    }

    public truck(direction: number[]): void {
        const camera = this._camera;
        camera.position
            .add(new THREE.Vector3().fromArray(direction));
        camera.lookat
            .add(new THREE.Vector3().fromArray(direction));
    }

    public update(): void { /*noop*/ }
}
