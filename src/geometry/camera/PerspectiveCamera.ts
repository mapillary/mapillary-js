import { Camera } from "../Camera";
import { distortionFromDistortedRadius, makeRadialPeak } from "../Common";

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
    const dr = Math.sqrt(xd * xd + yd * yd);
    const d = distortionFromDistortedRadius(dr, k1, k2, radialPeak);

    const xp = xd / d;
    const yp = yd / d;

    // Unprojection
    const zp = 1;
    const length = Math.sqrt(xp * xp + yp * yp + zp * zp);

    const xb = xp / length;
    const yb = yp / length;
    const zb = zp / length;

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
    if (z <= 0) {
        return [
            x < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
            y < 0 ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
        ];
    }

    const xp = x / z;
    const yp = y / z;

    // Distortion
    let r2 = xp * xp + yp * yp;

    if (r2 > radialPeak * Math.sqrt(r2)) {
        r2 = radialPeak ** 2;
    }

    const distortion = 1 + r2 * (k1 + r2 * k2);

    const xd = xp * distortion;
    const yd = yp * distortion;

    // Transformation
    const xt = focal * xd;
    const yt = focal * yd;

    return [xt, yt];
}

export const PERSPECTIVE_CAMERA_TYPE = "perspective";

export const PERSPECTIVE_PROJECT_FUNCTION = /* glsl */ `
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

    float xp = x / z;
    float yp = y / z;

    // Distortion
    float r2 = xp * xp + yp * yp;

    if (r2 > radialPeak * sqrt(r2)) {
        r2 = radialPeak * radialPeak;
    }

    float distortion = 1.0 + r2 * (k1 + r2 * k2);

    float xd = xp * distortion;
    float yd = yp * distortion;

    // Transformation
    float xt = focal * xd;
    float yt = focal * yd;

    return vec2(xt, yt);
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
