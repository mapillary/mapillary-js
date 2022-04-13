import { Camera } from "../Camera";
import { distortionFromDistortedRadius, makeRadialPeak } from "../Common";
import { EPSILON } from "../Constants";

type Parameters = {
    focal: number,
    k1: number,
    k2: number,
};

type Uniforms = {
    radialPeak: number | number[],
};

function bearing(
    point: number[],
    parameters: Parameters,
    uniforms: Uniforms): number[] {

    const [x, y] = point;
    const { focal, k1, k2 } = parameters;
    const radialPeak = <number>uniforms.radialPeak;

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
    const radialPeak = <number>uniforms.radialPeak;

    if (z > 0) {
        const r = Math.sqrt(x * x + y * y);
        let theta = Math.atan2(r, z);
        if (theta > radialPeak) {
            theta = radialPeak;
        }

        const theta2 = theta ** 2;
        const distortion = 1.0 + theta2 * (k1 + theta2 * k2);
        const s = focal * theta * distortion / r;

        return [s * x, s * y];
    } else {
        return [
            x < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
            y < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
        ];
    }
}

export const FISHEYE_CAMERA_TYPE = "fisheye";

export const FISHEYE_PROJECT_FUNCTION = /* glsl */ `
vec2 projectToSfm(vec3 bearing, Parameters parameters, Uniforms uniforms) {
    float focal = parameters.focal;
    float k1 = parameters.k1;
    float k2 = parameters.k2;

    float radialPeak = uniforms.radialPeak;

    float x = bearing.x;
    float y = bearing.y;
    float z = bearing.z;

    float r = sqrt(x * x + y * y);
    float theta = atan(r, z);

    if (theta > radialPeak) {
        theta = radialPeak;
    }

    float theta2 = theta * theta;
    float distortion = 1.0 + theta2 * (k1 + theta2 * k2);
    float s = focal * theta * distortion / r;

    float xn = s * x;
    float yn = s * y;

    return vec2(xn, yn);
}
`;

export class FisheyeCamera extends Camera {
    constructor(parameters: number[]) {
        super(
            FISHEYE_CAMERA_TYPE,
            FISHEYE_PROJECT_FUNCTION);

        const [focal, k1, k2] = parameters;
        this.parameters.focal = focal;
        this.parameters.k1 = k1;
        this.parameters.k2 = k2;

        const radialPeak = makeRadialPeak(k1, k2);
        this.uniforms.radialPeak = radialPeak;
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
