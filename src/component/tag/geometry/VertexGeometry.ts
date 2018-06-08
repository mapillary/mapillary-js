/// <reference path="../../../../typings/index.d.ts" />

import earcut from "earcut";
import * as polylabel from "@mapbox/polylabel";

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
    public abstract getPoleOfAccessibility2d(): number[];

    /**
     * Get the polygon pole of inaccessibility, the most
     * distant internal point from the polygon outline.
     *
     * @param transform - The transform of the node related to
     * the geometry.
     * @returns {Array<number>} 3D world coordinates for the pole of inaccessibility.
     * @ignore
     */
    public abstract getPoleOfAccessibility3d(transform: Transform): number[];

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
}

export default VertexGeometry;
