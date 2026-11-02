import * as THREE from "three";
import { Subject } from "rxjs";
import { SliderConfigurationMode as Mode } from "../../../src/component/interfaces/SliderConfiguration";
import { SliderTransform } from "../../../src/component/slider/SliderTransform";
import { SliderGLRenderer } from "../../../src/component/slider/SliderGLRenderer";
import { SliderComponent } from "../../../src/component/slider/SliderComponent";
import { SliderDOMRenderer } from "../../../src/component/slider/SliderDOMRenderer";
import { SliderShaders } from "../../../src/component/slider/SliderShaders";
import { sliderCurtainFeather } from "../../../src/component/slider/SliderCurtain";
import { Camera } from "../../../src/geo/Camera";
import { State } from "../../../src/state/State";
import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";
import { MockCreator } from "../../helper/MockCreator";

const LEVEL = [Math.PI / 2, 0, 0];
function image(id: string): any {
    return { id, merged: true, mergeId: id, cameraType: "perspective", width: 1600, height: 1200,
        scale: 1, exifOrientation: 1, rotation: LEVEL, clusterId: id,
        camera: { type: "perspective", parameters: { focal: 0.8, k1: 0, k2: 0 } },
        image: document.createElement("img"), mesh: { vertices: [], faces: [] } };
}
function transform(i: any, east: number): any {
    const R = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), i.rotation[0]);
    const t = new THREE.Vector3(-east, 0, 0).applyMatrix4(R);
    return new SliderTransform(i.exifOrientation, i.width, i.height, i.scale,
        i.rotation, t.toArray(), i.image, undefined, Object.values(i.camera.parameters), i.cameraType);
}
function state(): any {
    const previousImage = image("previous"); const currentImage = image("current");
    const previousTransform = transform(previousImage, 0); const currentTransform = transform(currentImage, 3);
    return { previousImage, currentImage, previousTransform, currentTransform,
        previousCamera: new Camera(previousTransform), motionless: false, trajectory: [previousImage, currentImage] };
}
/** JS mirror of sliderCurtainAlpha, to pin the GLSL semantics. */
function alpha(curtain: number, feather: number, x: number): number {
    if (curtain <= 0) { return 0; }
    if (curtain >= 1) { return 1; }
    if (feather > 0) {
        const t = Math.max(0, Math.min(1, (x - (curtain - feather)) / (2 * feather)));
        return 1 - t * t * (3 - 2 * t);
    }
    return x < curtain ? 1 : 0;
}

describe("Slider soft edge", () => {
    it("clamps the feather and defaults to the hard split", () => {
        expect([undefined, null, NaN, -1, 0, 0.025, 1, "0.02"].map(sliderCurtainFeather))
            .toEqual([0, 0, 0, 0, 0, 0.025, 0.1, 0]);
        expect(alpha(0.5, 0, 0.49)).toBe(1); expect(alpha(0.5, 0, 0.5)).toBe(0);
        expect(alpha(0.5, 0.025, 0.5)).toBeCloseTo(0.5, 12);
        expect(alpha(0.5, 0.025, 0.47)).toBe(1); expect(alpha(0.5, 0.025, 0.53)).toBe(0);
        expect(alpha(0, 0.025, 0)).toBe(0); expect(alpha(1, 0.025, 0.999)).toBe(1);
    });
    it("is the only curtain variation in every curtain shader, alpha-blended", () => {
        for (const name of ["perspectiveCurtain", "fisheyeCurtain", "sphericalCurtain", "perspectiveDistortedCurtain"]) {
            const frag = (SliderShaders as any)[name].fragment as string;
            expect(frag).toContain("uniform float curtainFeather;");
            expect(frag).toContain("smoothstep(curtain - curtainFeather, curtain + curtainFeather, screenX)");
            expect(frag).toContain("baseColor.a = opacity * curtainAlpha;");
            expect(frag).not.toContain("${");
        }
    });
    it("sets the feather uniform on the curtain, including after a rebuild", () => {
        const r = new SliderGLRenderer() as any;
        r.update({ id: 1, state: state() }, Mode.Stationary, true, true, true);
        const u = () => r._scene.planes[0].mesh.material.uniforms;
        expect(u().curtainFeather.value).toBe(0);
        r.updateCurtainFeather(0.025);
        expect(u().curtainFeather.value).toBe(0.025);
        expect(r.needsRender).toBe(true);
        r.update({ id: 2, state: state() }, Mode.Motion, true, true, true);
        expect(u().curtainFeather.value).toBe(0.025);
        r.updateCurtainFeather(undefined);
        expect(u().curtainFeather.value).toBe(0);
        r.dispose();
    });
    it("passes the configured feather to the renderer", () => {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        new MockCreator().mockProperty(container, "domContainer", document.createElement("div"));
        spyOn(SliderDOMRenderer.prototype, "render").and.returnValue({} as any);
        spyOn(SliderGLRenderer.prototype, "update");
        const feather = spyOn(SliderGLRenderer.prototype, "updateCurtainFeather").and.callThrough();
        const component = new SliderComponent("slider", container, navigator);
        spyOn((component as any), "_catchCacheImage$").and.returnValue(new Subject());
        component.configure({ viewAligned: true, screenSpace: true, curtainFeather: 0.025,
            ids: { foreground: "current", background: "previous" } });
        component.activate();
        (container.renderService.size$ as Subject<any>).next({ width: 1200, height: 800 });
        (navigator.stateService.state$ as Subject<any>).next(State.Traversing);
        (navigator.stateService.currentState$ as Subject<any>).next({ id: 1, state: state() });
        expect(feather.calls.mostRecent().args).toEqual([0.025]);
        component.deactivate();
    });
});
