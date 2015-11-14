import {Node} from "../Graph";
import {IActivatableUI} from "../UI";

export class NoneUI implements IActivatableUI {
    public graphSupport: boolean;

    constructor(graphSupport: boolean) {
        this.graphSupport = graphSupport;
    }

    public activate(): void {
        return;
    }

    public deactivate(): void {
        return;
    }

    public display(node: Node): void {
        return;
    }
}

export default NoneUI;
