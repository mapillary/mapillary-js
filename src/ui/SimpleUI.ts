/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {ICurrentState} from "../State";
import {Navigator} from "../Viewer";
import {IActivatableUI} from "../UI";

export class SimpleUI implements IActivatableUI {
    public graphSupport: boolean = true;

    private canvas: HTMLCanvasElement;
    private disposable: rx.IDisposable;
    private navigator: Navigator;

    constructor(container: HTMLElement, navigator: Navigator) {
        console.log("LOADING MTF SIMPLE UI!!!");
        this.navigator = navigator;

        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        container.appendChild(this.canvas);
    }

    public activate(): void {
        this.disposable = this.navigator.stateService.currentState.subscribe((currentState: ICurrentState) => {
            if (currentState != null && currentState.currentNode != null) {
                console.log(currentState.currentNode.key);
                let ctx: any = this.canvas.getContext("2d");
                ctx.drawImage(currentState.currentNode.image, 0, 0);
            }
        });
    }

    public deactivate(): void {
        this.disposable.dispose();
        // remove canvas from DOM here
    }

    public display(node: Node): void {
        let i: number = 0;
        i++;
    }
}

export default SimpleUI;
