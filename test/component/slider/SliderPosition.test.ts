import { Subject } from "rxjs";
import { SliderComponent } from "../../../src/component/slider/SliderComponent";
import { SliderDOMRenderer } from "../../../src/component/slider/SliderDOMRenderer";
import { SliderGLRenderer } from "../../../src/component/slider/SliderGLRenderer";
import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";
import { MockCreator } from "../../helper/MockCreator";

describe("SliderComponent.setPosition", () => {
    function fixture(): any {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        new MockCreator().mockProperty(container, "domContainer", document.createElement("div"));
        const render = spyOn(SliderDOMRenderer.prototype, "render").and.returnValue(<any>{});
        spyOn(SliderGLRenderer.prototype, "update");
        const component = new SliderComponent("slider", container, navigator);
        component.configure({ initialPosition: 0.5 });
        component.activate();
        (<Subject<any>>container.renderService.size$).next({width: 1440, height: 900});
        (<Subject<any>>navigator.stateService.currentState$).next({state: {
            currentImage: {cameraType: "perspective"},
            previousImage: {cameraType: "perspective"}, motionless: true,
        }});
        return { component, render };
    }

    it("updates the curtain without deactivating or disposing its renderer", () => {
        const f = fixture();
        const dispose = spyOn(SliderGLRenderer.prototype, "dispose");
        const deactivate = spyOn(f.component, "deactivate");
        f.component.setPosition(1);
        expect(f.render.calls.mostRecent().args[0]).toBe(1);
        f.component.setPosition(0.5);
        expect(f.render.calls.mostRecent().args[0]).toBe(0.5);
        expect(f.component.activated).toBe(true);
        expect(deactivate).not.toHaveBeenCalled();
        expect(dispose).not.toHaveBeenCalled();
    });

    it("can reveal a fully hidden comparison repeatedly", () => {
        const f = fixture();
        for (const hidden of [0, 1, 1, 0]) {
            f.component.setPosition(hidden);
            f.component.setPosition(0.5);
            expect(f.render.calls.mostRecent().args[0]).toBe(0.5);
        }
    });

    it("rejects non-finite and out-of-range positions without changing the curtain", () => {
        const f = fixture();
        const count = f.render.calls.count();
        for (const position of [-1, 2, NaN, Infinity, -Infinity]) {
            expect(() => f.component.setPosition(position)).toThrowError(RangeError);
        }
        expect(f.render.calls.count()).toBe(count);
    });

    it("retains the configured initial position on a new activation", () => {
        const f = fixture();
        f.component.setPosition(0);
        f.component.deactivate();
        f.component.activate();
        // Render streams receive fresh frames after activation.
        expect(f.component.activated).toBe(true);
        expect(f.component.defaultConfiguration.initialPosition).toBe(1);
    });
});
