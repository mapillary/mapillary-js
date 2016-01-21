/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {GlRenderer, DOMRenderer} from "../Render";
import {IFrame} from "../State";

export class Container {
    public id: string;
    public element: HTMLElement;

    public initialPhotoId: string;

    public glRenderer: GlRenderer;
    public domRenderer: DOMRenderer;

    constructor (id: string, initialPhotoId: string, currentFrame$: rx.Observable<IFrame>) {
        this.id = id;
        this.initialPhotoId = initialPhotoId;
        this.element = document.getElementById(id);
        this.element.classList.add("mapillary-js");

        this.glRenderer = new GlRenderer(this.element, currentFrame$);
        this.domRenderer = new DOMRenderer(this.element);
    }
}

export default Container;
