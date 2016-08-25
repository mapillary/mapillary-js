import {ComponentService, Component, IComponentConfiguration} from "../Component";

export class NoneComponent extends Component<IComponentConfiguration> {
    public static componentName: string = "none";

    protected _activate(): void {
        return;
    }

    protected _deactivate(): void {
        return;
    }

    protected _getDefaultConfiguration(): IComponentConfiguration {
        return {};
    }
}

ComponentService.register(NoneComponent);
export default NoneComponent;
