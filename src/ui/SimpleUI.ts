/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {ICurrentState} from "../State";
import {Navigator} from "../Viewer";
import {IUI} from "../UI";

export class SimpleUI implements IUI {
    private canvas: HTMLCanvasElement;
    private disposable: rx.IDisposable;
    private navigator: Navigator;

    constructor(container: HTMLElement, navigator: Navigator) {
        this.navigator = navigator;

        this.canvas = document.createElement("canvas");
        this.canvas.width = 320;
        this.canvas.height = 240;
        container.appendChild(this.canvas);
    }

    public activate(): void {
        this.disposable = this.navigator.stateService.currentState.subscribe((currentState: ICurrentState) => {
            if (currentState != null && currentState.currentNode != null) {
                let ctx: any = this.canvas.getContext("2d");
                ctx.drawImage(currentState.currentNode.image, 0, 0);
            }
        });
    }

    public deactivate(): void {
        this.disposable.dispose();
        // remove canvas from DOM here
    }
}

export default SimpleUI;
