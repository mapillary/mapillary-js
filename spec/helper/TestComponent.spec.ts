import {
    Component,
    IComponentConfiguration,
} from "../../src/Component";
import {
    Container,
    Navigator,
} from "../../src/Viewer";

export interface ITestConfiguration extends IComponentConfiguration {
    test: boolean;
}

export class TestComponent extends Component<ITestConfiguration> {
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }
    protected _activate(): void { /* noop */ }
    protected _deactivate(): void { /* noop */ }
    protected _getDefaultConfiguration(): ITestConfiguration { return { test: false }; }
}

export default TestComponent;
