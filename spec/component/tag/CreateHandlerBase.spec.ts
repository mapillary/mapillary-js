import { Navigator } from "../../../src/viewer/Navigator";

import { ContainerMockCreator } from "../../helper/ContainerMockCreator.spec";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator.spec";
import { Component } from "../../../src/component/Component";
import { ITagConfiguration } from "../../../src/component/interfaces/ITagConfiguration";
import { CreateHandlerBase } from "../../../src/component/tag/handlers/CreateHandlerBase";
import { TagCreator } from "../../../src/component/tag/TagCreator";
import { ViewportCoords } from "../../../src/geo/ViewportCoords";
import { Container } from "../../../src/viewer/Container";

class CreateTestHandler extends CreateHandlerBase {
    public validateBasic(basicPoint: number[]): boolean {
        return this._validateBasic(basicPoint);
    }

    protected _enableCreate(): void { /*noop*/ }
    protected _disableCreate(): void { /*noop*/ }
    protected _getNameExtension(): string { return "create-test"; }
}

class TestComponent extends Component<ITagConfiguration> {
    protected _activate(): void { /*noop*/ }
    protected _deactivate(): void { /*noop*/ }
    protected _getDefaultConfiguration(): ITagConfiguration { return {}; }
}

describe("CreateHandlerBase.ctor", () => {
    it("should be defined", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        const component: TestComponent = new TestComponent("test", container, navigator);
        const tagCreator: TagCreator = new TagCreator(component, navigator);
        const viewportCoords: ViewportCoords = new ViewportCoords();

        const createTestHandler: CreateTestHandler = new CreateTestHandler(component, container, navigator, viewportCoords, tagCreator);

        expect(createTestHandler).toBeDefined();
    });
});

describe("CreateHandlerBase.validateBasic", () => {
    it("should be valid when within [0, 1] interval", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        const component: TestComponent = new TestComponent("test", container, navigator);
        const tagCreator: TagCreator = new TagCreator(component, navigator);
        const viewportCoords: ViewportCoords = new ViewportCoords();

        const createTestHandler: CreateTestHandler = new CreateTestHandler(component, container, navigator, viewportCoords, tagCreator);

        expect(createTestHandler.validateBasic([0, 0])).toBe(true);
        expect(createTestHandler.validateBasic([1, 1])).toBe(true);
        expect(createTestHandler.validateBasic([0, 1])).toBe(true);
        expect(createTestHandler.validateBasic([1, 0])).toBe(true);
        expect(createTestHandler.validateBasic([0.5, 0.5])).toBe(true);
    });

    it("should be invalid when outside [0, 1] interval", () => {
        const container: Container = new ContainerMockCreator().create();
        const navigator: Navigator = new NavigatorMockCreator().create();
        const component: TestComponent = new TestComponent("test", container, navigator);
        const tagCreator: TagCreator = new TagCreator(component, navigator);
        const viewportCoords: ViewportCoords = new ViewportCoords();

        const createTestHandler: CreateTestHandler = new CreateTestHandler(component, container, navigator, viewportCoords, tagCreator);

        expect(createTestHandler.validateBasic([-1, 0.5])).toBe(false);
        expect(createTestHandler.validateBasic([2, 0.5])).toBe(false);
        expect(createTestHandler.validateBasic([1.00001, 0.5])).toBe(false);
        expect(createTestHandler.validateBasic([-0.00001, 0.5])).toBe(false);
        expect(createTestHandler.validateBasic([0.5, -1])).toBe(false);
        expect(createTestHandler.validateBasic([0.5, 2])).toBe(false);
        expect(createTestHandler.validateBasic([0.5, -0.00001])).toBe(false);
        expect(createTestHandler.validateBasic([0.5, 1.00001])).toBe(false);
    });
});
