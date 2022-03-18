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

export class SphericalCamera extends Camera {
    constructor() { super('spherical'); }

    public bearingFromSfm(point: number[]): number[] {
        return bearing(point);
    }

    public projectToSfm(point: number[]): number[] {
        return project(point);
    }
}
