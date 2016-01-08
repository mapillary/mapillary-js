/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

export class Container {
    public id: string;
    public element: HTMLElement;

    constructor (id: string) {
        this.id = id;
        this.element = document.getElementById(id);
        this.element.classList.add("mapillary-js");
    }
}

export default Container;
