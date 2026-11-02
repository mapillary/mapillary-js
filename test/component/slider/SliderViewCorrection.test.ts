import * as THREE from "three";
import { Subject } from "rxjs";
import { SliderConfigurationMode } from "../../../src/component/interfaces/SliderConfiguration";
import { SliderComponent } from "../../../src/component/slider/SliderComponent";
import { SliderDOMRenderer } from "../../../src/component/slider/SliderDOMRenderer";
import { SliderGLRenderer } from "../../../src/component/slider/SliderGLRenderer";
import { SliderTransform } from "../../../src/component/slider/SliderTransform";
import { Camera } from "../../../src/geo/Camera";
import { Image } from "../../../src/graph/Image";
import { State } from "../../../src/state/State";
import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";
import { MockCreator } from "../../helper/MockCreator";

function image(id: string, cameraType: string, width: number, height: number): any {
    return {
        id, cameraType, width, height, scale: 1, exifOrientation: 1,
        rotation: id === "current" ? [Math.PI / 2, 0, 0] : [0.1, 0.2, 0.3],
        camera: { type: cameraType, parameters: { focal: 0.62, k1: 0.02, k2: -0.005 } },
        mesh: { vertices: [], faces: [] }, image: document.createElement("img"),
    };
}
function transform(i: any, translation: number[]): any {
    return new SliderTransform(i.exifOrientation, i.width, i.height, i.scale,
        i.rotation, translation, i.image, undefined,
        Object.values(i.camera.parameters) as number[], i.cameraType);
}
function frame(currentType = "spherical", previousType = "perspective"): any {
    const currentImage = image("current", currentType, 4000, 2000);
    const previousImage = image("previous", previousType, 1200, 1600);
    previousImage.exifOrientation = 6;
    const currentTransform = transform(currentImage, [-2, -3, -4]);
    const previousTransform = transform(previousImage, [-20, -10, -4]);
    return { id: 7, state: {
        currentImage, previousImage, currentTransform, previousTransform,
        previousCamera: new Camera(previousTransform), motionless: false,
    } };
}
function liveCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(43, 1.7, 0.2, 2000);
    camera.position.set(2, 3, 4);
    camera.up.set(0.2, 0.4, 0.8).normalize();
    camera.lookAt(3, 5, 4.5);
    camera.zoom = 1.4;
    camera.setViewOffset(2000, 1400, 100, 80, 1800, 1200);
    camera.updateMatrixWorld(true);
    camera.matrixAutoUpdate = false;
    return camera;
}
function expectSameView(actual: THREE.PerspectiveCamera, expected: THREE.PerspectiveCamera): void {
    expect(actual.quaternion.toArray()).toEqual(expected.quaternion.toArray());
    expect(actual.up.toArray()).toEqual(expected.up.toArray());
    expect(actual.getWorldDirection(new THREE.Vector3()).distanceTo(
        expected.getWorldDirection(new THREE.Vector3()))).toBeCloseTo(0, 10);
    expect(actual.projectionMatrix.elements).toEqual(expected.projectionMatrix.elements);
    expect(actual.projectionMatrixInverse.elements).toEqual(expected.projectionMatrixInverse.elements);
    expect(actual.fov).toBe(expected.fov);
    expect(actual.aspect).toBe(expected.aspect);
    expect(actual.zoom).toBe(expected.zoom);
    expect(actual.view).toEqual(expected.view);
}
function componentFixture(): any {
    const container = new ContainerMockCreator().create();
    const navigator = new NavigatorMockCreator().create();
    new MockCreator().mockProperty(container, "domContainer", document.createElement("div"));
    const dom = spyOn(SliderDOMRenderer.prototype, "render").and.returnValue({} as any);
    const update = spyOn(SliderGLRenderer.prototype, "update");
    const component = new SliderComponent("slider", container, navigator);
    component.configure({ mode: SliderConfigurationMode.Stationary });
    component.activate();
    (container.renderService.size$ as Subject<any>).next({ width: 1440, height: 900 });
    (navigator.stateService.state$ as Subject<State>).next(State.Traversing);
    const emit = (f: any) => (navigator.stateService.currentState$ as Subject<any>).next(f);
    return { component, container, navigator, dom, update, emit };
}

describe("Slider view-aligned image-based correction", () => {
    const yaw = (degrees: number) => new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1), degrees * Math.PI / 180);
    it("rotates the stationary background camera by the inverse world correction", () => {
        const r = new SliderGLRenderer() as any;
        r.update(frame(), SliderConfigurationMode.Stationary, false, true);
        const live = liveCamera();
        const uncorrected = r._getPreviousPerspective(live).quaternion.clone();
        r._needsRender = false;
        const correction = yaw(3);
        r.updateViewCorrection(correction.toArray());
        expect(r.needsRender).toBe(true);
        const corrected = r._getPreviousPerspective(live);
        const expected = correction.clone().invert().multiply(live.quaternion);
        expect(corrected.quaternion.angleTo(expected)).toBeCloseTo(0, 10);
        // The live foreground camera and the background origin are untouched.
        expect(corrected.position.toArray()).toEqual(r._previousCamera.position.toArray());
        expect(corrected.projectionMatrix.elements).toEqual(live.projectionMatrix.elements);
        expect(corrected.quaternion.angleTo(uncorrected)).toBeGreaterThan(0.01);
        r.dispose();
    });
    it("maps a corrected background ray onto the live ray", () => {
        const r = new SliderGLRenderer() as any;
        r.update(frame(), SliderConfigurationMode.Stationary, false, true);
        const live = liveCamera();
        const correction = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.03, -0.02, 0.05));
        r.updateViewCorrection(correction.toArray());
        const previous = r._getPreviousPerspective(live);
        const liveRay = new THREE.Vector3(0.1, -0.2, -1).normalize().applyQuaternion(live.quaternion);
        const backgroundRay = new THREE.Vector3(0.1, -0.2, -1).normalize().applyQuaternion(previous.quaternion);
        expect(backgroundRay.clone().applyQuaternion(correction).distanceTo(liveRay)).toBeCloseTo(0, 10);
        r.dispose();
    });
    it("ignores invalid values, deduplicates equal ones and restores the default when cleared", () => {
        const r = new SliderGLRenderer() as any;
        r.update(frame(), SliderConfigurationMode.Stationary, false, true);
        const live = liveCamera();
        const original = r._getPreviousPerspective(live).quaternion.clone();
        for (const invalid of [undefined, null, [], [0, 0, 0], [NaN, 0, 0, 1], [0, 0, 0, 0]]) {
            r.updateViewCorrection(invalid);
            expect(r._viewCorrection).toBeNull();
        }
        r.updateViewCorrection(yaw(2).toArray());
        r._needsRender = false;
        r.updateViewCorrection(yaw(2).toArray());
        expect(r.needsRender).toBe(false);
        r.updateViewCorrection(null);
        expect(r.needsRender).toBe(true);
        expect(r._getPreviousPerspective(live).quaternion.angleTo(original)).toBeCloseTo(0, 10);
        r.dispose();
    });
    it("does not alter motion rendering", () => {
        const r = new SliderGLRenderer() as any;
        r.update(frame("perspective", "perspective"), SliderConfigurationMode.Motion, false, true);
        const live = liveCamera();
        const before = r._getPreviousPerspective(live).matrix.clone();
        r.updateViewCorrection(yaw(4).toArray());
        expect(r._getPreviousPerspective(live).matrix.elements).toEqual(before.elements);
        r.dispose();
    });
    it("propagates configuration changes to the renderer once per distinct value", () => {
        const spy = spyOn(SliderGLRenderer.prototype, "updateViewCorrection").and.callThrough();
        const f = componentFixture();
        f.emit(frame());
        const initial = spy.calls.count();
        expect(spy.calls.mostRecent().args[0]).toBeNull();
        f.component.configure({ viewAligned: true, viewCorrection: [0, 0, 0.02, 0.9998] });
        expect(spy.calls.count()).toBe(initial + 1);
        expect(spy.calls.mostRecent().args[0]).toEqual([0, 0, 0.02, 0.9998]);
        f.component.configure({ viewCorrection: [0, 0, 0.02, 0.9998] });
        expect(spy.calls.count()).toBe(initial + 1);
        f.component.configure({ viewCorrection: null });
        expect(spy.calls.mostRecent().args[0]).toBeNull();
        f.component.deactivate();
    });
});
