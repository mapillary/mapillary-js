/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";
import {IUI} from "../UI";

interface ICanvasNode {
    canvas: HTMLCanvasElement;
    node: Node;
}

export class SimpleUI implements IUI {
    private navigator: Navigator;
    private container: Container;
    private canvasId: string;
    private disposable: rx.IDisposable;

    private name: string;

    constructor(container: Container, navigator: Navigator) {
        this.navigator = navigator;
        this.container = container;

        this.name = "simpleui";
        this.canvasId = `${container.id}-${this.name}`;
    }

    public activate(): void {
        this.disposable = this.container.domRenderer.element$.combineLatest(
            this.navigator.stateService.currentNode$,
            (element: Element, node: Node): ICanvasNode => {
                let canvas: HTMLCanvasElement = <HTMLCanvasElement> document.getElementById(this.canvasId);
                return {canvas: canvas, node: node};
            }).subscribe((canvasNode: ICanvasNode) => {
                let canvas: HTMLCanvasElement = canvasNode.canvas;
                let node: Node = canvasNode.node;

                if (!node || !canvas) {
                    return null;
                }

                let ctx: any = canvas.getContext("2d");
                let cw: number = this.container.element.clientWidth;
                let ch: number = this.container.element.clientHeight;

                ctx.fillStyle = "black"; // todo: This should be customizable by the end user
                ctx.fillRect(0, 0, cw, ch);

                let imHeight: number = node.image.height;
                let imWidth: number = node.image.width;

                let w: number = ch / imHeight * imWidth;
                let offsetLeft: number = (cw - w) / 2;

                canvas.width = cw;
                canvas.height = ch;

                ctx.drawImage(node.image, offsetLeft, 0, w, ch);
            });

        this.container.domRenderer.render$.onNext({name: this.name, vnode: vd.h(`canvas#${this.canvasId}`, [])});
    }

    public deactivate(): void {
        this.disposable.dispose();
        this.container.domRenderer.clear(this.name);
    }
}

export default SimpleUI;
