import { Camera } from "../Camera";
import { distortionFromDistortedRadius, makeRadialPeak } from "../Common";
import { EPSILON } from "../Constants";

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
    parameters: Parameters,
    uniforms: Uniforms): number[] {

    const [x, y, z] = point;
    const { focal, k1, k2 } = parameters;
    const radialPeak = <number>uniforms.radial_peak;

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
