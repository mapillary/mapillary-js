import {Component, ComponentService} from "../../Component";
import {Container, Navigator} from "../../Viewer";

export class SliderComponent extends Component {
    public static componentName: string = "slider";

    constructor (name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }

    protected _activate(): void { return; }

    protected _deactivate(): void { return; }
}

ComponentService.register(SliderComponent);
export default SliderComponent;
