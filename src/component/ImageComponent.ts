/// <reference path="../../typings/browser.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {ComponentService, Component} from "../Component";
import {Node} from "../Graph";
import {Container, Navigator} from "../Viewer";

interface ICanvasNode {
    canvas: HTMLCanvasElement;
    node: Node;
}

export class ImageComponent extends Component {
    public static componentName: string = "image";

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
                let cw: number = canvas.clientWidth;
                let ch: number = canvas.clientHeight;

                ctx.fillStyle = "black"; // todo: This should be customizable by the end user
                ctx.fillRect(0, 0, cw, ch);

                let adaptableDomRenderer: HTMLElement = canvas.parentElement;

                canvas.width = adaptableDomRenderer.offsetWidth;
                canvas.height = adaptableDomRenderer.offsetHeight;

                ctx.drawImage(node.image, 0, 0, cw, ch);
            });

        this._container.domRenderer.renderAdaptable$.onNext({name: this._name, vnode: vd.h(`canvas#${this.canvasId}`, [])});
    }

    protected _deactivate(): void {
        this._disposable.dispose();
    }
}

ComponentService.register(ImageComponent);
export default ImageComponent;
