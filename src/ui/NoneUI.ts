import {IUI} from "../UI";

export class NoneUI implements IUI {
    public activate(): void {
        return;
    }

    public deactivate(): void {
        return;
    }
}

export default NoneUI;
