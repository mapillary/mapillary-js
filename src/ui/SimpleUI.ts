/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {IUI} from "../UI";

export class SimpleUI implements IUI {
    private canvas: HTMLCanvasElement;
    private disposable: rx.IDisposable;
    private navigator: Navigator;
    private container: Container;

    constructor(container: Container, navigator: Navigator) {
        this.navigator = navigator;

        this.canvas = document.createElement("canvas");
        this.canvas.width = container.element.clientWidth;
        this.canvas.height = container.element.clientHeight;
        container.element.appendChild(this.canvas);
        this.container = container;
    }

    public activate(): void {
        this.disposable = this.navigator.stateService.currentNode$.subscribe((node: Node) => {
            let ctx: any = this.canvas.getContext("2d");

            let cw: number = this.container.element.clientWidth;
            let ch: number = this.container.element.clientHeight;

            ctx.fillStyle = "black"; // todo: This should be customizable by the end user
            ctx.fillRect(0, 0, cw, ch);

            let imHeight: number = node.image.height;
            let imWidth: number = node.image.width;

            let w: number = ch / imHeight * imWidth;
            let offsetLeft: number = (cw - w) / 2;

            this.canvas.width = cw;
            this.canvas.height = ch;

            ctx.drawImage(node.image, offsetLeft, 0, w, ch);
        });
    }

    public deactivate(): void {
        this.disposable.dispose();
    }
}

export default SimpleUI;
