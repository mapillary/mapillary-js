/// <reference path="../../typings/virtual-dom/virtual-dom.d.ts" />
/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {UIService, UI} from "../UI";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";

interface ICanvasNode {
    canvas: HTMLCanvasElement;
    node: Node;
}

export class ImageUI extends UI {
    public static uiName: string = "image";

    private canvasId: string;
    private _disposable: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
        this.canvasId = `${container.id}-${this._name}`;
    }

    protected _activate(): void {
        this._disposable = this._container.domRenderer.element$.combineLatest(
            this._navigator.stateService.currentNode$,
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
                let cw: number = this._container.element.clientWidth;
                let ch: number = this._container.element.clientHeight;

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

        this._container.domRenderer.render$.onNext({name: this._name, vnode: vd.h(`canvas#${this.canvasId}`, [])});
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }
}

UIService.register(ImageUI);
export default ImageUI;
