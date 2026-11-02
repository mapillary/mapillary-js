import * as THREE from "three";
import { of, Subject } from "rxjs";
import { SliderComponent } from "../../../src/component/slider/SliderComponent";
import { SliderDOMRenderer } from "../../../src/component/slider/SliderDOMRenderer";
import { SliderGLRenderer } from "../../../src/component/slider/SliderGLRenderer";
import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";
import { MockCreator } from "../../helper/MockCreator";

// Selected-pair hydration must retain the original's live wheel-zoom anchor.
describe("Slider comparison selection framing", () => {
    function fixture(viewAligned = true, single = false): any {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        new MockCreator().mockProperty(container, "domContainer", document.createElement("div"));
        spyOn(SliderDOMRenderer.prototype, "render").and.returnValue(<any>{});
        spyOn(SliderGLRenderer.prototype, "update");
        const component = new SliderComponent("slider", container, navigator);
        const background$ = new Subject<any>(), foreground$ = new Subject<any>();
        spyOn<any>(component, "_catchCacheImage$").and.callFake(id => id === "new" ? background$ : foreground$);
        component.activate();
        (<Subject<any>>container.renderService.size$).next({ width: 1440, height: 900 });
        const original = { id: "original", cameraType: "perspective" };
        const old = { id: "old", cameraType: "perspective" };
        const project = jest.fn().mockReturnValue([0.51, 0.49]);
        const frame = () => (<Subject<any>>navigator.stateService.currentState$).next({ state: {
            currentImage: original, previousImage: single ? null : old,
            motionless: true, trajectory: single ? [original] : [old, original],
            currentTransform: { projectBasic: project }, camera: { lookat: new THREE.Vector3(1, 2, 3) },
            zoom: 1.25,
        }});
        frame();
        component.configure({ ids: { foreground: "original", background: "new" }, viewAligned });
        frame();
        return { component, navigator, background$, foreground$, original, project, frame };
    }
    it("keeps the latest source center after background hydration without writing zoom", () => {
        const f = fixture();
        f.project.mockReturnValue([0.57, 0.46]); f.frame();
        f.background$.next({ id: "new" }); f.foreground$.next(f.original); f.frame();
        expect(f.navigator.stateService.setImages.calls.allArgs()).toEqual([[ [{ id: "new" }] ], [ [f.original] ]]);
        expect(f.navigator.stateService.setCenter).toHaveBeenCalledWith([0.57, 0.46]);
        expect(f.navigator.stateService.setZoom).not.toHaveBeenCalled();
        f.component.deactivate();
    });
    it("retains the entry source center when the first background is prepended", () => {
        const f = fixture(true, true);
        f.background$.next({ id: "new" }); f.foreground$.next(f.original); f.frame();
        expect(f.navigator.stateService.prependImages).toHaveBeenCalledWith([{ id: "new" }]);
        expect(f.navigator.stateService.setCenter).toHaveBeenCalledWith([0.51, 0.49]);
        expect(f.navigator.stateService.setZoom).not.toHaveBeenCalled();
        f.component.deactivate();
    });
    it("does not drop synchronously cached pairs before a new state frame arrives", () => {
        const f = fixture();
        const cache = <jasmine.Spy><any>f.component._catchCacheImage$;
        cache.and.callFake(id => of(id === "new" ? { id: "new" } : f.original));
        f.component.configure({ ids: { foreground: "original", background: "new" }, viewAligned: true });
        expect(f.navigator.stateService.setImages).not.toHaveBeenCalled();
        f.frame();
        expect(f.navigator.stateService.setImages).toHaveBeenCalledTimes(2);
        expect(f.navigator.stateService.setCenter).toHaveBeenCalledWith([0.51, 0.49]);
        f.component.deactivate();
    });
    it("does not change legacy non-view-aligned pair handling", () => {
        const f = fixture(false);
        f.background$.next({ id: "new" }); f.foreground$.next(f.original); f.frame();
        expect(f.navigator.stateService.setCenter).not.toHaveBeenCalled();
        expect(f.navigator.stateService.setZoom).not.toHaveBeenCalled();
        f.component.deactivate();
    });
});
