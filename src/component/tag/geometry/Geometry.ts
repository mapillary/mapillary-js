/// <reference path="../../../../typings/browser.d.ts" />

import * as rx from "rx";

import {Transform} from "../../../Geo";

export abstract class Geometry {
    protected _notifyChanged$: rx.Subject<Geometry>;

    constructor() {
        this._notifyChanged$ = new rx.Subject<Geometry>();
    }

    public get changed$(): rx.Observable<Geometry> {
        return this._notifyChanged$;
    }

    public abstract getPolygon3d(transform: Transform): number[][];
    public abstract getPolygonPoints3d(transform: Transform): number[][];
    public abstract getCentroidPoint3d(transform: Transform): number[];

    public abstract setCentroid2d(value: number[]): void;
    public abstract setPolygonPoint2d(index: number, value: number[]): void;
}

export default Geometry;
