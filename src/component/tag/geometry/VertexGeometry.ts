/// <reference path="../../../../typings/index.d.ts" />

import * as THREE from "three";

import {Geometry} from "../../../Component";
import {Transform} from "../../../Geo";

export abstract class VertexGeometry extends Geometry {
    constructor() {
        super();
    }

    public abstract getPoints3d(transform: Transform): number[][];
    public abstract getVertex3d(index: number, transform: Transform): number[];
    public abstract getVertices3d(transform: Transform): number[][];
    public abstract getTriangles3d(transform: Transform): number[];

    public abstract setVertex2d(index: number, value: number[], transform: Transform): void;

    protected _triangulate(
        points2d: number[][],
        points3d: number[][]): number[] {
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
