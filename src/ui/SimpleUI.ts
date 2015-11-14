import {Node} from "../Graph";
import {IActivatableUI} from "../UI";

export class SimpleUI implements IActivatableUI {
    public graphSupport: boolean = true;

    private container: any;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    public activate(): void {
        return;
    }

    public deactivate(): void {
        this.container.style.backgroundImage = "";
    }

    public display(node: Node): void {
        this.container.style.backgroundImage = "url(https://d1cuyjsrcm0gby.cloudfront.net/" + node.key + "/thumb-320.jpg)";
    }
}

export default SimpleUI;
