import {Geometry, GeometryTagError} from "../../../Component";
import {Transform} from "../../../Geo";

/**
 * @class PointGeometry
 *
 * @classdesc Represents a point geometry in the 2D basic image coordinate system.
 *
 * @example
 * ```
 * var basicPoint = [0.5, 0.7];
 * var pointGeometry = new Mapillary.TagComponent.PointGeometry(basicPoint);
 * ```
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
     * Get the 2D basic coordinates for the centroid of the point, i.e. the 2D
     * basic coordinates of the point itself.
     *
     * @returns {Array<number>} 2D basic coordinates representing the centroid.
     * @ignore
     */
    public getCentroid2d(): number[] {
        return this._point.slice();
    }

    /**
     * Get the 3D world coordinates for the centroid of the point, i.e. the 3D
     * world coordinates of the point itself.
     *
     * @param {Transform} transform - The transform of the node related to the point.
     * @returns {Array<number>} 3D world coordinates representing the centroid.
     * @ignore
     */
    public getCentroid3d(transform: Transform): number[] {
        return transform.unprojectBasic(this._point, 200);
    }

    /**
     * Set the centroid of the point, i.e. the point coordinates.
     *
     * @param {Array<number>} value - The new value of the centroid.
     * @param {Transform} transform - The transform of the node related to the point.
     * @ignore
     */
    public setCentroid2d(value: number[], transform: Transform): void {
        let changed: number[] = [
            Math.max(0, Math.min(1, value[0])),
            Math.max(0, Math.min(1, value[1])),
        ];

        this._point[0] = changed[0];
        this._point[1] = changed[1];

        this._notifyChanged$.next(this);
    }
}

export default PointGeometry;
