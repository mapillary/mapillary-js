import {IUI} from "../UI";

export class CoverUI implements IUI {
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
}

export default CoverUI;
