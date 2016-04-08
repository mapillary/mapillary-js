/// <reference path="../../../typings/browser.d.ts" />

import {Transform} from "../../Geo";

export class Tag {
    private _id: string;

    private _transform: Transform;

    private _rect: number[];
    private _rectPoints3d: number[][];

    private _value: string;

    constructor(id: string, transform: Transform, rect: number[], value: string) {
        this._id = id;
        this._transform = transform;
        this._value = value;

        this.rect = rect;
    }

    public get id(): string {
        return this._id;
    }

    public get rect(): number[] {
        return this._rect;
    }

    public set rect(value: number[]) {
        this._rect = value;

        this._rectPoints3d = [
            [value[0], value[3]],
            [value[0], value[1]],
            [value[2], value[1]],
            [value[2], value[3]],
            [value[0], value[3]],
        ].map(
            (point: number[]) => {
                return this._transform.unprojectBasic(point, 200);
            });
    }

    public get rectPoints3d(): number[][] {
        return this._rectPoints3d;
    }

    public get value(): string {
        return this._value;
    }

    public getPoint3d(x: number, y: number): number[] {
        return this._transform.unprojectBasic([x, y], 200);
    }
}

export default Tag;
