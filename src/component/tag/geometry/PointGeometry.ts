/// <reference path="../../../../typings/index.d.ts" />

import {Geometry, GeometryTagError} from "../../../Component";
import {Transform} from "../../../Geo";

/**
 * @class PointGeometry
 * @classdesc Represents a point geometry in the basic coordinate system.
 */
export class PointGeometry extends Geometry {
    private _point: number[];

    /**
     * Create a point geometry.
     *
     * @constructor
     * @param {Array<number>} point - An array representing the basic coordinates of
     * the point.
     *
     * @throws {GeometryTagError} Point coordinates must be valid basic coordinates.
     */

    constructor(point: number[]) {
        super();

        let x: number = point[0];
        let y: number = point[1];

        if (x < 0 || x > 1 || y < 0 || y > 1) {
            throw new GeometryTagError("Basic coordinates must be on the interval [0, 1].");
        }

        this._point = point.slice();
    }

    /**
     * Get point property.
     * @returns {Array<number>} Array representing the basic coordinates of the point.
     */
    public get point(): number[] {
        return this._point;
    }

    /**
     * Get the 3D world coordinate for the centroid of the point, i.e. the 3D
     * world coordinate of the point itself.
     *
     * @param {Transform} transform - The transform of the node related to the point.
     * @returns {Array<number>} 3D world coordinate representing the centroid.
     */
    public getCentroid3d(transform: Transform): number[] {
        return transform.unprojectBasic(this._point, 200);
    }

    /**
     * Set the centroid of the point, i.e. the point coordinates.
     *
     * @param {Array<number>} value - The new value of the centroid.
     * @param {Transform} transform - The transform of the node related to the point.
     */
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
