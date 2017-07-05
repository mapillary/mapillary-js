/// <reference path="../../../../typings/index.d.ts" />

import * as THREE from "three";
import * as vd from "virtual-dom";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

import {IInteraction} from "../../../Component";
import {
    Transform,
    ViewportCoords,
} from "../../../Geo";
import {ISize} from "../../../Render";
import {ISpriteAtlas} from "../../../Viewer";

export abstract class RenderTag<T> {
    protected _tag: T;
    protected _transform: Transform;
    protected _viewportCoords: ViewportCoords;

    protected _glObjects: THREE.Object3D[];

    protected _glObjectsChanged$: Subject<RenderTag<T>>;
    protected _interact$: Subject<IInteraction>;

    constructor(tag: T, transform: Transform, viewportCoords?: ViewportCoords) {
        this._tag = tag;
        this._transform = transform;
        this._viewportCoords = !!viewportCoords ? viewportCoords : new ViewportCoords();

        this._glObjects = [];

        this._glObjectsChanged$ = new Subject<RenderTag<T>>();
        this._interact$ = new Subject<IInteraction>();
    }

    /**
     * Get the GL objects for rendering of the tag.
     * @return {Array<Object3D>}
     */
    public get glObjects(): THREE.Object3D[] {
        return this._glObjects;
    }

    public get glObjectsChanged$(): Observable<RenderTag<T>> {
        return this._glObjectsChanged$;
    }

    public get interact$(): Observable<IInteraction> {
        return this._interact$;
    }

    public get tag(): T {
        return this._tag;
    }

    public abstract dispose(): void;

    public abstract getDOMObjects(atlas: ISpriteAtlas, camera: THREE.Camera, size: ISize): vd.VNode[];

    protected _projectToCanvas(
        point3d: THREE.Vector3,
        projectionMatrix: THREE.Matrix4):
        number[] {

        let projected: THREE.Vector3 =
            new THREE.Vector3(point3d.x, point3d.y, point3d.z)
                .applyMatrix4(projectionMatrix);

        return [(projected.x + 1) / 2, (-projected.y + 1) / 2];
    }

    protected _convertToCameraSpace(
        point3d: number[],
        matrixWorldInverse: THREE.Matrix4):
        THREE.Vector3 {

        return new THREE.Vector3(point3d[0], point3d[1], point3d[2]).applyMatrix4(matrixWorldInverse);
    }
}

export default RenderTag;
