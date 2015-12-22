/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />

import * as rx from "rx";

import {Node} from "../Graph";
import {IActivatableUI} from "../UI";
import {ICurrentState, StateService} from "../State";
import * as _ from "underscore";

export class CssUI implements IActivatableUI {
    public graphSupport: boolean = true;

    private container: HTMLElement;
    private disposable: rx.IDisposable;
    private stateService: StateService;

    // inject viewer here --------------->
    constructor(container: HTMLElement, stateService: StateService) {
        let uiContainer: HTMLElement = document.createElement("div");
        uiContainer.className = "CssUi";
        container.appendChild(uiContainer);

        this.container = uiContainer;
        this.stateService = stateService;
    }

    public activate(): void {
        this.disposable = this.stateService.currentState.subscribe((currentState: ICurrentState) => {
            if (currentState != null && currentState.currentNode != null) {
                // fixme: UPDATE DIRECTIONS HERE
                _.each(this.getDirectionsUi(), (direction: HTMLElement) => {
                    this.container.appendChild(direction);
                });
            }
        });

        return;
    }

    public deactivate(): void {
        this.disposable.dispose();
        return;
    }

    public display(node: Node): void {
        return;
    }

    private getDirectionsUi(): Array<HTMLElement> {
        let possibleDirections: Array<string> = ["Forward", "Backward", "Left", "Right", "Turnaround"];

        return _.map(possibleDirections, (str: string) => {
            let elem: HTMLElement = document.createElement("button");
            elem.className = `btn Direction Direction${str}`;
            elem.innerText = str[0];
            return elem;
        });

    }
}

export default CssUI;
