import { Camera } from "../Camera";

function bearing(point: number[]): number[] {
    const [x, y] = point;

    const lng = x * 2 * Math.PI;
    const lat = -y * 2 * Math.PI;

    const xn = Math.cos(lat) * Math.sin(lng);
    const yn = -Math.sin(lat);
    const zn = Math.cos(lat) * Math.cos(lng);

    return [xn, yn, zn];
}

function project(point: number[]): number[] {
    const [x, y, z] = point;

    const lng = Math.atan2(x, z);
    const lat = Math.atan2(-y, Math.sqrt(x * x + z * z));

    const xn = lng / (2 * Math.PI);
    const yn = -lat / (2 * Math.PI);

    return [xn, yn];
}

export const SPHERICAL_CAMERA_TYPE = "spherical";

export const SPHERICAL_PROJECT_FUNCTION = /* glsl */ `
vec2 projectToSfm(vec3 bearing) {
    float x = bearing.x;
    float y = bearing.y;
    float z = bearing.z;

    float lat = -asin(y);
    float lng = atan(x, z);
    float xn = lng / PI2;
    float yn = -lat / PI2;

    return vec2(xn, yn);
}
`;

export class SphericalCamera extends Camera {
    public readonly projectToSfmFunction: string = SPHERICAL_PROJECT_FUNCTION;

    constructor() { super(SPHERICAL_CAMERA_TYPE); }

    public bearingFromSfm(point: number[]): number[] {
        return bearing(point);
    }

    public projectToSfm(point: number[]): number[] {
        return project(point);
    }
}
