
import { SpatialComponent } from "../../../src/component/spatial/SpatialComponent";
import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";

describe("SpatialComponent.ctor", () => {
    it("should be defined", () => {
        const component: SpatialComponent =
            new SpatialComponent(
                SpatialComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        expect(component).toBeDefined();
    });
});

describe("SpatialComponent.deactivate", () => {
    it("should deactivate properly", () => {
        const component: SpatialComponent =
            new SpatialComponent(
                SpatialComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        component.activate();
        component.deactivate();
    });
});
