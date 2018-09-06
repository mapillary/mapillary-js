import * as THREE from "three";

import {GeometryTagError, VertexGeometry} from "../../../Component";
import {Transform} from "../../../Geo";

/**
 * @class PolygonGeometry
 *
 * @classdesc Represents a polygon geometry in the 2D basic image coordinate system.
 * All polygons and holes provided to the constructor needs to be closed.
 *
 * @example
 * ```
 * var basicPolygon = [[0.5, 0.3], [0.7, 0.3], [0.6, 0.5], [0.5, 0.3]];
 * var polygonGeometry = new Mapillary.TagComponent.PointGeometry(basicPolygon);
 * ```
 */
export class PolygonGeometry extends VertexGeometry {
    private _polygon: number[][];
    private _holes: number[][][];

    /**
     * Create a polygon geometry.
     *
     * @constructor
     * @param {Array<Array<number>>} polygon - Array of polygon vertices. Must be closed.
     * @param {Array<Array<Array<number>>>} [holes] - Array of arrays of hole vertices.
     * Each array of holes vertices must be closed.
     *
     * @throws {GeometryTagError} Polygon coordinates must be valid basic coordinates.
     */
    constructor(polygon: number[][], holes?: number[][][]) {
        super();

        let polygonLength: number = polygon.length;

        if (polygonLength < 3) {
            throw new GeometryTagError("A polygon must have three or more positions.");
        }

        if (polygon[0][0] !== polygon[polygonLength - 1][0] ||
            polygon[0][1] !== polygon[polygonLength - 1][1]) {
            throw new GeometryTagError("First and last positions must be equivalent.");
        }

        this._polygon = [];
        for (let vertex of polygon) {
            if (vertex[0] < 0 || vertex[0] > 1 ||
                vertex[1] < 0 || vertex[1] > 1) {
                throw new GeometryTagError("Basic coordinates of polygon must be on the interval [0, 1].");
            }

            this._polygon.push(vertex.slice());
        }

        this._holes = [];

        if (holes == null) {
            return;
        }

        for (let i: number = 0; i < holes.length; i++) {
            let hole: number[][] = holes[i];
            let holeLength: number = hole.length;

            if (holeLength < 3) {
                throw new GeometryTagError("A polygon hole must have three or more positions.");
            }

            if (hole[0][0] !== hole[holeLength - 1][0] ||
                hole[0][1] !== hole[holeLength - 1][1]) {
                throw new GeometryTagError("First and last positions of hole must be equivalent.");
            }

            this._holes.push([]);

            for (let vertex of hole) {
                if (vertex[0] < 0 || vertex[0] > 1 ||
                    vertex[1] < 0 || vertex[1] > 1) {
                    throw new GeometryTagError("Basic coordinates of hole must be on the interval [0, 1].");
                }

                this._holes[i].push(vertex.slice());
            }
        }
    }

    /**
     * Get polygon property.
     * @returns {Array<Array<number>>} Closed 2d polygon.
     */
    public get polygon(): number[][] {
        return this._polygon;
    }

    /**
     * Get holes property.
     * @returns {Array<Array<Array<number>>>} Holes of 2d polygon.
     */
    public get holes(): number[][][] {
        return this._holes;
    }

    /**
     * Add a vertex to the polygon by appending it after the last vertex.
     *
     * @param {Array<number>} vertex - Vertex to add.
     */
    public addVertex2d(vertex: number[]): void {
        let clamped: number[] = [
            Math.max(0, Math.min(1, vertex[0])),
            Math.max(0, Math.min(1, vertex[1])),
        ];

        this._polygon.splice(this._polygon.length - 1, 0, clamped);

        this._notifyChanged$.next(this);
    }

    /**
     * Get the coordinates of a vertex from the polygon representation of the geometry.
     *
     * @description The first vertex represents the bottom-left corner with the rest of
     * the vertices following in clockwise order.
     *
     * @param {number} index - Vertex index.
     * @returns {Array<number>} Array representing the 2D basic coordinates of the vertex.
     */
    public getVertex2d(index: number): number[] {
        return this._polygon[index].slice();
    }

    /**
     * Remove a vertex from the polygon.
     *
     * @param {number} index - The index of the vertex to remove.
     */
    public removeVertex2d(index: number): void {
        if (index < 0 ||
            index >= this._polygon.length ||
            this._polygon.length < 4) {
            throw new GeometryTagError("Index for removed vertex must be valid.");
        }

        if (index > 0 && index < this._polygon.length - 1) {
            this._polygon.splice(index, 1);
        } else {
            this._polygon.splice(0, 1);
            this._polygon.pop();

            let closing: number[] = this._polygon[0].slice();
            this._polygon.push(closing);
        }

        this._notifyChanged$.next(this);
    }

    /** @inheritdoc */
    public setVertex2d(index: number, value: number[], transform: Transform): void {
        let changed: number[] = [
            Math.max(0, Math.min(1, value[0])),
            Math.max(0, Math.min(1, value[1])),
        ];

        if (index === 0 || index === this._polygon.length - 1) {
            this._polygon[0] = changed.slice();
            this._polygon[this._polygon.length - 1] = changed.slice();
        } else {
            this._polygon[index] = changed.slice();
        }

        this._notifyChanged$.next(this);
    }

    /** @inheritdoc */
    public setCentroid2d(value: number[], transform: Transform): void {
        let xs: number[] = this._polygon.map((point: number[]): number => { return point[0]; });
        let ys: number[] = this._polygon.map((point: number[]): number => { return point[1]; });

        let minX: number = Math.min.apply(Math, xs);
        let maxX: number = Math.max.apply(Math, xs);
        let minY: number = Math.min.apply(Math, ys);
        let maxY: number = Math.max.apply(Math, ys);

        let centroid: number[] = this.getCentroid2d();

        let minTranslationX: number = -minX;
        let maxTranslationX: number = 1 - maxX;
        let minTranslationY: number = -minY;
        let maxTranslationY: number = 1 - maxY;

        let translationX: number = Math.max(minTranslationX, Math.min(maxTranslationX, value[0] - centroid[0]));
        let translationY: number = Math.max(minTranslationY, Math.min(maxTranslationY, value[1] - centroid[1]));

        for (let point of this._polygon) {
            point[0] += translationX;
            point[1] += translationY;
        }

        this._notifyChanged$.next(this);
    }

    /** @inheritdoc */
    public getPoints3d(transform: Transform): number[][] {
        return this._getPoints3d(this._subsample(this._polygon, 0.01), transform);
    }

    /** @inheritdoc */
    public getVertex3d(index: number, transform: Transform): number[] {
        return transform.unprojectBasic(this._polygon[index], 200);
    }

    /** @inheritdoc */
    public getVertices2d(): number[][] {
        return this._polygon.slice();
    }

    /** @inheritdoc */
    public getVertices3d(transform: Transform): number[][] {
        return this._getPoints3d(this._polygon, transform);
    }

    /**
     * Get a polygon representation of the 3D coordinates for the vertices of each hole
     * of the geometry.
     *
     * @param {Transform} transform - The transform of the node related to the geometry.
     * @returns {Array<Array<Array<number>>>} Array of hole polygons in 3D world coordinates
     * representing the vertices of each hole of the geometry.
     */
    public getHoleVertices3d(transform: Transform): number[][][] {
        let holes3d: number[][][] = [];

        for (let hole of this._holes) {
            let hole3d: number[][] = hole
                .map(
                    (point: number[]) => {
                        return transform.unprojectBasic(point, 200);
                    });

            holes3d.push(hole3d);
        }

        return holes3d;
    }

    /** @inheritdoc */
    public getCentroid2d(): number[] {
        let polygon: number[][] = this._polygon;

        let area: number = 0;
        let centroidX: number = 0;
        let centroidY: number = 0;

        for (let i: number = 0; i < polygon.length - 1; i++) {
            let xi: number = polygon[i][0];
            let yi: number = polygon[i][1];
            let xi1: number = polygon[i + 1][0];
            let yi1: number = polygon[i + 1][1];

            let a: number = xi * yi1 - xi1 * yi;

            area += a;
            centroidX += (xi + xi1) * a;
            centroidY += (yi + yi1) * a;
        }

        area /= 2;

        centroidX /= 6 * area;
        centroidY /= 6 * area;

        return [centroidX, centroidY];
    }

    /** @inheritdoc */
    public getCentroid3d(transform: Transform): number[] {
        let centroid2d: number[] = this.getCentroid2d();

        return transform.unprojectBasic(centroid2d, 200);
    }

    public get3dDomainTriangles3d(transform: Transform): number[] {
        return this._triangulate(
            this._project(this._polygon, transform),
            this.getVertices3d(transform),
            this._holes,
            this.getHoleVertices3d(transform));
    }

    /** @inheritdoc */
    public getTriangles3d(transform: Transform): number[] {
        return this._triangulate(
            this._project(this._subsample(this._polygon, 0.01), transform),
            this.getPoints3d(transform),
            this._holes,
            this.getHoleVertices3d(transform));
    }

    /** @inheritdoc */
    public getPoleOfAccessibility2d(): number[] {
        return this._getPoleOfInaccessibility2d(this._polygon.slice());
    }

    /** @inheritdoc */
    public getPoleOfAccessibility3d(transform: Transform): number[] {
        let pole2d: number[] = this._getPoleOfInaccessibility2d(this._polygon.slice());

        return transform.unprojectBasic(pole2d, 200);
    }

    private _getPoints3d(points2d: number[][], transform: Transform): number[][] {
        return points2d
            .map(
                (point: number[]) => {
                    return transform.unprojectBasic(point, 200);
                });
    }

    private _subsample(points2d: number[][], threshold: number): number[][] {
        const subsampled: number[][] = [];
        const length: number = points2d.length;

        for (let index: number = 0; index < length; index++) {
            const p1: number[] = points2d[index];
            const p2: number[] = points2d[(index + 1) % length];

            subsampled.push(p1);

            const dist: number = Math.sqrt((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2);
            const subsamples: number = Math.floor(dist / threshold);
            const coeff: number = 1 / (subsamples + 1);

            for (let i: number = 1; i <= subsamples; i++) {
                const alpha: number = i * coeff;

                const subsample: number[] = [
                    (1 - alpha) * p1[0] + alpha * p2[0],
                    (1 - alpha) * p1[1] + alpha * p2[1],
                ];

                subsampled.push(subsample);
            }
        }

        return subsampled;
    }
}

export default PolygonGeometry;
