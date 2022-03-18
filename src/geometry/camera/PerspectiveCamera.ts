import { Camera } from "../Camera";
import { distortionFromDistortedRadius, makeRadialPeak } from "../Common";

type Parameters = {
    focal: number,
    k1: number,
    k2: number,
};

type Uniforms = {
    radial_peak: number | number[],
};

function bearing(
    point: number[],
    parameters: Parameters,
    uniforms: Uniforms): number[] {

    const [x, y] = point;
    const { focal, k1, k2 } = parameters;
    const radialPeak = <number>uniforms.radial_peak;

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
    parameters: Parameters,
    uniforms: Uniforms): number[] {

    const [x, y, z] = point;
    const { focal, k1, k2 } = parameters;
    const radialPeak = <number>uniforms.radial_peak;

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
    constructor(parameters: number[]) {
        super('perspective');

        const [focal, k1, k2] = parameters;
        this.parameters.focal = focal;
        this.parameters.k1 = k1;
        this.parameters.k2 = k2;

        const radialPeak = makeRadialPeak(k1, k2);
        this.uniforms.radial_peak = radialPeak;
    }

    public bearingFromSfm(point: number[]): number[] {
        return bearing(
            point,
            <Parameters>this.parameters,
            <Uniforms>this.uniforms);
    }

    public projectToSfm(point: number[]): number[] {
        return project(
            point,
            <Parameters>this.parameters,
            <Uniforms>this.uniforms);
    }
}
