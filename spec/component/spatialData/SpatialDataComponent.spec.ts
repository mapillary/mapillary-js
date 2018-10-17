import {of as observableOf, Observable, ReplaySubject, Subject, VirtualTimeScheduler} from "rxjs";

import {
    SpatialDataComponent,
} from "../../../src/Component";

import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";

describe("SpatialDataComponent.ctor", () => {
    it("should be defined", () => {
        const component: SpatialDataComponent =
            new SpatialDataComponent(
                SpatialDataComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        expect(component).toBeDefined();
    });
});

describe("SpatialDataComponent.deactivate", () => {
    it("should deactivate properly", () => {
        const component: SpatialDataComponent =
            new SpatialDataComponent(
                SpatialDataComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        component.activate();
        component.deactivate();
    });
});
