import { Transform } from "../../../geo/Transform";
import { CameraFrameBase } from "./CameraFrameBase";
import { CameraFrameLine } from "./CameraFrameLine";

export class SphericalCameraFrame extends CameraFrameBase {
    private readonly _latVertices: number;
    private readonly _lngVertices: number;

    constructor(
        originalSize: number,
        transform: Transform,
        scale: number,
        color: string) {
        super(originalSize);

        this._latVertices = 10;
        this._lngVertices = 6;

        const latV = this._latVertices;
        const lngV = this._lngVertices;
        const origin = transform.unprojectBasic([0, 0], 0, true);
        const axis =
            this._createAxis(transform, scale, origin, color);
        const lat =
            this._createLat(0.5, latV, transform, scale, origin, color);
        const lng1 =
            this._createLng(0, lngV, transform, scale, origin, color);
        const lng2 =
            this._createLng(0.25, lngV, transform, scale, origin, color);
        const lng3 =
            this._createLng(0.5, lngV, transform, scale, origin, color);
        const lng4 =
            this._createLng(0.75, lngV, transform, scale, origin, color);

        this._updateMatrixWorld(axis);
        this._updateMatrixWorld(lat);
        this._updateMatrixWorld(lng1);
        this._updateMatrixWorld(lng2);
        this._updateMatrixWorld(lng3);
        this._updateMatrixWorld(lng4);

        this.add(axis, lat, lng1, lng2, lng3, lng4);
    }

    private _calculateRelativeAxis(
        transform: Transform,
        origin: number[])
        : number[][] {
        const depth = this._originalSize;
        const north: number[] = transform.unprojectBasic([0.5, 0], depth * 1.1);
        const south: number[] = transform.unprojectBasic([0.5, 1], depth * 0.8);

        return this._makeRelative([north, south], origin);
    }

    private _calculateRelativeLatitude(
        basicY: number,
        numVertices: number,
        transform: Transform,
        origin: number[])
        : number[][] {

        const depth = 0.8 * this._originalSize;
        const positions: number[][] = [];

        for (let i: number = 0; i <= numVertices; i++) {
            const position: number[] =
                transform.unprojectBasic(
                    [i / numVertices, basicY], depth);
            positions.push(position);
        }

        return this._makeRelative(positions, origin);
    }

    private _calculateRelativeLng(
        basicX: number,
        numVertices: number,
        transform: Transform,
        origin: number[])
        : number[][] {
        const scaledDepth = 0.8 * this._originalSize;
        const positions: number[][] = [];

        for (let i: number = 0; i <= numVertices; i++) {
            const position: number[] =
                transform.unprojectBasic(
                    [basicX, i / numVertices], scaledDepth);

            positions.push(position);
        }

        return this._makeRelative(positions, origin);
    }

    private _createAxis(
        transform: Transform,
        scale: number,
        origin: number[],
        color: string)
        : CameraFrameLine {
        const positions = this._calculateRelativeAxis(transform, origin);
        return this._createCameraFrame(origin, positions, scale, color);
    }

    private _createLat(
        basicY: number,
        numVertices: number,
        transform: Transform,
        scale: number,
        origin: number[],
        color: string)
        : CameraFrameLine {
        const positions = this._calculateRelativeLatitude(
            basicY, numVertices, transform, origin);
        return this._createCameraFrame(origin, positions, scale, color);
    }

    private _createLng(
        basicX: number,
        numVertices: number,
        transform: Transform,
        scale: number,
        origin: number[],
        color: string)
        : CameraFrameLine {
        const positions = this._calculateRelativeLng(
            basicX, numVertices, transform, origin);
        return this._createCameraFrame(origin, positions, scale, color);
    }
}
