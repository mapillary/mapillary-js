import { Subject } from "rxjs";
import { SliderComponent } from "../../../src/component/slider/SliderComponent";
import { SliderDOMRenderer } from "../../../src/component/slider/SliderDOMRenderer";
import { SliderGLRenderer } from "../../../src/component/slider/SliderGLRenderer";
import { SliderMeshFactory } from "../../../src/component/slider/SliderMeshFactory";
import { ViewportCoords } from "../../../src/geo/ViewportCoords";
import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";
import { MockCreator } from "../../helper/MockCreator";

describe("Slider opt-in screen-space curtain", () => {
    function renderer(): any {
        const r = new SliderGLRenderer() as any;
        r._scene.planes.push({mesh: {material: {uniforms: {
            curtain: {value: 1}, screenSpace: {value: false},
        }}}});
        return r;
    }
    it("keeps image-coordinate clipping as the default", () => {
        const r = renderer();
        r.updateCurtain(0.5);
        expect(r._scene.planes[0].mesh.material.uniforms.screenSpace.value).toBe(false);
        expect(r._scene.planes[0].mesh.material.uniforms.curtain.value).toBe(0.5);
    });
    it("retains exact screen fractions including fully hidden and visible endpoints", () => {
        const r = renderer();
        for (const p of [0, 0.25, 0.5, 0.75, 1]) {
            r.updateCurtain(p, true);
            const uniforms = r._scene.planes[0].mesh.material.uniforms;
            expect(uniforms.curtain.value).toBe(p);
            expect(uniforms.screenSpace.value).toBe(true);
        }
    });
    it("invalidates when clipping mode changes at the same position", () => {
        const r = renderer();
        r.updateCurtain(0.5, true);
        r._needsRender = false;
        r.updateCurtain(0.5, false);
        expect(r.needsRender).toBe(true);
        expect(r._scene.planes[0].mesh.material.uniforms.screenSpace.value).toBe(false);
    });
    it("does not invalidate unchanged screen-space position", () => {
        const r = renderer();
        r.updateCurtain(0.5, true);
        r._needsRender = false;
        r.updateCurtain(0.5, true);
        expect(r.needsRender).toBe(false);
    });
    for (const method of ["_createCurtainSphereMaterialParameters",
        "_createCurtainPlaneMaterialParameters", "_createCurtainPlaneMaterialParametersFisheye",
        "_createDistortedCurtainPlaneMaterialParameters"]) {
        it(`uses homogeneous screen clipping without changing the ${method} lens projection`, () => {
            const f = new SliderMeshFactory() as any;
            const transform = {focal: 0.8, ck1: 0.02, ck2: 0.01, basicWidth: 4,
                basicHeight: 3, projectorMatrix: () => ({})};
            const p = f[method](transform, {});
            expect(p.uniforms.screenSpace.value).toBe(false);
            expect(p.vertexShader).toContain("vClipPosition = gl_Position;");
            expect(p.fragmentShader).toContain("vClipPosition.x / vClipPosition.w");
            expect(p.fragmentShader).toContain("curtain <= 0.0");
            // Hard split (curtainFeather 0) keeps the original rule: hidden at
            // <=0, full at >=1, otherwise visible only left of the curtain.
            expect(p.fragmentShader).toContain("curtain >= 1.0");
            expect(p.fragmentShader).toContain("return screenX < curtain ? 1.0 : 0.0;");
        });
    }
    function component(screenSpace: boolean): any {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        new MockCreator().mockProperty(container, "domContainer", document.createElement("div"));
        spyOn(SliderDOMRenderer.prototype, "render").and.returnValue({} as any);
        spyOn(SliderGLRenderer.prototype, "update");
        const update = spyOn(SliderGLRenderer.prototype, "updateCurtain");
        const project = spyOn(ViewportCoords.prototype, "viewportToBasic")
            .and.callFake(x => x < 0 ? [0.8, 0.5] : [0.1, 0.5]);
        const c = new SliderComponent("slider", container, navigator);
        c.configure({initialPosition: 0.5, screenSpace});
        c.activate();
        (container.renderService.size$ as Subject<any>).next({width: 1440, height: 900});
        (navigator.stateService.currentState$ as Subject<any>).next({state: {
            currentImage: {cameraType: "spherical"},
            previousImage: {cameraType: "spherical"}, motionless: true,
        }});
        (container.renderService.renderCamera$ as Subject<any>).next({perspective: {}});
        (navigator.stateService.currentTransform$ as Subject<any>).next({});
        return {c, container, update, project};
    }
    it("passes the visible fraction directly, bypassing panorama wrap and camera projection", () => {
        const f = component(true);
        expect(f.update.calls.mostRecent().args).toEqual([0.5, true]);
        for (const position of [0, 0.25, 0.5, 0.75, 1]) {
            f.c.setPosition(position);
            expect(f.update.calls.mostRecent().args).toEqual([position, true]);
        }
        expect(f.project).not.toHaveBeenCalled();
        f.c.deactivate();
    });
    it("preserves the existing panorama coordinate mapping when not opted in", () => {
        const f = component(false);
        expect(f.update.calls.mostRecent().args[0]).toBeCloseTo(0.95);
        expect(f.update.calls.mostRecent().args[1]).toBe(false);
        expect(f.project).toHaveBeenCalled();
        f.c.deactivate();
    });
});
