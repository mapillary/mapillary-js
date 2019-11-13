import {Geometry, GeometryTagError} from "../../../Component";
import {Transform} from "../../../Geo";

/**
 * @class PointsGeometry
 *
 * @classdesc Represents a point set geometry in the 2D basic image coordinate system.
 *
 * @example
 * ```
 * var points = [[0.5, 0.3], [0.7, 0.3], [0.6, 0.5], [0.5, 0.3]];
 * var pointsGeometry = new Mapillary.TagComponent.PointsGeometry(points);
 * ```
 */
export class PointsGeometry extends Geometry {
    private _points: number[][];

    /**
     * Create a points geometry.
     *
     * @constructor
     * @param {Array<Array<number>>} points - Array of 2D points on the basic coordinate
     * system. The number of points must be greater than or equal to two.
     *
     * @throws {GeometryTagError} Point coordinates must be valid basic coordinates.
     */
    constructor(points: number[][]) {
        super();

        const pointsLength: number = points.length;

        if (pointsLength < 2) {
            throw new GeometryTagError("A points geometry must have two or more positions.");
        }

        this._points = [];
        for (const point of points) {
            if (point[0] < 0 || point[0] > 1 ||
                point[1] < 0 || point[1] > 1) {
                throw new GeometryTagError("Basic coordinates of points must be on the interval [0, 1].");
            }

            this._points.push(point.slice());
        }
    }

    /**
     * Get points property.
     * @returns {Array<Array<number>>} Array of 2d points.
     */
    public get points(): number[][] {
        return this._points;
    }

    /**
     * Add a point to the point set.
     *
     * @param {Array<number>} point - Point to add.
     * @ignore
     */
    public addPoint2d(point: number[]): void {
        const clamped: number[] = [
            Math.max(0, Math.min(1, point[0])),
            Math.max(0, Math.min(1, point[1])),
        ];

        this._points.push(clamped);

        this._notifyChanged$.next(this);
    }

    /**
     * Get the coordinates of a point from the point set representation of the geometry.
     *
     * @param {number} index - Point index.
     * @returns {Array<number>} Array representing the 2D basic coordinates of the point.
     * @ignore
     */
    public getPoint2d(index: number): number[] {
        return this._points[index].slice();
    }

    /**
     * Remove a point from the point set.
     *
     * @param {number} index - The index of the point to remove.
     * @ignore
     */
    public removePoint2d(index: number): void {
        if (index < 0 ||
            index >= this._points.length ||
            this._points.length < 3) {
            throw new GeometryTagError("Index for removed point must be valid.");
        }

        this._points.splice(index, 1);

        this._notifyChanged$.next(this);
    }

    /** @ignore */
    public setPoint2d(index: number, value: number[], transform: Transform): void {
        const changed: number[] = [
            Math.max(0, Math.min(1, value[0])),
            Math.max(0, Math.min(1, value[1])),
        ];

        this._points[index] = changed;

        this._notifyChanged$.next(this);
    }

    /** @ignore */
    public getPoints3d(transform: Transform): number[][] {
        return this._getPoints3d(this._points, transform);
    }

    /** @ignore */
    public getPoint3d(index: number, transform: Transform): number[] {
        return transform.unprojectBasic(this._points[index], 200);
    }

    /** @ignore */
    public getPoints2d(): number[][] {
        return this._points.slice();
    }

    /** @ignore */
    public getCentroid2d(): number[] {
        const points: number[][] = this._points;

        let centroidX: number = 0;
        let centroidY: number = 0;

        for (let i: number = 0; i < points.length - 1; i++) {
            centroidX += points[i][0];
            centroidY += points[i][1];
        }

        centroidX /= points.length;
        centroidY /= points.length;

        return [centroidX, centroidY];
    }

    /** @ignore */
    public getCentroid3d(transform: Transform): number[] {
        let centroid2d: number[] = this.getCentroid2d();

        return transform.unprojectBasic(centroid2d, 200);
    }

    public getRect2d(transform: Transform): number[] {
        let minX: number = 1;
        let maxX: number = 0;
        let minY: number = 1;
        let maxY: number = 0;

        for (const point of this._points) {
            if (point[0] < minX) {
                minX = point[0];
            }

            if (point[0] > maxX) {
                maxX = point[0];
            }

            if (point[1] < minY) {
                minY = point[1];
            }

            if (point[1] > maxY) {
                maxY = point[1];
            }
        }

        return [minX, minY, maxX, maxY];
    }

    public setCentroid2d(value: number[], transform: Transform): void {
        throw new Error("Not implemented");
    }

    private _getPoints3d(points2d: number[][], transform: Transform): number[][] {
        return points2d
            .map(
                (point: number[]) => {
                    return transform.unprojectBasic(point, 200);
                });
    }
}

export default PointsGeometry;
