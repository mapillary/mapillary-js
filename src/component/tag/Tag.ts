/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";

import {ITag, TagLabel, TagOperation} from "../../Component";
import {Transform} from "../../Geo";

export class Tag {
    private _id: string;

    private _transform: Transform;

    private _rect: number[];
    private _centroidPoint3d: number[];
    private _polygonPoints3d: number[][];

    private _value: string;
    private _editable: boolean;
    private _label: TagLabel;

    private _operations: TagOperation[];

    private _notifyChanged$: rx.Subject<Tag>;

    constructor(tag: ITag, transform: Transform) {
        this._id = tag.id;
        this._value = tag.value;
        this._editable = tag.editable;
        this._label = tag.label;

        this._transform = transform;

        this._operations = [
            TagOperation.ResizeBottomLeft,
            TagOperation.ResizeTopLeft,
            TagOperation.ResizeTopRight,
            TagOperation.ResizeBottomRight,
        ];

        this._setShape(tag.rect);

        this._notifyChanged$ = new rx.Subject<Tag>();
    }

    public get id(): string {
        return this._id;
    }

    public get shape(): number[] {
        return this._rect;
    }

    public set shape(value: number[]) {
        this._setShape(value);

        this._notifyChanged$.onNext(this);
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

    public get editable(): boolean {
        return this._editable;
    }

    public get label(): TagLabel {
        return this._label;
    }

    public get onChanged$(): rx.Observable<Tag> {
        return this._notifyChanged$;
    }

    public getPoint3d(x: number, y: number): number[] {
        return this._transform.unprojectBasic([x, y], 200);
    }

    private _setShape(value: number[]): void {
        this._rect = value.slice();

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
}

export default Tag;
