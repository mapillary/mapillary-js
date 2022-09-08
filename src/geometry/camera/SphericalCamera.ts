import { Camera } from "../Camera";

function bearing(point: number[]): number[] {
    const [x, y] = point;

    // Unprojection
    const lng = x * 2 * Math.PI;
    const lat = -y * 2 * Math.PI;

    const xb = Math.cos(lat) * Math.sin(lng);
    const yb = -Math.sin(lat);
    const zb = Math.cos(lat) * Math.cos(lng);

    return [xb, yb, zb];
}

function project(point: number[]): number[] {
    const [x, y, z] = point;

    // Projection
    const lng = Math.atan2(x, z);
    const lat = Math.atan2(-y, Math.sqrt(x * x + z * z));

    const xp = lng / (2 * Math.PI);
    const yp = -lat / (2 * Math.PI);

    return [xp, yp];
}

export const SPHERICAL_CAMERA_TYPE = "spherical";

export const SPHERICAL_PROJECT_FUNCTION = /* glsl */ `
vec2 projectToSfm(vec3 bearing) {
    float x = bearing.x;
    float y = bearing.y;
    float z = bearing.z;

    // Projection
    float lat = -asin(y);
    float lng = atan(x, z);

    float xn = lng / PI2;
    float yn = -lat / PI2;

    return vec2(xn, yn);
}
`;

export class SphericalCamera extends Camera {
    constructor() {
        super(
            SPHERICAL_CAMERA_TYPE,
            SPHERICAL_PROJECT_FUNCTION);
    }

    public bearingFromSfm(point: number[]): number[] {
        return bearing(point);
    }

    public projectToSfm(point: number[]): number[] {
        return project(point);
    }
}
