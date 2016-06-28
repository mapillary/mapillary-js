/// <reference path="../../../../typings/index.d.ts" />

import * as rx from "rx";

import {Transform} from "../../../Geo";

/**
 * @class Geometry
 * @abstract
 * @classdesc Represents a geometry.
 */
export abstract class Geometry {
    protected _notifyChanged$: rx.Subject<Geometry>;

    /**
     * Create a geometry.
     *
     * @constructor
     */
    constructor() {
        this._notifyChanged$ = new rx.Subject<Geometry>();
    }

    /**
     * Get changed observable.
     *
     * @description Emits the geometry itself every time the geometry
     * has changed.
     *
     * @returns {Observable<Geometry>} Observable emitting the geometry instance.
     */
    public get changed$(): rx.Observable<Geometry> {
        return this._notifyChanged$;
    }

    /**
     * Get the 3D world coordinate for the centroid of the geometry.
     *
     * @param {Transform} transform - The transform of the node related to the geometry.
     * @returns {Array<number>} 3D world coordinate representing the centroid.
     */
    public abstract getCentroid3d(transform: Transform): number[];

    /**
     * Set the 2D centroid of the geometry.
     *
     * @param {Array<number>} value - The new value of the centroid in basic coordinates.
     * @param {Transform} transform - The transform of the node related to the geometry.
     */
    public abstract setCentroid2d(value: number[], transform: Transform): void;
}

export default Geometry;
