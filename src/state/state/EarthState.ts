import { Clock, CatmullRomCurve3, Quaternion, Vector3 } from "three";

import { StateBase } from "./StateBase";
import { EulerRotation } from "../interfaces/EulerRotation";
import { IStateBase } from "../interfaces/IStateBase";
import { lerp, smootherstep, smoothstep } from "three/src/math/MathUtils";

export class EarthState extends StateBase {
    private _transition: number = 0;
    private _clock: Clock = new Clock();
    private _curveE: CatmullRomCurve3;
    private _curveF: CatmullRomCurve3;
    private _curveU: CatmullRomCurve3;
    private _focal0: number;
    private _focal1: number;

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

        const e1 = this._camera.position.clone();
        const f1 = forward.clone().normalize();
        const u1 = this._camera.up.clone();

        const e0 = e1.clone().add(f1.clone().multiplyScalar(10));
        const f0 = f1.clone();
        const u0 = u1.clone();

        const e2 = eye.clone();
        const f2 = lookat.clone().sub(eye).normalize();
        const u2 = new Vector3(0, 0, 1);

        const e3 = eye.clone().add(f2.clone().multiplyScalar(-10));
        const f3 = e2.clone().sub(e3).normalize();
        const u3 = u2.clone();

        this._curveE = new CatmullRomCurve3([e0, e1, e2, e3]);
        this._curveF = new CatmullRomCurve3([f0, f1, f2, f3]);
        this._curveU = new CatmullRomCurve3([u0, u1, u2, u3]);

        this._clock.start();

        this._focal0 = this._camera.focal;
        this._focal1 = 0.5 / Math.tan(Math.PI / 3);
    }

    private get _isTransitioning(): boolean {
        return this._transition < 1;
    }

    public dolly(delta: number): void {
        if (this._isTransitioning) {
            return;
        }

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
        if (this._isTransitioning) {
            return;
        }

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
        if (this._isTransitioning) {
            return;
        }

        const camera = this._camera;
        camera.position
            .add(new Vector3().fromArray(direction));
        camera.lookat
            .add(new Vector3().fromArray(direction));
    }

    public update(): void {
        if (!this._isTransitioning) {
            return;
        }

        const delta = this._clock.getDelta();
        this._transition = Math.min(this._transition + delta / 2, 1);
        const t = (smootherstep(this._transition, 0, 1) + 1) / 3;

        const eye = this._curveE.getPoint(t);
        const forward = this._curveF.getPoint(t);
        const up = this._curveU.getPoint(t);
        const focal = lerp(this._focal0, this._focal1, 3 * t - 1);

        this._camera.position.copy(eye);
        this._camera.lookat.copy(eye.clone().add(forward.multiplyScalar(10)));
        this._camera.up.copy(up);
        this._camera.focal = focal;
    }
}
