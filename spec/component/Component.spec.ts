
import {skip} from "rxjs/operators";

import {
    Component,
    IComponentConfiguration,
} from "../../src/Component";

interface ITestConfiguration extends IComponentConfiguration {
    test?: string;
}

class TestComponent extends Component<ITestConfiguration> {
    protected _activate(): void { /*noop*/ }
    protected _deactivate(): void { /*noop*/ }

    protected _getDefaultConfiguration(): ITestConfiguration {
        return {};
    }
}

describe("Component.ctor", () => {
    it("should be defined", () => {
        let component: TestComponent = new TestComponent("test", undefined, undefined);

        expect(component).toBeDefined();
    });
});

describe("Component.configuration$", () => {
    it("should be emtpy default configuration", () => {
        let component: TestComponent = new TestComponent("test", undefined, undefined);

        component.configuration$
            .subscribe(
                (configuration: IComponentConfiguration): void => {
                    expect(Object.keys(configuration).length).toBe(0);
                });
    });

    it("should emit when configured", (done: Function) => {
        let component: TestComponent = new TestComponent("test", undefined, undefined);

        component.configuration$.pipe(
            skip(1))
            .subscribe(
                (configuration: ITestConfiguration): void => {
                    expect(Object.keys(configuration).length).toBe(1);
                    expect(configuration.test).toBe("test");
                    done();
                });

        component.configure({ test: "test" });
    });

    it("should emit when configured value is changed", (done: Function) => {
        let component: TestComponent = new TestComponent("test", undefined, undefined);

        component.configuration$.pipe(
            skip(2))
            .subscribe(
                (configuration: ITestConfiguration): void => {
                    expect(Object.keys(configuration).length).toBe(1);
                    expect(configuration.test).toBe("testchanged");
                    done();
                });

        component.configure({ test: "test" });
        component.configure({ test: "testchanged" });
    });
});
