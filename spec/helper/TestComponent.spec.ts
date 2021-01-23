import { Component } from "../../src/component/Component";
import { IComponentConfiguration } from "../../src/component/interfaces/IComponentConfiguration";
import { Container } from "../../src/viewer/Container";
import { Navigator } from "../../src/viewer/Navigator";

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
