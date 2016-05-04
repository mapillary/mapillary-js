/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";
import * as THREE from "three";
import * as vd from "virtual-dom";

import {IActiveTag} from "../../Component";
import {Transform} from "../../Geo";
import {ISpriteAtlas} from "../../Viewer";

export abstract class TagBase {
    protected _id: string;

    protected _notifyChanged$: rx.Subject<TagBase>;

    protected _activeTag$: rx.Subject<IActiveTag>;
    protected _interactionInitiate$: rx.Subject<string>;
    protected _interactionAbort$: rx.Subject<string>;
    protected _labelClick$: rx.Subject<TagBase>;

    constructor(id: string) {
        this._id = id;

        this._notifyChanged$ = new rx.Subject<TagBase>();

        this._activeTag$ = new rx.Subject<IActiveTag>();
        this._interactionInitiate$ = new rx.Subject<string>();
        this._interactionAbort$ = new rx.Subject<string>();
        this._labelClick$ = new rx.Subject<TagBase>();
    }

    public get id(): string {
        return this._id;
    }

    public get activeTag$(): rx.Observable<IActiveTag> {
        return this._activeTag$;
    }

    public get interactionInitiate$(): rx.Observable<string> {
        return this._interactionInitiate$;
    }

    public get interactionAbort$(): rx.Observable<string> {
        return this._interactionAbort$;
    }

    public get labelClick$(): rx.Observable<TagBase> {
        return this._labelClick$;
    }

    public get onChanged$(): rx.Observable<TagBase> {
        return this._notifyChanged$;
    }

    public abstract setPolygonPoint2d(index: number, value: number[]): void;

    public abstract setCentroid2d(value: number[]): void;

    public abstract getGLGeometry(transform: Transform): THREE.Object3D;

    public abstract getDOMGeometry(atlas: ISpriteAtlas, camera: THREE.PerspectiveCamera, transform: Transform): vd.VNode[];
}

export default TagBase;
