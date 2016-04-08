/// <reference path="../../../typings/browser.d.ts" />

import {TagOperation} from "../../Component";
import {Transform} from "../../Geo";

export class Tag {
    private _id: string;

    private _transform: Transform;

    private _rect: number[];
    private _centroidPoint3d: number[];
    private _polygonPoints3d: number[][];

    private _value: string;

    private _operations: TagOperation[];

    constructor(id: string, transform: Transform, rect: number[], value: string) {
        this._id = id;
        this._transform = transform;
        this._value = value;

        this._operations = [
            TagOperation.ResizeBottomLeft,
            TagOperation.ResizeTopLeft,
            TagOperation.ResizeTopRight,
            TagOperation.ResizeBottomRight,
        ];

        this.shape = rect;
    }

    public get id(): string {
        return this._id;
    }

    public get shape(): number[] {
        return this._rect;
    }

    public set shape(value: number[]) {
        this._rect = value;

        let centroidX: number = value[0] + (value[2] - value[0]) / 2;
        let centroidY: number = value[1] + (value[3] - value[1]) / 2;

        this._centroidPoint3d = this.getPoint3d(centroidX, centroidY);

        this._polygonPoints3d = [
            [value[0], value[3]],
            [value[0], value[1]],
            [value[2], value[1]],
            [value[2], value[3]],
            [value[0], value[3]],
        ].map(
            (point: number[]) => {
                return this.getPoint3d(point[0], point[1]);
            });
    }

    public get centroidPoint3d(): number[] {
        return this._centroidPoint3d;
    }

    public get polygonPoints3d(): number[][] {
        return this._polygonPoints3d;
    }

    public get operations(): TagOperation[] {
        return this._operations;
    }

    public get value(): string {
        return this._value;
    }

    public getPoint3d(x: number, y: number): number[] {
        return this._transform.unprojectBasic([x, y], 200);
    }
}

export default Tag;
