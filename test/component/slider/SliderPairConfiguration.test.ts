import { Subject } from "rxjs";
import { SliderComponent, sliderShowsPair } from "../../../src/component/slider/SliderComponent";
import { SliderDOMRenderer } from "../../../src/component/slider/SliderDOMRenderer";
import { SliderGLRenderer } from "../../../src/component/slider/SliderGLRenderer";
import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";
import { MockCreator } from "../../helper/MockCreator";

describe("SliderComponent pair configuration", () => {
    const image = (id: string, cameraType: string) => <any>{ id, cameraType };
    function frame(foreground: any, background: any): any {
        return { state: { currentImage: foreground, previousImage: background, motionless: true } };
    }
    function fixture(): any {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        new MockCreator().mockProperty(container, "domContainer", document.createElement("div"));
        (<jasmine.Spy>navigator.graphService.cacheImage$).and.returnValue(new Subject());
        const render = spyOn(SliderDOMRenderer.prototype, "render").and.returnValue(<any>{});
        const update = spyOn(SliderGLRenderer.prototype, "update");
        const component = new SliderComponent("slider", container, navigator);
        const original = image("original", "spherical");
        const photo = image("photo", "perspective");
        component.configure({ initialPosition: 0.5, viewAligned: true, ids: { foreground: "original", background: "photo" } });
        component.activate();
        (<Subject<any>>container.renderService.size$).next({ width: 1440, height: 900 });
        const state$ = <Subject<any>>navigator.stateService.currentState$;
        state$.next(frame(original, photo));
        return { component, render, update, state$, original, photo };
    }

    it("keeps the shown pair's options while the selected pair loads", () => {
        const f = fixture();
        expect(f.render.calls.mostRecent().args[4]).toBe(true);
        // A 360° comparison: not view aligned, which would hide the curtain
        // for the shown 360°-to-photo pair if applied before it loads.
        f.component.configure({ viewAligned: false, ids: { foreground: "original", background: "pano" } });
        f.state$.next(frame(f.original, f.photo));
        expect(f.render.calls.mostRecent().args[4]).toBe(true);
        expect(f.update.calls.mostRecent().args[3]).toBe(true);
        f.state$.next(frame(f.original, image("pano", "spherical")));
        expect(f.render.calls.mostRecent().args[4]).toBe(true);
        expect(f.update.calls.mostRecent().args[3]).toBe(false);
    });

    it("applies options for the shown pair immediately", () => {
        const f = fixture();
        f.component.configure({ sliderVisible: false });
        expect(f.render.calls.mostRecent().args[4]).toBe(false);
    });

    it("applies the configured curtain before the first frame of a new activation renders", () => {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        new MockCreator().mockProperty(container, "domContainer", document.createElement("div"));
        (<jasmine.Spy>navigator.graphService.cacheImage$).and.returnValue(new Subject());
        spyOn(SliderDOMRenderer.prototype, "render").and.returnValue(<any>{});
        const order: any[] = [];
        spyOn(SliderGLRenderer.prototype, "update").and.callFake(() => order.push("update"));
        spyOn(SliderGLRenderer.prototype, "updateCurtain").and.callFake((c: number, s: boolean) => order.push([c, s]));
        const component = new SliderComponent("slider", container, navigator);
        component.configure({ initialPosition: 0.3, screenSpace: true, viewAligned: true,
            ids: { foreground: "original", background: "photo" } });
        component.activate();
        (<Subject<any>>navigator.stateService.currentState$).next(
            frame(image("original", "spherical"), image("photo", "spherical")));
        const first = order.indexOf("update");
        expect(first).toBeGreaterThan(0);
        expect(order.slice(0, first)).toContainEqual([0.3, true]);
        component.deactivate();
    });
    it("matches only the configured foreground and background", () => {
        const ids = { foreground: "a", background: "b" };
        expect(sliderShowsPair({}, <any>{})).toBe(true);
        expect(sliderShowsPair({ ids }, <any>{ currentImage: { id: "a" }, previousImage: { id: "b" } })).toBe(true);
        expect(sliderShowsPair({ ids }, <any>{ currentImage: { id: "b" }, previousImage: { id: "a" } })).toBe(false);
        expect(sliderShowsPair({ ids }, <any>{ currentImage: { id: "a" }, previousImage: null })).toBe(false);
    });
});
