import {Container, Navigator} from "../Viewer";
import {IUI} from "../UI";

export class CoverUI implements IUI {
    private container: Container;
    private navigator: Navigator;

    constructor(container: Container, navigator: Navigator) {
        this.container = container;
        this.navigator = navigator;
    }

    public activate(): void {
        return;
    }

    public deactivate(): void {
        return;
    }
}

export default CoverUI;
