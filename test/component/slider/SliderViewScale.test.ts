import * as THREE from "three";
import { Subject } from "rxjs";
import { SliderConfigurationMode } from "../../../src/component/interfaces/SliderConfiguration";
import { SliderComponent } from "../../../src/component/slider/SliderComponent";
import { SliderDOMRenderer } from "../../../src/component/slider/SliderDOMRenderer";
import { SliderGLRenderer } from "../../../src/component/slider/SliderGLRenderer";
import { SliderTransform } from "../../../src/component/slider/SliderTransform";
import { Camera } from "../../../src/geo/Camera";
import { State } from "../../../src/state/State";
import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";
import { MockCreator } from "../../helper/MockCreator";

function image(id: string, cameraType: string, width: number, height: number): any {
    return {
        id, cameraType, width, height, scale: 1, exifOrientation: 1,
        rotation: id === "current" ? [Math.PI / 2, 0, 0] : [Math.PI / 2, 0.05, 0],
        camera: { type: cameraType, parameters: { focal: 0.62, k1: 0.02, k2: -0.005 } },
        mesh: { vertices: [], faces: [] }, image: document.createElement("img"),
    };
}
function transform(i: any, translation: number[]): any {
    return new SliderTransform(i.exifOrientation, i.width, i.height, i.scale,
                               i.rotation, translation, i.image, undefined,
                               Object.values(i.camera.parameters) as number[], i.cameraType);
}
function frame(currentType: string = "perspective", previousType: string = "spherical"): any {
    const currentImage = image("current", currentType, 4000, 3000);
    const previousImage = image("previous", previousType, 4000, 2000);
    const currentTransform = transform(currentImage, [-2, -3, -4]);
    const previousTransform = transform(previousImage, [-2, -13, -4]);
    return { id: 7, state: {
        currentImage, previousImage, currentTransform, previousTransform,
        previousCamera: new Camera(previousTransform), motionless: false,
    } };
}
function liveCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(43, 1.7, 0.2, 2000);
    camera.position.set(2, 3, 4);
    camera.up.set(0, 0, 1);
    camera.lookAt(3, 5, 4.5);
    camera.zoom = 1.4;
    camera.setViewOffset(2000, 1400, 100, 80, 1800, 1200);
    camera.updateMatrixWorld(true);
    camera.matrixAutoUpdate = false;
    return camera;
}
/** Screen position (NDC) of a camera-space direction. */
function project(camera: THREE.PerspectiveCamera, direction: THREE.Vector3): THREE.Vector3 {
    return direction.clone().applyQuaternion(camera.quaternion).add(camera.position).project(camera);
}

describe("Slider view-aligned panorama widening", () => {
    it("widens the panorama background about the view centre", () => {
        const r = new SliderGLRenderer() as any;
        r.update(frame(), SliderConfigurationMode.Stationary, false, true);
        const live = liveCamera();
        const plain = r._getPreviousPerspective(live).clone();
        r._needsRender = false;
        r.updateViewScale(2);
        expect(r.needsRender).toBe(true);
        const wide = r._getPreviousPerspective(live);
        // Same direction and origin; only the projection changes.
        expect(wide.quaternion.angleTo(plain.quaternion)).toBeCloseTo(0, 10);
        expect(wide.position.toArray()).toEqual(plain.position.toArray());
        const ray = new THREE.Vector3(0.1, -0.05, -1);
        const a = project(plain, ray);
        const b = project(wide, ray);
        const centre = project(plain, new THREE.Vector3(0, 0, -1));
        expect(project(wide, new THREE.Vector3(0, 0, -1)).distanceTo(centre)).toBeCloseTo(0, 10);
        // A direction lands half as far from the view centre.
        expect(b.x - centre.x).toBeCloseTo((a.x - centre.x) / 2, 8);
        expect(b.y - centre.y).toBeCloseTo((a.y - centre.y) / 2, 8);
        const identity = wide.projectionMatrix.clone().multiply(wide.projectionMatrixInverse);
        expect(identity.elements.map((v: number) => (Math.round(v * 1e9) / 1e9) || 0))
            .toEqual(new THREE.Matrix4().elements);
        // The live camera is untouched.
        expect(live.projectionMatrix.elements).toEqual(liveCamera().projectionMatrix.elements);
        r.dispose();
    });
    it("follows the live zoom and restores the plain view when cleared", () => {
        const r = new SliderGLRenderer() as any;
        r.update(frame(), SliderConfigurationMode.Stationary, false, true);
        const live = liveCamera();
        const plain = r._getPreviousPerspective(live).projectionMatrix.clone();
        r.updateViewScale(3);
        expect(r._getPreviousPerspective(live).zoom).toBeCloseTo(1.4 / 3, 10);
        live.zoom = 2.8;
        live.updateProjectionMatrix();
        expect(r._getPreviousPerspective(live).zoom).toBeCloseTo(2.8 / 3, 10);
        live.copy(liveCamera());
        r.updateViewScale(1);
        expect(r._getPreviousPerspective(live).projectionMatrix.elements).toEqual(plain.elements);
        r.dispose();
    });
    it("ignores invalid values and deduplicates equal ones", () => {
        const r = new SliderGLRenderer() as any;
        for (const invalid of [undefined, null, NaN, 0, -1, 0.2, 5, Infinity]) {
            r.updateViewScale(invalid);
            expect(r._viewScale).toBe(1);
        }
        r.updateViewScale(1.5);
        r._needsRender = false;
        r.updateViewScale(1.5);
        expect(r.needsRender).toBe(false);
        r.dispose();
    });
    it("leaves perspective backgrounds and look-around untouched", () => {
        for (const [previousType, viewAligned] of [["perspective", true], ["spherical", false]] as [string, boolean][]) {
            const r = new SliderGLRenderer() as any;
            r.update(frame("perspective", previousType), SliderConfigurationMode.Stationary, false, viewAligned);
            const live = liveCamera();
            const before = r._getPreviousPerspective(live).projectionMatrix.clone();
            r.updateViewScale(2);
            expect(r._getPreviousPerspective(live).projectionMatrix.elements).toEqual(before.elements);
            r.dispose();
        }
    });
    it("propagates configuration changes to the renderer once per distinct value", () => {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        new MockCreator().mockProperty(container, "domContainer", document.createElement("div"));
        spyOn(SliderDOMRenderer.prototype, "render").and.returnValue({} as any);
        spyOn(SliderGLRenderer.prototype, "update");
        const spy = spyOn(SliderGLRenderer.prototype, "updateViewScale").and.callThrough();
        const component = new SliderComponent("slider", container, navigator);
        component.configure({ mode: SliderConfigurationMode.Stationary });
        component.activate();
        (container.renderService.size$ as Subject<any>).next({ width: 1440, height: 900 });
        (navigator.stateService.state$ as Subject<State>).next(State.Traversing);
        (navigator.stateService.currentState$ as Subject<any>).next(frame());
        const initial = spy.calls.count();
        expect(spy.calls.mostRecent().args[0]).toBe(1);
        component.configure({ viewAligned: true, viewScale: 2.5 });
        expect(spy.calls.count()).toBe(initial + 1);
        expect(spy.calls.mostRecent().args[0]).toBe(2.5);
        component.configure({ viewScale: 2.5 });
        expect(spy.calls.count()).toBe(initial + 1);
        component.configure({ viewScale: 1 });
        expect(spy.calls.mostRecent().args[0]).toBe(1);
        component.deactivate();
    });
});
