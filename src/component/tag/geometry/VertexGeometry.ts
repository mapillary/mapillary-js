/// <reference path="../../../../typings/browser.d.ts" />

import {Geometry} from "../../../Component";
import {Transform} from "../../../Geo";

export abstract class VertexGeometry extends Geometry {
    constructor() {
        super();
    }

    public abstract getPoints3d(transform: Transform): number[][];
    public abstract getVertices3d(transform: Transform): number[][];

    public abstract setVertex2d(index: number, value: number[], transform: Transform): void;
}

export default VertexGeometry;
