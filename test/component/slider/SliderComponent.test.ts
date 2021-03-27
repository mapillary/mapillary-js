import { empty as observableEmpty } from "rxjs";

import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";

import { SliderComponent } from "../../../src/component/slider/SliderComponent";
import { Container } from "../../../src/viewer/Container";

describe("SliderComponent.ctor", () => {
    it("should be defined", () => {
        const sliderComponent: SliderComponent =
            new SliderComponent(
                SliderComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        expect(sliderComponent).toBeDefined();
    });
});

describe("SliderComponent.deactivate", () => {
    it("should deactivate properly", () => {
        const containerMock: Container = new ContainerMockCreator().create();
        (<jasmine.Spy>containerMock.mouseService.filtered$).and.returnValue(observableEmpty());

        const sliderComponent: SliderComponent =
            new SliderComponent(
                SliderComponent.componentName,
                new ContainerMockCreator().create(),
                new NavigatorMockCreator().create());

        sliderComponent.activate();
        sliderComponent.deactivate();
    });
});
