import { LineBasicMaterial } from "three";
import { Transform } from "../../../geo/Transform";
import { CameraFrameBase } from "./CameraFrameBase";
import { CameraFrameLine } from "./CameraFrameLine";
import { CameraFrameLineSegments } from "./CameraFrameLineSegments";

export class PerspectiveCameraFrame extends CameraFrameBase {
    private readonly _horizontalFrameSamples: number;
    private readonly _verticalFrameSamples: number;

    constructor(
        originalSize: number,
        transform: Transform,
        scale: number,
        color: string) {
        super(originalSize);

        this._horizontalFrameSamples = 8;
        this._verticalFrameSamples = 6;

        const origin = transform.unprojectBasic([0, 0], 0, true);
        const frame = this._createFrame(transform, scale, origin, color);
        const diagonals = this._createDiagonals(transform, scale, origin, color);

        this._updateMatrixWorld(frame);
        this._updateMatrixWorld(diagonals);

        this.add(frame, diagonals);
    }

    private _calculateRelativeDiagonals(
        transform: Transform,
        origin: number[])
        : number[][] {
        const depth = this._originalSize;
        const [topLeft, topRight, bottomRight, bottomLeft] =
            this._makeRelative(
                [
                    transform.unprojectBasic([0, 0], depth, true),
                    transform.unprojectBasic([1, 0], depth, true),
                    transform.unprojectBasic([1, 1], depth, true),
                    transform.unprojectBasic([0, 1], depth, true),
                ],
                origin);

        const cameraCenter = [0, 0, 0];
        const vertices: number[][] = [
            cameraCenter, topLeft,
            cameraCenter, topRight,
            cameraCenter, bottomRight,
            cameraCenter, bottomLeft,
        ];

        return vertices;
    }

    private _calculateRelativeFrame(
        transform: Transform,
        origin: number[])
        : number[][] {
        const vertices2d: number[][] = [];
        const vertical = this._verticalFrameSamples;
        const horizontal = this._horizontalFrameSamples;
        const cameraSize = this._originalSize;

        vertices2d.push(...this._subsample([0, 1], [0, 0], vertical));
        vertices2d.push(...this._subsample([0, 0], [1, 0], horizontal));
        vertices2d.push(...this._subsample([1, 0], [1, 1], vertical));

        const vertices3d = vertices2d
            .map(
                (basic: number[]): number[] => {
                    return transform.unprojectBasic(basic, cameraSize, true);
                });

        return this._makeRelative(vertices3d, origin);
    }

    private _createDiagonals(
        transform: Transform,
        scale: number,
        origin: number[],
        color: string)
        : CameraFrameLineSegments {
        const positions = this._calculateRelativeDiagonals(transform, origin);
        const geometry = this._createBufferGeometry(positions);
        const material = new LineBasicMaterial({
            vertexColors: true,
            fog: false,
        });
        const diagonals = new CameraFrameLineSegments(
            geometry,
            material,
            origin,
            positions);
        this._updatePositionAttribute(diagonals, scale);
        this._updateColorAttribute(diagonals, color);
        return diagonals;
    }

    private _createFrame(
        transform: Transform,
        scale: number,
        origin: number[],
        color: string)
        : CameraFrameLine {
        const positions = this._calculateRelativeFrame(transform, origin);
        return this._createCameraFrame(origin, positions, scale, color);
    }

    private _interpolate(a: number, b: number, alpha: number): number {
        return a + alpha * (b - a);
    }

    private _subsample(
        p1: number[],
        p2: number[],
        subsamples: number)
        : number[][] {
        if (subsamples < 1) {
            return [p1, p2];
        }

        const samples: number[][] = [];

        for (let i: number = 0; i <= subsamples + 1; i++) {
            const p: number[] = [];

            for (let j: number = 0; j < 3; j++) {
                p.push(this._interpolate(p1[j], p2[j], i / (subsamples + 1)));
            }

            samples.push(p);
        }

        return samples;
    }
}
