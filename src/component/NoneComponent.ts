import {ComponentService, Component} from "../Component";

export class NoneComponent extends Component {
    public static componentName: string = "none";

    protected _activate(): void {
        return;
    }

    protected _deactivate(): void {
        return;
    }
}

ComponentService.register(NoneComponent);
export default NoneComponent;
