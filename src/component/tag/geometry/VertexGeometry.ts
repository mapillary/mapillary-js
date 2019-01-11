import earcut from "earcut";
import * as martinez from "martinez-polygon-clipping";
import * as polylabel from "@mapbox/polylabel";
import * as THREE from "three";

import {Geometry} from "../../../Component";
import {Transform} from "../../../Geo";

/**
 * @class VertexGeometry
 * @abstract
 * @classdesc Represents a vertex geometry.
 */
export abstract class VertexGeometry extends Geometry {

    private _subsampleThreshold: number;

    /**
     * Create a vertex geometry.
     *
     * @constructor
     * @ignore
     */
    constructor() {
        super();

        this._subsampleThreshold = 0.005;

    }

    /**
     * Get the 3D coordinates for the vertices of the geometry with possibly
     * subsampled points along the lines.
     *
     * @param {Transform} transform - The transform of the node related to
     * the geometry.
     * @returns {Array<Array<number>>} Polygon array of 3D world coordinates
     * representing the geometry.
     * @ignore
     */
    public abstract getPoints3d(transform: Transform): number[][];

    /**
     * Get the polygon pole of inaccessibility, the most
     * distant internal point from the polygon outline.
     *
     * @returns {Array<number>} 2D basic coordinates for the pole of inaccessibility.
     * @ignore
     */
    public abstract getPoleOfInaccessibility2d(): number[];

    /**
     * Get the polygon pole of inaccessibility, the most
     * distant internal point from the polygon outline.
     *
     * @param transform - The transform of the node related to
     * the geometry.
     * @returns {Array<number>} 3D world coordinates for the pole of inaccessibility.
     * @ignore
     */
    public abstract getPoleOfInaccessibility3d(transform: Transform): number[];

    /**
     * Get the coordinates of a vertex from the polygon representation of the geometry.
     *
     * @param {number} index - Vertex index.
     * @returns {Array<number>} Array representing the 2D basic coordinates of the vertex.
     * @ignore
     */
    public abstract getVertex2d(index: number): number[];

    /**
     * Get a vertex from the polygon representation of the 3D coordinates for the
     * vertices of the geometry.
     *
     * @param {number} index - Vertex index.
     * @param {Transform} transform - The transform of the node related to the geometry.
     * @returns {Array<number>} Array representing the 3D world coordinates of the vertex.
     * @ignore
     */
    public abstract getVertex3d(index: number, transform: Transform): number[];

    /**
     * Get a polygon representation of the 2D basic coordinates for the vertices of the geometry.
     *
     * @returns {Array<Array<number>>} Polygon array of 2D basic coordinates representing
     * the vertices of the geometry.
     * @ignore
     */
    public abstract getVertices2d(): number[][];

    /**
     * Get a polygon representation of the 3D world coordinates for the vertices of the geometry.
     *
     * @param {Transform} transform - The transform of the node related to the geometry.
     * @returns {Array<Array<number>>} Polygon array of 3D world coordinates representing
     * the vertices of the geometry.
     * @ignore
     */
    public abstract getVertices3d(transform: Transform): number[][];

    /**
     * Get a flattend array of the 3D world coordinates for the
     * triangles filling the geometry.
     *
     * @param {Transform} transform - The transform of the node related to the geometry.
     * @returns {Array<number>} Flattened array of 3D world coordinates of the triangles.
     * @ignore
     */
    public abstract getTriangles3d(transform: Transform): number[];

    /**
     * Set the value of a vertex in the polygon representation of the geometry.
     *
     * @description The polygon is defined to have the first vertex at the
     * bottom-left corner with the rest of the vertices following in clockwise order.
     *
     * @param {number} index - The index of the vertex to be set.
     * @param {Array<number>} value - The new value of the vertex.
     * @param {Transform} transform - The transform of the node related to the geometry.
     * @ignore
     */
    public abstract setVertex2d(index: number, value: number[], transform: Transform): void;

    /**
     * Finds the polygon pole of inaccessibility, the most distant internal
     * point from the polygon outline.
     *
     * @param {Array<Array<number>>} points2d - 2d points of outline to triangulate.
     * @returns {Array<number>} Point of inaccessibility.
     * @ignore
     */
    protected _getPoleOfInaccessibility2d(points2d: number[][]): number[] {
        let pole2d: number[] = polylabel([points2d], 3e-2);

        return pole2d;
    }

    protected _project(points2d: number[][], transform: Transform): number[][] {
        const camera: THREE.Camera = this._createCamera(
            transform.upVector().toArray(),
            transform.unprojectSfM([0, 0], 0),
            transform.unprojectSfM([0, 0], 10));

        return this._deunproject(
            points2d,
            transform,
            camera);
    }

    protected _subsample(points2d: number[][], threshold: number = this._subsampleThreshold): number[][] {
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

    /**
     * Triangulates a 2d polygon and returns the triangle
     * representation as a flattened array of 3d points.
     *
     * @param {Array<Array<number>>} points2d - 2d points of outline to triangulate.
     * @param {Array<Array<number>>} points3d - 3d points of outline corresponding to the 2d points.
     * @param {Array<Array<Array<number>>>} [holes2d] - 2d points of holes to triangulate.
     * @param {Array<Array<Array<number>>>} [holes3d] - 3d points of holes corresponding to the 2d points.
     * @returns {Array<number>} Flattened array of 3d points ordered based on the triangles.
     * @ignore
     */
    protected _triangulate(
        points2d: number[][],
        points3d: number[][],
        holes2d?: number[][][],
        holes3d?: number[][][]): number[] {

        let data: number[][][] = [points2d.slice(0, -1)];
        for (let hole2d of holes2d != null ? holes2d : []) {
            data.push(hole2d.slice(0, -1));
        }

        let points: number[][] = points3d.slice(0, -1);
        for (let hole3d of holes3d != null ? holes3d : []) {
            points = points.concat(hole3d.slice(0, -1));
        }

        let flattened: { vertices: number[], holes: number[], dimensions: number } = earcut.flatten(data);
        let indices: number[] = earcut(flattened.vertices, flattened.holes, flattened.dimensions);
        let triangles: number[] = [];

        for (let i: number = 0; i < indices.length; ++i) {
            let point: number[] = points[indices[i]];

            triangles.push(point[0]);
            triangles.push(point[1]);
            triangles.push(point[2]);
        }

        return triangles;
    }

    protected _triangulatePano(points2d: number[][], holes2d: number[][][], transform: Transform): number[] {
        const triangles: number[] = [];

        const epsilon: number = 1e-9;
        const subareasX: number = 3;
        const subareasY: number = 3;

        for (let x: number = 0; x < subareasX; x++) {
            for (let y: number = 0; y < subareasY; y++) {
                const epsilonX0: number = x === 0 ? -epsilon : epsilon;
                const epsilonY0: number = y === 0 ? -epsilon : epsilon;

                const x0: number = x / subareasX + epsilonX0;
                const y0: number = y / subareasY + epsilonY0;
                const x1: number = (x + 1) / subareasX + epsilon;
                const y1: number = (y + 1) / subareasY + epsilon;

                const bbox2d: number[][] = [
                    [x0, y0],
                    [x0, y1],
                    [x1, y1],
                    [x1, y0],
                    [x0, y0],
                ];

                const lookat2d: number[] = [
                    (2 * x + 1) / (2 * subareasX),
                    (2 * y + 1) / (2 * subareasY),
                ];

                triangles.push(...this._triangulateSubarea(points2d, holes2d, bbox2d, lookat2d, transform));
            }
        }

        return triangles;
    }

    protected _unproject(points2d: number[][], transform: Transform, distance: number = 200): number[][] {
        return points2d
            .map(
                (point: number[]) => {
                    return transform.unprojectBasic(point, distance);
                });
    }

    private _createCamera(upVector: number[], position: number[], lookAt: number[]): THREE.Camera {
        const camera: THREE.Camera = new THREE.Camera();
        camera.up.copy(new THREE.Vector3().fromArray(upVector));
        camera.position.copy(new THREE.Vector3().fromArray(position));
        camera.lookAt(new THREE.Vector3().fromArray(lookAt));
        camera.updateMatrix();
        camera.updateMatrixWorld(true);

        return camera;
    }

    private _deunproject(points2d: number[][], transform: Transform, camera: THREE.Camera): number[][] {
        return points2d
            .map(
                (point2d: number[]): number[] => {
                    const pointWorld: number[] = transform.unprojectBasic(point2d, 10000);
                    const pointCamera: THREE.Vector3 =
                        new THREE.Vector3(pointWorld[0], pointWorld[1], pointWorld[2])
                            .applyMatrix4(camera.matrixWorldInverse);

                    return [pointCamera.x / pointCamera.z, pointCamera.y / pointCamera.z];
                });
    }

    private _triangulateSubarea(
        points2d: number[][],
        holes2d: number[][][],
        bbox2d: number[][],
        lookat2d: number[],
        transform: Transform): number[] {

        const intersections: martinez.MultiPolygon = martinez.intersection([points2d, ...holes2d], [bbox2d]) as martinez.MultiPolygon;
        if (!intersections) {
            return [];
        }

        const triangles: number[] = [];
        const threshold: number = this._subsampleThreshold;
        const camera: THREE.Camera = this._createCamera(
            transform.upVector().toArray(),
            transform.unprojectSfM([0, 0], 0),
            transform.unprojectBasic(lookat2d, 10));

        for (const intersection of intersections) {
            const subsampledPolygon2d: number[][] = this._subsample(intersection[0], threshold);

            const polygon2d: number[][] = this._deunproject(subsampledPolygon2d, transform, camera);
            const polygon3d: number[][] = this._unproject(subsampledPolygon2d, transform);

            const polygonHoles2d: number[][][] = [];
            const polygonHoles3d: number[][][] = [];
            for (let i: number = 1; i < intersection.length; i++) {
                let subsampledHole2d: number[][] = this._subsample(intersection[i], threshold);

                const hole2d: number[][] = this._deunproject(subsampledHole2d, transform, camera);
                const hole3d: number[][] = this._unproject(subsampledHole2d, transform);

                polygonHoles2d.push(hole2d);
                polygonHoles3d.push(hole3d);
            }

            triangles.push(...this._triangulate(polygon2d, polygon3d, polygonHoles2d, polygonHoles3d));
        }

        return triangles;
    }
}

export default VertexGeometry;
