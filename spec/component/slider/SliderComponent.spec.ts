import {empty as observableEmpty} from "rxjs";

import {SliderComponent} from "../../../src/Component";
import {
    Container,
    Navigator,
} from "../../../src/Viewer";

import {ContainerMockCreator} from "../../helper/ContainerMockCreator.spec";
import {NavigatorMockCreator} from "../../helper/NavigatorMockCreator.spec";

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
