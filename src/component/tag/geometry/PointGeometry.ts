/// <reference path="../../../../typings/browser.d.ts" />

import {Geometry, GeometryTagError} from "../../../Component";
import {Transform} from "../../../Geo";

export class PointGeometry extends Geometry {
    private _point: number[];

    constructor(point: number[]) {
        super();

        let x: number = point[0];
        let y: number = point[1];

        if (x < 0 || x > 1 || y < 0 || y > 1) {
            throw new GeometryTagError("Basic coordinates must be on the interval [0, 1].");
        }

        this._point = point.slice();
    }

    public get point(): number[] {
        return this._point;
    }

    public getCentroid3d(transform: Transform): number[] {
        return transform.unprojectBasic(this._point, 200);
    }

    public setCentroid2d(value: number[], transform: Transform): void {
        let changed: number[] = [
            Math.max(0, Math.min(1, value[0])),
            Math.max(0, Math.min(1, value[1])),
        ];

        this._point[0] = changed[0];
        this._point[1] = changed[1];

        this._notifyChanged$.onNext(this);
    }
}
