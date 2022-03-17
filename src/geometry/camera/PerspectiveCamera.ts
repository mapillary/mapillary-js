import { Camera } from "../Camera";
import { distortionFromDistortedRadius, makeRadialPeak } from "../Common";

function bearing(
    point: number[],
    parameters: number[],
    radialPeak: number): number[] {

    const [x, y] = point;
    const [focal, k1, k2] = parameters;

    const [dxn, dyn] = [x / focal, y / focal];
    const dr = Math.sqrt(dxn * dxn + dyn * dyn);
    const d = distortionFromDistortedRadius(dr, k1, k2, radialPeak);

    const xn = dxn / d;
    const yn = dyn / d;
    const zn = 1;
    const length = Math.sqrt(xn * xn + yn * yn + zn * zn);

    return [xn / length, yn / length, zn / length];
}

function project(
    point: number[],
    parameters: number[],
    radialPeak: number): number[] {

    const [x, y, z] = point;
    const [focal, k1, k2] = parameters;

    if (z > 0) {
        const xn = x / z;
        const yn = y / z;
        const rp2 = radialPeak ** 2;
        let r2 = xn * xn + yn * yn;
        if (r2 > rp2) {
            r2 = rp2;
        }

        const d = 1 + k1 * r2 + k2 * r2 ** 2;
        return [
            focal * d * xn,
            focal * d * yn,
        ];
    } else {
        return [
            x < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
            y < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
        ];
    }
}

export class PerspectiveCamera extends Camera {
    private readonly _radialPeak: number;

    constructor(parameters: number[]) {
        super('perspective', parameters);

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
