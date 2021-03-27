import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { MockCreator } from "../../helper/MockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";

import { Navigator } from "../../../src/viewer/Navigator";
import { Component } from "../../../src/component/Component";
import { ComponentConfiguration } from "../../../src/component/interfaces/ComponentConfiguration";
import { HandlerBase } from "../../../src/component/util/HandlerBase";
import { Container } from "../../../src/viewer/Container";

interface TestConfiguration extends ComponentConfiguration {
    test: boolean;
}

class TestComponent extends Component<TestConfiguration> {
    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);
    }
    protected _activate(): void { /* noop */ }
    protected _deactivate(): void { /* noop */ }
    protected _getDefaultConfiguration(): TestConfiguration { return { test: false }; }
}

class TestHandler extends HandlerBase<TestConfiguration> {
    protected _disable(): void { /* noop */ }
    protected _enable(): void { /* noop */ }
    protected _getConfiguration(enable: boolean): TestConfiguration { return { test: enable }; }
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
