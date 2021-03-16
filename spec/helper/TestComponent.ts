import { Component } from "../../src/component/Component";
import { ComponentConfiguration } from "../../src/component/interfaces/ComponentConfiguration";
import { Container } from "../../src/viewer/Container";
import { Navigator } from "../../src/viewer/Navigator";

export interface TestConfiguration extends ComponentConfiguration {
    test: boolean;
}

export class TestComponent extends Component<TestConfiguration> {
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }
    protected _activate(): void { /* noop */ }
    protected _deactivate(): void { /* noop */ }
    protected _getDefaultConfiguration(): TestConfiguration { return { test: false }; }
}
