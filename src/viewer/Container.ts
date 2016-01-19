/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import {GlRenderer, DOMRenderer} from "../Render";

export class Container {
    public id: string;
    public element: HTMLElement;

    public glRenderer: GlRenderer;
    public domRenderer: DOMRenderer;

    constructor (id: string) {
        this.id = id;
        this.element = document.getElementById(id);
        this.element.classList.add("mapillary-js");

        this.glRenderer = new GlRenderer(this.element);
        this.domRenderer = new DOMRenderer(this.element);
    }
}

export default Container;
