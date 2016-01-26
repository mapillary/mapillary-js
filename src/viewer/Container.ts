/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {GLRenderer, DOMRenderer} from "../Render";
import {IFrame} from "../State";
import {MouseService} from "../Viewer";

export class Container {
    public id: string;
    public element: HTMLElement;

    public glRenderer: GLRenderer;
    public domRenderer: DOMRenderer;

    public mouseService: MouseService;

    constructor (id: string, currentFrame$: rx.Observable<IFrame>) {
        this.id = id;
        this.element = document.getElementById(id);
        this.element.classList.add("mapillary-js");

        this.glRenderer = new GLRenderer(this.element, currentFrame$);
        this.domRenderer = new DOMRenderer(this.element);

        this.mouseService = new MouseService(this.element);
    }
}

export default Container;
