/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import {GlRenderer, DOMRenderer} from "../Render";

export class Container {
    public id: string;
    public element: HTMLElement;

    public initialPhotoId: string;

    public glRenderer: GlRenderer;
    public domRenderer: DOMRenderer;

    constructor (id: string, initialPhotoId: string) {
        this.id = id;
        this.initialPhotoId = initialPhotoId;
        this.element = document.getElementById(id);
        this.element.classList.add("mapillary-js");

        this.glRenderer = new GlRenderer();
        this.domRenderer = new DOMRenderer(this.element);
    }
}

export default Container;
