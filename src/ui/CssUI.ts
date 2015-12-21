import {Node} from "../Graph";
import {IActivatableUI} from "../UI";
import {StateContext} from "../State";
import * as _ from "underscore";

export class CssUI implements IActivatableUI {
    public graphSupport: boolean = false;

    private container: HTMLElement;

    // inject viewer here --------------->
    constructor(container: HTMLElement, state: StateContext) {
        let uiContainer: HTMLElement = document.createElement("div");
        uiContainer.className = "CssUi";
        container.appendChild(uiContainer);

        this.container = uiContainer;
    }

    public activate(): void {
        _.each(this.getDirectionsUi(), (direction: HTMLElement) => {
            this.container.appendChild(direction);
        });
        return;
    }

    public deactivate(): void {
        this.container = null;
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
