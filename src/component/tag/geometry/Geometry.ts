import {Observable, Subject} from "rxjs";

import {Transform} from "../../../Geo";

/**
 * @class Geometry
 * @abstract
 * @classdesc Represents a geometry.
 */
export abstract class Geometry {
    protected _notifyChanged$: Subject<Geometry>;

    /**
     * Create a geometry.
     *
     * @constructor
     * @ignore
     */
    constructor() {
        this._notifyChanged$ = new Subject<Geometry>();
    }

    /**
     * Get changed observable.
     *
     * @description Emits the geometry itself every time the geometry
     * has changed.
     *
     * @returns {Observable<Geometry>} Observable emitting the geometry instance.
     * @ignore
     */
    public get changed$(): Observable<Geometry> {
        return this._notifyChanged$;
    }

    /**
     * Get the 2D basic coordinates for the centroid of the geometry.
     *
     * @returns {Array<number>} 2D basic coordinates representing the centroid.
     * @ignore
     */
    public abstract getCentroid2d(): number[];

    /**
     * Get the 3D world coordinates for the centroid of the geometry.
     *
     * @param {Transform} transform - The transform of the node related to the geometry.
     * @returns {Array<number>} 3D world coordinates representing the centroid.
     * @ignore
     */
    public abstract getCentroid3d(transform: Transform): number[];

    /**
     * Set the 2D centroid of the geometry.
     *
     * @param {Array<number>} value - The new value of the centroid in basic coordinates.
     * @param {Transform} transform - The transform of the node related to the geometry.
     * @ignore
     */
    public abstract setCentroid2d(value: number[], transform: Transform): void;
}

export default Geometry;
