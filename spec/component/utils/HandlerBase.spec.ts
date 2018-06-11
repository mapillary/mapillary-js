import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {MockCreator} from "../../helper/MockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";

import {
    Component,
    IComponentConfiguration,
    HandlerBase,
} from "../../../src/Component";
import {
    Container,
    Navigator,
} from "../../../src/Viewer";

interface ITestConfiguration extends IComponentConfiguration {
    test: boolean;
}

class TestComponent extends Component<ITestConfiguration> {
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }
    protected _activate(): void { /* noop */ }
    protected _deactivate(): void { /* noop */ }
    protected _getDefaultConfiguration(): ITestConfiguration { return { test: false }; }
}

class TestHandler extends HandlerBase<ITestConfiguration> {
    protected _disable(): void { /* noop */ }
    protected _enable(): void { /* noop */ }
    protected _getConfiguration(enable: boolean): ITestConfiguration { return { test: enable }; }
}

describe("HandlerBase.ctor", () => {
    it("should be defined", () => {
        let mockCreator: MockCreator = new MockCreator();
        let containerMock: Container = mockCreator.create(Container, "Container");
        let navigatorMock: Navigator = mockCreator.create(Navigator, "Navigator");

        let handler: TestHandler = new TestHandler(
            new TestComponent("test", containerMock, navigatorMock),
            containerMock,
            navigatorMock);

        expect(handler).toBeDefined();
        expect(handler.isEnabled).toBe(false);
    });
});

describe("HandlerBase.enable", () => {
    let containerMock: Container;
    let navigatorMock: Navigator;
    let testComponent: TestComponent;

    beforeEach(() => {
        containerMock = new ContainerMockCreator().create();
        navigatorMock = new NavigatorMockCreator().create();
        testComponent = new TestComponent("test", containerMock, navigatorMock);
    });

    it("should be enabled after calling enable if component activated", () => {
        let handler: TestHandler = new TestHandler(
            testComponent,
            containerMock,
            navigatorMock);

        testComponent.activate();
        handler.enable();

        expect(handler.isEnabled).toBe(true);
    });

    it("should not be enabled after calling enable if component deactivated", () => {
        let handler: TestHandler = new TestHandler(
            testComponent,
            containerMock,
            navigatorMock);

        testComponent.deactivate();
        handler.enable();

        expect(handler.isEnabled).toBe(false);
    });

    it("should call configure with enabled when component activated", () => {
        let configureSpy: jasmine.Spy = spyOn(testComponent, "configure").and.stub();

        let handler: TestHandler = new TestHandler(
            testComponent,
            containerMock,
            navigatorMock);

        testComponent.activate();
        handler.enable();

        expect(configureSpy.calls.count()).toBe(1);
        expect(configureSpy.calls.first().args[0].test).toBe(true);
    });

    it("should not call configure when component deactivated", () => {
        let configureSpy: jasmine.Spy = spyOn(testComponent, "configure").and.stub();

        let handler: TestHandler = new TestHandler(
            testComponent,
            containerMock,
            navigatorMock);

        testComponent.deactivate();
        handler.enable();

        expect(configureSpy.calls.count()).toBe(0);
    });
});

describe("HandlerBase.disable", () => {
    let containerMock: Container;
    let navigatorMock: Navigator;
    let testComponent: TestComponent;

    beforeEach(() => {
        containerMock = new ContainerMockCreator().create();
        navigatorMock = new NavigatorMockCreator().create();
        testComponent = new TestComponent("test", containerMock, navigatorMock);
    });

    it("should be disabled after calling disable if component activated", () => {
        let handler: TestHandler = new TestHandler(
            testComponent,
            containerMock,
            navigatorMock);

        testComponent.activate();
        handler.enable();
        handler.disable();

        expect(handler.isEnabled).toBe(false);
    });

    it("should be disabled after calling disable if component deactivated", () => {
        let handler: TestHandler = new TestHandler(
            testComponent,
            containerMock,
            navigatorMock);

        testComponent.activate();
        handler.enable();

        testComponent.deactivate();
        handler.disable();

        expect(handler.isEnabled).toBe(false);
    });

    it("should call configure with disabled when component activated", () => {
        let handler: TestHandler = new TestHandler(
            testComponent,
            containerMock,
            navigatorMock);

        testComponent.activate();
        handler.enable();

        let configureSpy: jasmine.Spy = spyOn(testComponent, "configure").and.stub();

        handler.disable();

        expect(configureSpy.calls.count()).toBe(1);
        expect(configureSpy.calls.first().args[0].test).toBe(false);
    });

    it("should not call configure when component deactivated", () => {
        let handler: TestHandler = new TestHandler(
            testComponent,
            containerMock,
            navigatorMock);

        testComponent.activate();
        handler.enable();

        let configureSpy: jasmine.Spy = spyOn(testComponent, "configure").and.stub();

        testComponent.deactivate();
        handler.disable();

        expect(configureSpy.calls.count()).toBe(0);
    });

    it("should not call configure when already disabled", () => {
        let handler: TestHandler = new TestHandler(
            testComponent,
            containerMock,
            navigatorMock);

        testComponent.activate();

        let configureSpy: jasmine.Spy = spyOn(testComponent, "configure").and.stub();
        handler.disable();

        expect(configureSpy.calls.count()).toBe(0);
    });
});
