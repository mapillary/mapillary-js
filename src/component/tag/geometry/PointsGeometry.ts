import {Geometry, GeometryTagError} from "../../../Component";
import {Transform} from "../../../Geo";

/**
 * @class PointsGeometry
 *
 * @classdesc Represents a point set in the 2D basic image coordinate system.
 *
 * @example
 * ```
 * var points = [[0.5, 0.3], [0.7, 0.3], [0.6, 0.5]];
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
    public setVertex2d(index: number, value: number[], transform: Transform): void {
        this.setPoint2d(index, value, transform);
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
    public getCentroid2d(transform?: Transform): number[] {
        if (!transform) {
            throw new GeometryTagError("Get centroid must be called with a transform for points geometries.");
        }

        const [minX, minY, maxX, maxY]: number[] = this.getRect2d(transform);

        const centroidX: number = minX < maxX ?
            (minX + maxX) / 2 :
            ((minX + maxX + 1) / 2) % 1;

        const centroidY: number = (minY + maxY) / 2;

        return [centroidX, centroidY];
    }

    /** @ignore */
    public getCentroid3d(transform: Transform): number[] {
        let centroid2d: number[] = this.getCentroid2d();

        return transform.unprojectBasic(centroid2d, 200);
    }

    /** @ignore */
    public getRect2d(transform: Transform): number[] {
        let minX: number = 1;
        let maxX: number = 0;
        let minY: number = 1;
        let maxY: number = 0;

        const points: number[][] = this._points;

        for (const point of points) {
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

        if (transform.fullPano) {
            const indices: number[] = [];
            for (let i: number = 0; i < points.length; i++) {
                indices[i] = i;
            }

            indices.sort(
                (a, b): number => {
                    return points[a][0] < points[b][0] ?
                        -1 :
                        points[a][0] > points[b][0] ?
                            1 :
                            a < b ? -1 : 1;
                });

            let maxDistanceX: number = points[indices[0]][0] + 1 - points[indices[indices.length - 1]][0];
            let leftMostIndex: number = 0;

            for (let i: number = 0; i < indices.length - 1; i++) {
                const index1: number = indices[i];
                const index2: number = indices[i + 1];
                const distanceX: number = points[index2][0] - points[index1][0];

                if (distanceX > maxDistanceX) {
                    maxDistanceX = distanceX;
                    leftMostIndex = i + 1;
                }
            }

            if (leftMostIndex > 0) {
                minX = points[indices[leftMostIndex]][0];
                maxX = points[indices[leftMostIndex - 1]][0];
            }
        }

        return [minX, minY, maxX, maxY];
    }

    /** @ignore */
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
