import { Quaternion, Vector3 } from "three";

import { StateBase } from "./StateBase";
import { EulerRotation } from "../interfaces/EulerRotation";
import { IStateBase } from "../interfaces/IStateBase";

export class EarthState extends StateBase {
    constructor(state: IStateBase) {
        super(state);

        const eye = this._camera.position.clone();
        const forward = this._camera.lookat
            .clone()
            .sub(eye)
            .normalize();
        const xy = Math.sqrt(forward.x * forward.x + forward.y * forward.y);
        const angle = Math.atan2(forward.z, xy);

        const lookat = new Vector3();
        if (angle > -Math.PI / 45) {
            lookat.copy(eye);
            eye.add(new Vector3(forward.x, forward.y, 0)
                .multiplyScalar(-50));
            eye.z = 30;
        } else {
            // Target a point on invented ground and keep forward direction
            const l0 = eye.clone();
            const n = new Vector3(0, 0, 1);
            const p0 = new Vector3(0, 0, -2);
            const d = new Vector3().subVectors(p0, l0).dot(n) / forward.dot(n);
            const maxDistance = 10000;
            const intersection = l0
                .clone()
                .add(
                    forward.
                        clone()
                        .multiplyScalar(Math.min(maxDistance, d)));
            lookat.copy(intersection);

            const t = eye
                .clone()
                .sub(intersection)
                .normalize();
            eye.copy(
                intersection.add(
                    t.multiplyScalar(Math.max(50, t.length()))));
        }

        this._camera.position.copy(eye);
        this._camera.lookat.copy(lookat);
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
        const q = new Quaternion()
            .setFromUnitVectors(
                camera.up,
                new Vector3(0, 0, 1));
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
        const threshold = Math.PI / 36;
        theta = Math.max(
            threshold,
            Math.min(
                Math.PI / 2 - threshold,
                theta));

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
            .add(new Vector3().fromArray(direction));
        camera.lookat
            .add(new Vector3().fromArray(direction));
    }

    public update(): void { /*noop*/ }
}
