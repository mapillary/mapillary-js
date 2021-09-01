import { Transform } from "../../../geo/Transform";
import { CameraFrameBase } from "./CameraFrameBase";

export class PerspectiveCameraFrame extends CameraFrameBase {
    protected _makePositions(
        size: number,
        transform: Transform,
        origin: number[]): number[] {
        const samples = 8;
        const positions: number[] = [];
        positions.push(...this._makeDiags(size, transform, origin));
        positions.push(...this._makeFrame(size, samples, transform, origin));
        return positions;
    }

    private _makeDiags(
        size: number,
        transform: Transform,
        origin: number[])
        : number[] {

        const [originX, originY, originZ] = origin;

        const cameraCenter = [0, 0, 0];
        const positions: number[] = [];
        for (const vertex2d of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
            const corner = transform.unprojectBasic(vertex2d, size);
            corner[0] -= originX;
            corner[1] -= originY;
            corner[2] -= originZ;
            positions.push(
                ...cameraCenter,
                ...corner);
        }
        return positions;
    }

    private _makeFrame(
        size: number,
        samples: number,
        transform: Transform,
        origin: number[])
        : number[] {

        const vertices2d: number[][] = [];
        vertices2d.push(...this._subsample([0, 1], [0, 0], samples));
        vertices2d.push(...this._subsample([0, 0], [1, 0], samples));
        vertices2d.push(...this._subsample([1, 0], [1, 1], samples));

        const [originX, originY, originZ] = origin;
        const positions: number[] = [];
        for (const vertex2d of vertices2d) {
            const position =
                transform.unprojectBasic(
                    vertex2d, size);
            position[0] -= originX;
            position[1] -= originY;
            position[2] -= originZ;
            positions.push(...position);
        }
        return positions;
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
        samples.push(p1);
        for (let i = 0; i <= subsamples; i++) {
            const p: number[] = [];
            for (let j = 0; j < 3; j++) {
                p.push(this._interpolate(p1[j], p2[j], i / (subsamples + 1)));
            }
            samples.push(p);
            samples.push(p);
        }
        samples.push(p2);

        return samples;
    }
}
