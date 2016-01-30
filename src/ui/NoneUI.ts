import {UIService, UI} from "../UI";

export class NoneUI extends UI {
    public static uiName: string = "none";

    protected _activate(): void {
        return;
    }

    protected _deactivate(): void {
        return;
    }
}

UIService.register(NoneUI);
export default NoneUI;
