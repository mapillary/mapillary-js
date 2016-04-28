/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";

import {ITag, TagLabel} from "../../Component";
import {Transform} from "../../Geo";

export class Tag {
    private _id: string;

    private _transform: Transform;

    private _rect: number[];
    private _polygonPoints2d: number[][];
    private _centroidPoint3d: number[];
    private _polygonPoints3d: number[][];

    private _value: string;
    private _editable: boolean;
    private _label: TagLabel;

    private _notifyChanged$: rx.Subject<Tag>;

    constructor(tag: ITag, transform: Transform) {
        this._id = tag.id;
        this._value = tag.value;
        this._editable = tag.editable;
        this._label = tag.label;

        this._transform = transform;

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

    public get polygonPoints2d(): number[][] {
        return this._polygonPoints2d;
    }

    public get centroidPoint3d(): number[] {
        return this._centroidPoint3d;
    }

    public get polygonPoints3d(): number[][] {
        return this._polygonPoints3d;
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

    public setPolygonPoint2d(index: number, value: number[]): void {
        let original: number[] = this._rect.slice();

        let newCoord: number[] = [
            Math.max(0, Math.min(1, value[0])),
            Math.max(0, Math.min(1, value[1])),
        ];

        let rect: number[] = [];
        if (index === 0) {
            rect[0] = newCoord[0];
            rect[1] = original[1];
            rect[2] = original[2];
            rect[3] = newCoord[1];
        } else if (index === 1) {
            rect[0] = newCoord[0];
            rect[1] = newCoord[1];
            rect[2] = original[2];
            rect[3] = original[3];
        } else if (index === 2) {
            rect[0] = original[0];
            rect[1] = newCoord[1];
            rect[2] = newCoord[0];
            rect[3] = original[3];
        } else if (index === 3) {
            rect[0] = original[0];
            rect[1] = original[1];
            rect[2] = newCoord[0];
            rect[3] = newCoord[1];
        }

        if (rect[0] > rect[2]) {
            rect[0] = original[0];
            rect[2] = original[2];
        }

        if (rect[1] > rect[3]) {
            rect[1] = original[1];
            rect[3] = original[3];
        }

        this._setShape(rect);
        this._notifyChanged$.onNext(this);
    }

    public setCentroid2d(value: number[]): void {
        let original: number[] = this._rect.slice();

        let centerX: number = original[0] + (original[2] - original[0]) / 2;
        let centerY: number = original[1] + (original[3] - original[1]) / 2;

        let minTranslationX: number = -original[0];
        let maxTranslationX: number = 1 - original[2];
        let minTranslationY: number = -original[1];
        let maxTranslationY: number = 1 - original[3];

        let translationX: number = Math.max(minTranslationX, Math.min(maxTranslationX, value[0] - centerX));
        let translationY: number = Math.max(minTranslationY, Math.min(maxTranslationY, value[1] - centerY));

        let rect: number[] = [];
        rect[0] = original[0] + translationX;
        rect[1] = original[1] + translationY;
        rect[2] = original[2] + translationX;
        rect[3] = original[3] + translationY;

        this._setShape(rect);
        this._notifyChanged$.onNext(this);
    }

    public getPoint3d(x: number, y: number): number[] {
        return this._transform.unprojectBasic([x, y], 200);
    }

    private _setShape(value: number[]): void {
        this._rect = value.slice();

        let centroidX: number = value[0] + (value[2] - value[0]) / 2;
        let centroidY: number = value[1] + (value[3] - value[1]) / 2;

        this._centroidPoint3d = this.getPoint3d(centroidX, centroidY);

        this._polygonPoints2d = [
            [value[0], value[3]],
            [value[0], value[1]],
            [value[2], value[1]],
            [value[2], value[3]],
            [value[0], value[3]],
        ];

        this._polygonPoints3d = this._polygonPoints2d
            .map(
                (point: number[]) => {
                    return this.getPoint3d(point[0], point[1]);
                });
    }
}

export default Tag;
