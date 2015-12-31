/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {ICurrentState} from "../State";
import {Navigator} from "../Viewer";
import {IActivatableUI} from "../UI";

export class SimpleUI implements IActivatableUI {
    public graphSupport: boolean = true;

    private container: any;
    private disposable: rx.IDisposable;
    private navigator: Navigator;

    constructor(container: HTMLElement, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;
    }

    public activate(): void {
        this.disposable = this.navigator.stateService.currentState.subscribe((currentState: ICurrentState) => {
            if (currentState != null && currentState.currentNode != null) {
                this.container.style.backgroundImage = `url(${currentState.currentNode.image})`;
            }
        });
    }

    public deactivate(): void {
        this.disposable.dispose();
        this.container.style.backgroundImage = "";
    }

    public display(node: Node): void {
        let i: number = 0;
        i++;
    }
}

export default SimpleUI;
