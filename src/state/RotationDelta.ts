import {
    IRotation,
} from "../State";

export class RotationDelta implements IRotation {
    private _phi: number;
    private _theta: number;

    constructor(phi: number, theta: number) {
        this._phi = phi;
        this._theta = theta;
    }

    public get phi(): number {
        return this._phi;
    }

    public set phi(value: number) {
        this._phi = value;
    }

    public get theta(): number {
        return this._theta;
    }

    public set theta(value: number) {
        this._theta = value;
    }

    public get isZero(): boolean {
        return this._phi === 0 && this._theta === 0;
    }

    public copy(delta: IRotation): void {
        this._phi = delta.phi;
        this._theta = delta.theta;
    }

    public lerp(other: IRotation, alpha: number): void {
        this._phi =  (1 - alpha) * this._phi + alpha * other.phi;
        this._theta =  (1 - alpha) * this._theta + alpha * other.theta;
    }

    public multiply(value: number): void {
        this._phi *= value;
        this._theta *= value;
    }

    public threshold(value: number): void {
        this._phi = Math.abs(this._phi) > value ? this._phi : 0;
        this._theta = Math.abs(this._theta) > value ? this._theta : 0;
    }

    public lengthSquared(): number {
        return this._phi * this._phi + this._theta * this._theta;
    }

    public reset(): void {
        this._phi = 0;
        this._theta = 0;
    }
}

export default RotationDelta;
