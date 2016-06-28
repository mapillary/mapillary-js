/// <reference path="../../../../typings/index.d.ts" />

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
     */
    constructor() {
        super();
    }

    /**
     * Get the 3D coordinates for the vertices of the geometry with possibly
     * interpolated points along the lines.
     *
     * @param {Transform} transform - The transform of the node related to
     * the geometry.
     * @returns {Array<Array<number>>} Polygon array of 3D world coordinates
     * representing the geometry.
     */
    public abstract getPoints3d(transform: Transform): number[][];

    /**
     * Get a vertex from the polygon representation of the 3D coordinates for the
     * vertices of the geometry.
     *
     * @param {number} index - Vertex index.
     * @param {Transform} transform - The transform of the node related to the geometry.
     * @returns {Array<Array<number>>} Polygon array of 3D world coordinates representing
     * the vertices of the geometry.
     */
    public abstract getVertex3d(index: number, transform: Transform): number[];

    /**
     * Get a polygon representation of the 3D coordinates for the vertices of the geometry.
     *
     * @param {Transform} transform - The transform of the node related to the geometry.
     * @returns {Array<Array<number>>} Polygon array of 3D world coordinates representing
     * the vertices of the geometry.
     */
    public abstract getVertices3d(transform: Transform): number[][];

    /**
     * Get a flattend array of the 3D world coordinates for the
     * triangles filling the geometry.
     *
     * @param {Transform} transform - The transform of the node related to the geometry.
     * @returns {Array<number>} Flattened array of 3D world coordinates of the triangles.
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
     */
    public abstract setVertex2d(index: number, value: number[], transform: Transform): void;

    /**
     * Triangulates a 2d polygon and returns the triangle
     * representation as a flattened array of 3d points.
     *
     * @param {Array<Array<number>>} points2d - 2d points to triangulate.
     * @param {Array<Array<number>>} points3d - 3d points corresponding to the 2d points.
     * @returns {Array<number>} Flattened array of 3d points ordered based on the triangles.
     */
    protected _triangulate(points2d: number[][], points3d: number[][]): number[] {
        let contour: THREE.Vector2[] = points2d
            .map<THREE.Vector2>((point: number[]): THREE.Vector2 => {
                return new THREE.Vector2(point[0], point[1]);
            });

        contour.pop();

        let indices: number[][] = <number[][]><any>THREE.ShapeUtils.triangulate(<any[]>contour, true);
        let triangles: number[] = [];
        for (let i: number = 0; i < indices.length; ++i) {
            for (let j: number = 0; j < 3; ++j) {
                let point3d: number[] = points3d[indices[i][j]];

                triangles.push(point3d[0]);
                triangles.push(point3d[1]);
                triangles.push(point3d[2]);
            }
        }

        return triangles;
    }
}

export default VertexGeometry;
