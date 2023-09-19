import { Camera } from "../Camera";
import { distortionFromDistortedRadius, makeRadialPeak } from "../Common";
import { EPSILON } from "../Constants";

type Parameters = {
    focal: number,
    k1: number,
    k2: number,
};

type Uniforms = {
    radialPeak: number,
};

function bearing(
    point: number[],
    parameters: Parameters,
    uniforms: Uniforms): number[] {

    const [x, y] = point;
    const { focal, k1, k2 } = parameters;
    const radialPeak = <number>uniforms.radialPeak;

    // Transformation
    const [xd, yd] = [x / focal, y / focal];

    // Undistortion
    const dTheta = Math.sqrt(xd * xd + yd * yd);
    const d = distortionFromDistortedRadius(dTheta, k1, k2, radialPeak);

    const theta = dTheta / d;

    // Unprojection
    const r = Math.sin(theta);
    const denomTheta = dTheta > EPSILON ? 1 / dTheta : 1;

    const xb = r * xd * denomTheta;
    const yb = r * yd * denomTheta;
    const zb = Math.cos(theta);

    return [xb, yb, zb];
}

function project(
    point: number[],
    parameters: Parameters,
    uniforms: Uniforms): number[] {

    const [x, y, z] = point;
    const { focal, k1, k2 } = parameters;
    const radialPeak = <number>uniforms.radialPeak;

    // Projection
    const r = Math.sqrt(x * x + y * y);
    let theta = Math.atan2(r, z);

    if (theta > radialPeak) {
        theta = radialPeak;
    }

    const xp = theta / r * x;
    const yp = theta / r * y;

    // Distortion
    const theta2 = theta ** 2;
    const distortion = 1.0 + theta2 * (k1 + theta2 * k2);

    const xd = xp * distortion;
    const yd = yp * distortion;

    // Transformation
    const xt = focal * xd;
    const yt = focal * yd;

    return [xt, yt];
}

export const FISHEYE_CAMERA_TYPE = "fisheye";

export const FISHEYE_PROJECT_FUNCTION = /* glsl */ `
vec2 projectToSfm(vec3 bearing, Parameters parameters, Uniforms uniforms) {
    float x = bearing.x;
    float y = bearing.y;
    float z = bearing.z;

    float focal = parameters.focal;
    float k1 = parameters.k1;
    float k2 = parameters.k2;

    float radialPeak = uniforms.radialPeak;

    // Projection
    if (z < 0.) {
        return vec2(POSITIVE_INFINITY, POSITIVE_INFINITY);
    }

    float r = sqrt(x * x + y * y);
    float theta = atan(r, z);

    if (theta > radialPeak) {
        theta = radialPeak;
    }

    float xp = theta / r * x;
    float yp = theta / r * y;

    // Distortion
    float theta2 = theta * theta;
    float distortion = 1.0 + theta2 * (k1 + theta2 * k2);

    float xd = xp * distortion;
    float yd = yp * distortion;

    // Transformation
    float xt = focal * xd;
    float yt = focal * yd;

    return vec2(xt, yt);
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
