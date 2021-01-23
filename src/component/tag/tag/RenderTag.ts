import * as THREE from "three";
import * as vd from "virtual-dom";

import {
    Observable,
    Subject,
} from "rxjs";

import { IInteraction } from "../interfaces/IInteraction";

import { Transform } from "../../../geo/Transform";
import { ViewportCoords } from "../../../geo/ViewportCoords";
import { ISize } from "../../../render/interfaces/ISize";
import { ISpriteAtlas } from "../../../viewer/interfaces/ISpriteAtlas";

export abstract class RenderTag<T> {
    protected _tag: T;
    protected _transform: Transform;
    protected _viewportCoords: ViewportCoords;

    protected _glObjectsChanged$: Subject<RenderTag<T>>;
    protected _interact$: Subject<IInteraction>;

    constructor(tag: T, transform: Transform, viewportCoords?: ViewportCoords) {
        this._tag = tag;
        this._transform = transform;
        this._viewportCoords = !!viewportCoords ? viewportCoords : new ViewportCoords();

        this._glObjectsChanged$ = new Subject<RenderTag<T>>();
        this._interact$ = new Subject<IInteraction>();
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

    public abstract getGLObjects(): THREE.Object3D[];

    public abstract getRetrievableObjects(): THREE.Object3D[];
}
