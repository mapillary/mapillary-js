import {Node} from "../Graph";
import {IActivatableUI} from "../UI";

export class CoverUI implements IActivatableUI {
    public graphSupport: boolean = false;

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
        this.container.style.backgroundImage = "url(https://d1cuyjsrcm0gby.cloudfront.net/" + node.key + "/thumb-640.jpg)";
    }
}

export default CoverUI;
