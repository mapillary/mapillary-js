/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {ICurrentState, StateService} from "../State";
import {IActivatableUI} from "../UI";

export class SimpleUI implements IActivatableUI {
    public graphSupport: boolean = true;

    private container: any;
    private disposable: rx.IDisposable;
    private stateService: StateService;

    constructor(container: HTMLElement, stateService: StateService) {
        this.container = container;
        this.stateService = stateService;
    }

    public activate(): void {
        this.disposable = this.stateService.currentState.subscribe((currentState: ICurrentState) => {
            if (currentState != null && currentState.currentNode != null) {
                this.container.style.backgroundImage =
                    "url(https://d1cuyjsrcm0gby.cloudfront.net/" + currentState.currentNode.key + "/thumb-320.jpg)";
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
