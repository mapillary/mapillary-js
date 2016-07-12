/// <reference path="../../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import "rxjs/add/operator/map";
import "rxjs/add/operator/share";

import {
    Geometry,
    IInteraction,
} from "../../../Component";
import {Transform} from "../../../Geo";
import {EventEmitter} from "../../../Utils";
import {ISpriteAtlas} from "../../../Viewer";

/**
 * @class Tag
 * @abstract
 * @classdesc Abstract class representing the basic functionality of for a tag.
 */
export abstract class Tag extends EventEmitter {
    /**
     * Event fired when a property related to the visual appearance of the
     * tag has changed.
     *
     * @event Tag#changed
     * @type {Tag} The tag instance that has changed.
     */
    public static changed: string = "changed";

    /**
     * Event fired when the geometry of the tag has changed.
     *
     * @event Tag#geometrychanged
     * @type {Tag} The tag instance whose geometry has changed.
     */
    public static geometrychanged: string = "geometrychanged";

    protected _id: string;
    protected _geometry: Geometry;

    protected _interact$: Subject<IInteraction>;
    protected _notifyChanged$: Subject<Tag>;

    /**
     * Create a tag.
     *
     * @constructor
     * @param {string} id
     * @param {Geometry} geometry
     */
    constructor(id: string, geometry: Geometry) {
        super();

        this._id = id;
        this._geometry = geometry;

        this._interact$ = new Subject<IInteraction>();
        this._notifyChanged$ = new Subject<Tag>();

        this._notifyChanged$
            .subscribe(
                (t: Tag): void => {
                    this.fire(Tag.changed, this);
                });

        this._geometry.changed$
            .subscribe(
                (g: Geometry): void => {
                    this.fire(Tag.geometrychanged, this);
                });
    }

    /**
     * Get id property.
     * @returns {string}
     */
    public get id(): string {
        return this._id;
    }

    /**
     * Get geometry property.
     * @returns {Geometry}
     */
    public get geometry(): Geometry {
        return this._geometry;
    }

    public get interact$(): Observable<IInteraction> {
        return this._interact$;
    }

    /**
     * Get changed observable.
     * @returns {Observable<Tag>}
     */
    public get changed$(): Observable<Tag> {
        return this._notifyChanged$;
    }

    /**
     * Get geometry changed observable.
     * @returns {Observable<Tag>}
     */
    public get geometryChanged$(): Observable<Tag> {
        return this._geometry.changed$
            .map<Tag>(
                (geometry: Geometry): Tag => {
                    return this;
                })
            .share();
    }

    /**
     * Get the GL objects for rendering of the tag.
     * @abstract
     * @return {Array<Object3D>}
     */
    public abstract getGLObjects(transform: Transform): THREE.Object3D[];

    /**
     * Get the DOM objects for rendering of the tag.
     * @abstract
     * @return {Array<VNode>}
     */
    public abstract getDOMObjects(
        transform: Transform,
        atlas: ISpriteAtlas,
        matrixWorldInverse: THREE.Matrix4,
        projectionMatrix: THREE.Matrix4):
        vd.VNode[];

    protected _projectToCanvas(
        point: THREE.Vector3,
        projectionMatrix: THREE.Matrix4):
        number[] {

        let projected: THREE.Vector3 =
            new THREE.Vector3(point.x, point.y, point.z)
                .applyProjection(projectionMatrix);

        return [(projected.x + 1) / 2, (-projected.y + 1) / 2];
    }

    protected _convertToCameraSpace(
        point: number[],
        matrixWorldInverse: THREE.Matrix4):
        THREE.Vector3 {

        return new THREE.Vector3(point[0], point[1], point[2]).applyMatrix4(matrixWorldInverse);
    }
}

export default Tag;
