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

    /**
     * Create a vertex geometry.
     *
     * @constructor
     * @ignore
     */
    constructor() {
        super();
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

    protected _subsample(points2d: number[][], threshold: number): number[][] {
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

    protected _project(points2d: number[][], transform: Transform): number[][] {
        const camera: THREE.Camera = new THREE.Camera();
        camera.up.copy(transform.upVector());
        camera.position.copy(new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 0)));
        camera.lookAt(new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 10)));
        camera.updateMatrix();
        camera.updateMatrixWorld(true);

        const projected: number[][] = points2d
            .map(
                (point2d: number[]): number[] => {
                    const pointWorld: number[] = transform.unprojectBasic(point2d, 10000);
                    const pointCamera: THREE.Vector3 =
                        new THREE.Vector3(pointWorld[0], pointWorld[1], pointWorld[2])
                            .applyMatrix4(camera.matrixWorldInverse);

                    return [pointCamera.x / pointCamera.z, pointCamera.y / pointCamera.z];
                });

        return projected;
    }

    protected _triangulatePano(points2d: number[][], holes: number[][][], transform: Transform): number[] {
        const triangles: number[] = [];
        const epsilon: number = 1e-9;
        const subareasX: number = 3;
        const subareasY: number = 3;

        for (let x: number = 0; x < subareasX; x++) {
            for (let y: number = 0; y < subareasY; y++) {
                const bbox: number[] = [
                    x / subareasX,
                    y / subareasY,
                    (x + 1) / subareasX + epsilon,
                    (y + 1) / subareasY + epsilon,
                ];

                if (x === 0) {
                    bbox[0] -= epsilon;
                } else {
                    bbox[0] += epsilon;
                }

                if (y === 0) {
                    bbox[1] -= epsilon;
                } else {
                    bbox[1] += epsilon;
                }

                const lookat: number[] = [
                    (2 * x + 1) / (subareasX * 2),
                    (2 * y + 1) / (subareasY * 2),
                ];

                triangles.push(...this._triangulateSubarea(bbox, lookat, points2d, holes, transform));
            }
        }

        return triangles;
    }

    private _triangulateSubarea(
        bbox: number[],
        lookatBasic: number[],
        points2d: number[][],
        holes: number[][][],
        transform: Transform): number[] {

        const camera: THREE.Camera = new THREE.Camera();
        camera.up.copy(transform.upVector());
        camera.position.copy(new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 0)));
        camera.lookAt(new THREE.Vector3().fromArray(transform.unprojectBasic(lookatBasic, 10)));
        camera.updateMatrix();
        camera.updateMatrixWorld(true);

        const bboxPoints: number[][] = [
            [bbox[0], bbox[1]],
            [bbox[0], bbox[3]],
            [bbox[2], bbox[3]],
            [bbox[2], bbox[1]],
            [bbox[0], bbox[1]],
        ];

        const intersection: martinez.MultiPolygon = <martinez.MultiPolygon>martinez.intersection([points2d, ...holes], [bboxPoints]);
        if (!intersection) {
            return [];
        }

        const triangles: number[] = [];

        for (let i: number = 0; i < intersection.length; i++) {
            let clipped: number[][] = this._subsample(intersection[i][0], 0.005);

            const p2s: number[][] = clipped
                .map(
                    (point2d: number[]): number[] => {
                        const pointWorld: number[] = transform.unprojectBasic(point2d, 10000);
                        const pointCamera: THREE.Vector3 =
                            new THREE.Vector3(pointWorld[0], pointWorld[1], pointWorld[2])
                                .applyMatrix4(camera.matrixWorldInverse);

                        return [pointCamera.x / pointCamera.z, pointCamera.y / pointCamera.z];
                    });

            const p3s: number[][] = clipped
                .map(
                    (point: number[]) => {
                        return transform.unprojectBasic(point, 200);
                    });

            const holes2d: number[][][] = [];
            const holes3d: number[][][] = [];

            for (let j: number = 1; j < intersection[i].length; j++) {

                let hc: number[][] = this._subsample(intersection[i][j], 0.005);

                const h2s: number[][] = hc
                    .map(
                        (point2d: number[]): number[] => {
                            const pointWorld: number[] = transform.unprojectBasic(point2d, 10000);
                            const pointCamera: THREE.Vector3 =
                                new THREE.Vector3(pointWorld[0], pointWorld[1], pointWorld[2])
                                    .applyMatrix4(camera.matrixWorldInverse);

                            return [pointCamera.x / pointCamera.z, pointCamera.y / pointCamera.z];
                        });

                const h3s: number[][] = hc
                    .map(
                        (point: number[]) => {
                            return transform.unprojectBasic(point, 200);
                        });

                holes2d.push(h2s);
                holes3d.push(h3s);
            }

            triangles.push(...this._triangulate(p2s, p3s, holes2d, holes3d));
        }

        return triangles;
    }
}

export default VertexGeometry;
