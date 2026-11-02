import { Subject } from "rxjs";
import { SliderComponent } from "../../../src/component/slider/SliderComponent";
import { SliderDOMRenderer } from "../../../src/component/slider/SliderDOMRenderer";
import { SliderGLRenderer } from "../../../src/component/slider/SliderGLRenderer";
import { SliderConfigurationMode } from "../../../src/component/interfaces/SliderConfiguration";
import { State } from "../../../src/state/State";
import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";
import { MockCreator } from "../../helper/MockCreator";

describe("Slider entry camera state", () => {
    function fixture(): any {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        new MockCreator().mockProperty(container, "domContainer", document.createElement("div"));
        spyOn(SliderDOMRenderer.prototype, "render").and.returnValue(<any>{});
        spyOn(SliderGLRenderer.prototype, "update");
        const component = new SliderComponent("slider", container, navigator);
        component.configure({ initialPosition: 0.5 });
        component.activate();
        (<Subject<any>>container.renderService.size$).next({width: 1440, height: 900});
        (<Subject<State>>navigator.stateService.state$).next(State.Traversing);
        const frame = (previous: boolean, cameraType = "spherical", motionless = true) => {
            (<Subject<any>>navigator.stateService.currentState$).next({state: {
                currentImage: {cameraType}, previousImage: previous ? {cameraType} : null,
                motionless,
            }});
        };
        return {component, navigator, frame};
    }

    it("does not reset the lone original's view or zoom while comparison loads", () => {
        const f = fixture();
        f.frame(false);
        f.frame(false);
        expect(f.navigator.stateService.wait).not.toHaveBeenCalled();
        expect(f.navigator.stateService.waitInteractively).not.toHaveBeenCalled();
        f.component.deactivate();
    });

    it("enters interactive comparison only once both panoramas are available", () => {
        const f = fixture();
        f.frame(false);
        f.frame(true);
        expect(f.navigator.stateService.wait).not.toHaveBeenCalled();
        expect(f.navigator.stateService.waitInteractively).toHaveBeenCalledTimes(1);
        f.component.deactivate();
    });

    it("preserves legacy waiting for an available noninteractive motion pair", () => {
        const f = fixture();
        f.frame(false, "perspective", false);
        expect(f.navigator.stateService.wait).not.toHaveBeenCalled();
        f.frame(true, "perspective", false);
        expect(f.navigator.stateService.wait).toHaveBeenCalledTimes(1);
        expect(f.navigator.stateService.waitInteractively).not.toHaveBeenCalled();
        f.component.deactivate();
    });

    it("does not change camera state when the curtain is deliberately hidden", () => {
        const f = fixture();
        f.component.configure({sliderVisible: false});
        f.frame(true);
        expect(f.navigator.stateService.wait).not.toHaveBeenCalled();
        expect(f.navigator.stateService.waitInteractively).not.toHaveBeenCalled();
        f.component.deactivate();
    });

    it("retains interactive stationary perspective comparisons", () => {
        const f = fixture();
        f.component.configure({mode: SliderConfigurationMode.Stationary});
        f.frame(true, "perspective", false);
        expect(f.navigator.stateService.wait).not.toHaveBeenCalled();
        expect(f.navigator.stateService.waitInteractively).toHaveBeenCalledTimes(1);
        f.component.deactivate();
    });
});
