import { CatmullRomCurve3, MathUtils, Quaternion, Vector3 } from "three";

import { StateBase } from "./StateBase";
import { EulerRotation } from "../interfaces/EulerRotation";
import { IStateBase } from "../interfaces/IStateBase";

export class EarthState extends StateBase {
    private _transition: number = 0;
    private _curveE: CatmullRomCurve3;
    private _curveL: CatmullRomCurve3;
    private _curveU: CatmullRomCurve3;
    private _zoom0: number;
    private _zoom1: number;

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

        const eye1 = this._camera.position.clone();
        const lookat1 = eye1.clone().add(forward.clone().normalize().multiplyScalar(10));
        const up1 = this._camera.up.clone();

        const eye0 = lookat1.clone();
        const lookat0 = eye0.clone().add(forward.clone().normalize().multiplyScalar(10));
        const up0 = up1.clone();

        const eye2 = eye.clone();
        const lookat2 = lookat.clone();
        const up2 = new Vector3(0, 0, 1);

        const eye3 = eye.clone().add(lookat2.clone().sub(eye2).normalize().multiplyScalar(-10));
        const lookat3 = lookat2.clone();
        const up3 = up2.clone();

        this._curveE = new CatmullRomCurve3([eye0, eye1, eye2, eye3]);
        this._curveL = new CatmullRomCurve3([lookat0, lookat1, lookat2, lookat3]);
        this._curveU = new CatmullRomCurve3([up0, up1, up2, up3]);

        this._zoom0 = this._zoom;
        this._zoom1 = 0;
        this._camera.focal = 0.5 / Math.tan(Math.PI / 4);
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

    public update(delta: number): void {
        if (!this._isTransitioning) {
            return;
        }

        this._transition = Math.min(this._transition + 2 * delta / 3, 1);
        const sta = MathUtils.smootherstep(this._transition, 0, 1);
        const t = (sta + 1) / 3;

        const eye = this._curveE.getPoint(t);
        const lookat = this._curveL.getPoint(t);
        const up = this._curveU.getPoint(t);

        this._camera.position.copy(eye);
        this._camera.lookat.copy(lookat);
        this._camera.up.copy(up);
        this._zoom = MathUtils.lerp(this._zoom0, this._zoom1, sta);
        this._stateTransitionAlpha = sta;
    }

    protected _getStateTransitionAlpha(): number {
        return this._stateTransitionAlpha;
    }
}
