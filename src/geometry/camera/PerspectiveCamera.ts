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

export const PERSPECTIVE_CAMERA_TYPE = "perspective";

export const PERSPECTIVE_PROJECT_FUNCTION = /* glsl */ `
vec2 projectToSfm(vec3 bearing, Parameters parameters, Uniforms uniforms) {
    float focal = parameters.focal;
    float k1 = parameters.k1;
    float k2 = parameters.k2;

    float radial_peak = uniforms.radial_peak;

    float x = bearing.x / bearing.z;
    float y = bearing.y / bearing.z;
    float r2 = x * x + y * y;

    if (r2 > radial_peak * sqrt(r2)) {
        r2 = radial_peak * radial_peak;
    }

    float d = 1.0 + k1 * r2 + k2 * r2 * r2;
    float xn = focal * d * x;
    float yn = focal * d * y;

    return vec2(xn, yn);
}
`;

export class PerspectiveCamera extends Camera {
    constructor(parameters: number[]) {
        super(
            PERSPECTIVE_CAMERA_TYPE,
            PERSPECTIVE_PROJECT_FUNCTION);

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
