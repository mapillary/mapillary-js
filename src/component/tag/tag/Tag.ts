/// <reference path="../../../../typings/browser.d.ts" />

import * as rx from "rx";
import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    Geometry,
    IInteraction,
} from "../../../Component";
import {Transform} from "../../../Geo";
import {ISpriteAtlas} from "../../../Viewer";

export abstract class Tag {
    protected _id: string;
    protected _editable: boolean;
    protected _geometry: Geometry;

    protected _interact$: rx.Subject<IInteraction>;
    protected _abort$: rx.Subject<string>;
    protected _click$: rx.Subject<Tag>;
    protected _notifyChanged$: rx.Subject<Tag>;

    constructor(id: string, editable: boolean, geometry: Geometry) {
        this._id = id;
        this._editable = editable;
        this._geometry = geometry;

        this._interact$ = new rx.Subject<IInteraction>();
        this._abort$ = new rx.Subject<string>();
        this._click$ = new rx.Subject<Tag>();
        this._notifyChanged$ = new rx.Subject<Tag>();
    }

    public get id(): string {
        return this._id;
    }

    public get editable(): boolean {
        return this._editable;
    }

    public get geometry(): Geometry {
        return this._geometry;
    }

    public get interact$(): rx.Observable<IInteraction> {
        return this._interact$;
    }

    public get abort$(): rx.Observable<string> {
        return this._abort$;
    }

    public get click$(): rx.Observable<Tag> {
        return this._click$;
    }

    public get changed$(): rx.Observable<Tag> {
        return this._notifyChanged$;
    }

    public get geometryChanged$(): rx.Observable<Tag> {
        return this._geometry.changed$
            .map<Tag>(
                (geometry: Geometry): Tag => {
                    return this;
                });
    }

    public abstract getGLObjects(transform: Transform): THREE.Object3D[];

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
