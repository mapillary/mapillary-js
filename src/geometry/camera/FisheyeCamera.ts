import { Camera } from "../Camera";
import { distortionFromDistortedRadius, makeRadialPeak } from "../Common";
import { EPSILON } from "../Constants";

function bearing(
    point: number[],
    parameters: number[],
    radialPeak: number): number[] {

    const [x, y] = point;
    const [focal, k1, k2] = parameters;

    const [dxn, dyn] = [x / focal, y / focal];
    const dTheta = Math.sqrt(dxn * dxn + dyn * dyn);
    const d = distortionFromDistortedRadius(dTheta, k1, k2, radialPeak);
    const theta = dTheta / d;
    const r = Math.sin(theta);
    const denomTheta = dTheta > EPSILON ? 1 / dTheta : 1;

    const xn = r * dxn * denomTheta;
    const yn = r * dyn * denomTheta;
    const zn = Math.cos(theta);

    return [xn, yn, zn];
}

function project(
    point: number[],
    parameters: number[],
    radialPeak: number): number[] {

    const [x, y, z] = point;
    const [focal, k1, k2] = parameters;

    if (z > 0) {
        const r = Math.sqrt(x * x + y * y);
        let theta = Math.atan2(r, z);
        if (theta > radialPeak) {
            theta = radialPeak;
        }

        const distortion = 1.0 + theta ** 2 * (k1 + theta ** 2 * k2);
        const s = focal * distortion * theta / r;

        return [s * x, s * y];
    } else {
        return [
            x < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
            y < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
        ];
    }
}

export class FisheyeCamera extends Camera {
    private readonly _radialPeak: number;

    constructor(parameters: number[]) {
        super('fisheye', parameters);

        const [_, k1, k2] = this.parameters;
        this._radialPeak = makeRadialPeak(k1, k2);
    }

    public bearing(point: number[]): number[] {
        return bearing(point, this.parameters, this._radialPeak);
    }

    public project(point: number[]): number[] {
        return project(point, this.parameters, this._radialPeak);
    }
}
