import { Transform } from "../../../geo/Transform";
import { CameraFrameBase } from "./CameraFrameBase";

export class SphericalCameraFrame extends CameraFrameBase {
    protected _makePositions(
        size: number,
        transform: Transform,
        origin: number[]): number[] {

        const vs = 10;
        const positions: number[] = [];
        positions.push(...this._makeAxis(size, transform, origin));
        positions.push(...this._makeLat(0.5, vs, size, transform, origin));
        for (const lat of [0, 0.25, 0.5, 0.75]) {
            positions
                .push(...this._makeLng(lat, vs, size, transform, origin));
        }
        return positions;
    }

    private _makeAxis(
        size: number,
        transform: Transform,
        origin: number[])
        : number[] {
        const south = transform.unprojectBasic([0.5, 1], 0.8 * size);
        const north = transform.unprojectBasic([0.5, 0], 1.2 * size);
        return [
            south[0] - origin[0],
            south[1] - origin[1],
            south[2] - origin[2],
            north[0] - origin[0],
            north[1] - origin[1],
            north[2] - origin[2],
        ];
    }

    private _makeLat(
        basicY: number,
        numVertices: number,
        size: number,
        transform: Transform,
        origin: number[])
        : number[] {

        const dist = 0.8 * size;
        const [originX, originY, originZ] = origin;
        const positions: number[] = [];
        const first = transform.unprojectBasic([0, basicY], dist);
        first[0] -= originX;
        first[1] -= originY;
        first[2] -= originZ;
        positions.push(...first);

        for (let i = 1; i <= numVertices; i++) {
            const position =
                transform.unprojectBasic(
                    [i / numVertices, basicY], dist);
            position[0] -= originX;
            position[1] -= originY;
            position[2] -= originZ;
            positions.push(
                ...position,
                ...position);
        }
        positions.push(...first);
        return positions;
    }

    private _makeLng(
        basicX: number,
        numVertices: number,
        size: number,
        transform: Transform,
        origin: number[])
        : number[] {

        const dist = 0.8 * size;
        const [originX, originY, originZ] = origin;
        const positions: number[] = [];
        const first = transform.unprojectBasic([basicX, 0], dist);
        first[0] -= originX;
        first[1] -= originY;
        first[2] -= originZ;
        positions.push(...first);

        for (let i = 0; i <= numVertices; i++) {
            const position =
                transform.unprojectBasic(
                    [basicX, i / numVertices], dist);
            position[0] -= originX;
            position[1] -= originY;
            position[2] -= originZ;
            positions.push(
                ...position,
                ...position);
        }
        positions.push(...first);
        return positions;
    }
}
