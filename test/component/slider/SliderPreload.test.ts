import { of as observableOf, Subject, throwError } from "rxjs";
import { SliderComponent } from "../../../src/component/slider/SliderComponent";
import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";

describe("SliderComponent.preload", () => {
    function fixture(): any {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        const component = new SliderComponent("slider", container, navigator);
        return { component, navigator };
    }

    it("caches both images without activating or configuring the slider", async () => {
        const f = fixture();
        const cache = (<jasmine.Spy>f.navigator.graphService.cacheImage$)
            .and.callFake((id: string) => observableOf(<any>{ id }));
        const configure = spyOn(f.component, "configure").and.callThrough();
        await f.component.preload({ background: "bg", foreground: "fg" });
        expect(cache.calls.allArgs()).toEqual([["bg"], ["fg"]]);
        expect(configure).not.toHaveBeenCalled();
        expect(f.component.activated).toBe(false);
    });

    it("resolves only after both images are cached", async () => {
        const f = fixture();
        const background = new Subject<any>();
        const foreground = new Subject<any>();
        (<jasmine.Spy>f.navigator.graphService.cacheImage$)
            .and.callFake((id: string) => id === "bg" ? background : foreground);
        let resolved = false;
        const done = f.component.preload({ background: "bg", foreground: "fg" }).then(() => resolved = true);
        foreground.next({ id: "fg" });
        await Promise.resolve();
        expect(resolved).toBe(false);
        background.next({ id: "bg" });
        await done;
        expect(resolved).toBe(true);
    });

    it("rejects when an image fails to cache", async () => {
        const f = fixture();
        (<jasmine.Spy>f.navigator.graphService.cacheImage$)
            .and.callFake((id: string) => id === "bg" ? throwError(new Error("missing")) : observableOf(<any>{ id }));
        await expect(f.component.preload({ background: "bg", foreground: "fg" })).rejects.toThrow("missing");
    });

    it("rejects an incomplete pair without caching", async () => {
        const f = fixture();
        const cache = (<jasmine.Spy>f.navigator.graphService.cacheImage$);
        await expect(f.component.preload(<any>{ background: "bg" })).rejects.toThrow();
        expect(cache).not.toHaveBeenCalled();
    });
});
