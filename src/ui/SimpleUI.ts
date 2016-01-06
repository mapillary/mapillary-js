/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {ICurrentState} from "../State";
import {Navigator} from "../Viewer";
import {IUI} from "../UI";

export class SimpleUI implements IUI {
    private canvas: HTMLCanvasElement;
    private disposable: rx.IDisposable;
    private navigator: Navigator;
    private container: HTMLElement;

    constructor(container: HTMLElement, navigator: Navigator) {
        this.navigator = navigator;

        this.canvas = document.createElement("canvas");
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        container.appendChild(this.canvas);
        this.container = container;
    }

    public activate(): void {
        this.disposable = this.navigator.stateService.currentState.subscribe((currentState: ICurrentState) => {
            if (currentState != null && currentState.currentNode != null) {
                let ctx: any = this.canvas.getContext("2d");

                let cw: number = this.container.clientWidth;
                let ch: number = this.container.clientHeight;

                ctx.fillStyle = "black"; // todo: This should be customizable by the end user
                ctx.fillRect(0, 0, cw, ch);

                let w: number = ch / 3 * 4;
                let offsetLeft: number = (cw - w) / 2;

                this.canvas.width = cw;
                this.canvas.height = ch;

                ctx.drawImage(currentState.currentNode.image, offsetLeft, 0, w, ch);
            }
        });
    }

    public deactivate(): void {
        this.disposable.dispose();
        // remove canvas from DOM here
    }
}

export default SimpleUI;
