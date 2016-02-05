import {UIService, Component} from "../Component";

export class NoneUI extends Component {
    public static componentName: string = "none";

    protected _activate(): void {
        return;
    }

    protected _deactivate(): void {
        return;
    }
}

UIService.register(NoneUI);
export default NoneUI;
