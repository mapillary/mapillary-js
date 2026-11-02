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
function frame(currentType: string = "spherical", previousType: string = "perspective"): any {
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

describe("Slider opt-in common-world view", () => {
    it("retains the mixed spherical-to-perspective guard by default and with three update arguments", () => {
        const r = new SliderGLRenderer() as any;
        const f = frame();
        r.update(f, SliderConfigurationMode.Stationary);
        expect(r.disabled).toBe(true);
        expect(r._viewAligned).toBe(false);
        r.update(f, SliderConfigurationMode.Stationary, true);
        expect(r.disabled).toBe(true);
        expect(r._viewAligned).toBe(false);
        r.dispose();
    });
    it("enables only the opt-in mixed pair and invalidates when the option changes", () => {
        const r = new SliderGLRenderer() as any;
        const f = frame();
        r.update(f, SliderConfigurationMode.Stationary, false);
        r._needsRender = false;
        r.update(f, SliderConfigurationMode.Stationary, false, true);
        expect(r.disabled).toBe(false);
        expect(r.needsRender).toBe(true);
        expect(r._scene.planesOld.length).toBe(1);
        r._needsRender = false;
        r.update(f, SliderConfigurationMode.Stationary, false, true);
        expect(r.needsRender).toBe(false);
        r.update(f, SliderConfigurationMode.Stationary, false, false);
        expect(r.disabled).toBe(true);
        expect(r._scene.planesOld.length).toBe(0);
        r.dispose();
    });
    it("never bypasses missing-image guards", () => {
        const r = new SliderGLRenderer() as any;
        r._viewAligned = true;
        for (const state of <any[]>[
            { currentImage: null, previousImage: image("p", "perspective", 4, 3) },
            { currentImage: image("c", "spherical", 4, 2), previousImage: null },
            { currentImage: null, previousImage: null },
        ]) {
            r._setDisabled(state);
            expect(r.disabled).toBe(true);
        }
    });
    it("preserves legacy same-type and perspective-to-spherical enabled pairs", () => {
        const r = new SliderGLRenderer() as any;
        for (const [current, previous] of [
            ["spherical", "spherical"], ["perspective", "perspective"], ["perspective", "spherical"],
        ]) {
            r._setDisabled(frame(current, previous).state);
            expect(r.disabled).toBe(false);
        }
    });
    it("copies exact live world direction/up/projection and uses the ordinary background origin", () => {
        const r = new SliderGLRenderer() as any;
        const f = frame();
        r.update(f, SliderConfigurationMode.Stationary, true, true);
        const live = liveCamera();
        const before = live.clone();
        const previous = r._getPreviousPerspective(live);
        expectSameView(previous, live);
        expect(previous.position.toArray()).toEqual(new Camera(f.state.previousTransform).position.toArray());
        expectSameView(live, before);
        expect(live.position.toArray()).toEqual(before.position.toArray());
        expect(r._previousRotation).toBeNull();
        r.dispose();
    });
    it("follows subsequent live rotation, up, off-center projection, FOV and zoom", () => {
        const r = new SliderGLRenderer() as any;
        r.update(frame(), SliderConfigurationMode.Stationary, true, true);
        const live = liveCamera();
        const original = r._getPreviousPerspective(live);
        live.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0.4, 0.1)));
        live.up.set(0, 0, 1);
        live.position.set(50, 30, 20);
        live.fov = 28;
        live.aspect = 2.2;
        live.zoom = 2;
        live.clearViewOffset();
        live.updateProjectionMatrix();
        live.updateMatrix();
        live.updateMatrixWorld(true);
        const previous = r._getPreviousPerspective(live);
        expect(previous).toBe(original);
        expectSameView(previous, live);
        expect(previous.position.toArray()).toEqual(r._previousCamera.position.toArray());
        r.dispose();
    });
    it("does not level or replace the original foreground camera for opt-in rendering", () => {
        const r = new SliderGLRenderer() as any;
        r._viewAligned = true;
        r._currentGravityAligned = true;
        const live = liveCamera();
        expect(r._getCurrentPerspective(live)).toBe(live);
    });
    it("renders sceneOld with common rays, then the original foreground source camera", () => {
        const r = new SliderGLRenderer() as any;
        r.update(frame(), SliderConfigurationMode.Stationary, false, true);
        const live = liveCamera();
        const render = jasmine.createSpy("render");
        r.render(live, { render });
        const calls = render.calls.allArgs();
        expect(calls[0][0]).toBe(r._scene.sceneOld);
        expectSameView(calls[0][1], live);
        expect(calls[1]).toEqual([r._scene.scene, live]);
        r.dispose();
    });
    it("keeps an allowed panorama's background camera on the recentered current origin", () => {
        const r = new SliderGLRenderer() as any;
        r.update(frame("spherical", "spherical"), SliderConfigurationMode.Stationary, false, true);
        const live = liveCamera();
        expect(r._getPreviousPerspective(live).position.toArray()).toEqual(live.position.toArray());
        live.position.set(7, 8, 9);
        expect(r._getPreviousPerspective(live).position.toArray()).toEqual([7, 8, 9]);
        expectSameView(r._getPreviousPerspective(live), live);
        r.dispose();
    });
    it("uses the previous transform origin rather than a reconstructed previous camera position", () => {
        const r = new SliderGLRenderer() as any;
        const f = frame();
        f.state.previousCamera.position.set(999, 888, 777);
        r.update(f, SliderConfigurationMode.Stationary, false, true);
        expect(r._getPreviousPerspective(liveCamera()).position.toArray()).toEqual(
            new Camera(f.state.previousTransform).position.toArray());
        r.dispose();
    });
    for (const cameraType of ["perspective", "fisheye", "spherical"]) {
        it(`preserves the ${cameraType} lens and background geometry without stationary reconstruction or stretching`, () => {
            const r = new SliderGLRenderer() as any;
            const f = frame("spherical", cameraType);
            const old = f.state.previousImage;
            old.mesh = { vertices: Array(30).fill(1), faces: [0, 1, 2] };
            const meshBefore = old.mesh;
            const create = spyOn(r._factory, "createMesh").and.callThrough();
            r.update(f, SliderConfigurationMode.Stationary, false, true);
            const [meshImage, t, reconstruction] = create.calls.mostRecent().args as any[];
            expect(meshImage.id).toBe(old.id);
            expect(meshImage.camera).toBe(old.camera);
            expect(meshImage.mesh).toBeNull();
            expect(old.mesh).toBe(meshBefore);
            expect(reconstruction).toBe(false);
            expect(t.cameraType).toBe(cameraType);
            expect(t.width).toBe(old.width);
            expect(t.height).toBe(old.height);
            expect(t.orientation).toBe(old.exifOrientation);
            expect(t.basicAspect).toBe(1600 / 1200);
            expect(t._textureScale).toEqual([1, 1]);
            expect(t.focal).toBe(cameraType === "spherical" ? 1 : old.camera.parameters.focal);
            if (cameraType !== "spherical") {
                expect(t.ck1).toBe(old.camera.parameters.k1);
                expect(t.ck2).toBe(old.camera.parameters.k2);
                expect(t.rt.elements).toEqual(f.state.previousTransform.rt.elements);
                const uniforms = r._scene.planesOld[0].mesh.material.uniforms;
                expect(uniforms.focal.value).toBe(old.camera.parameters.focal);
                expect(uniforms.k1.value).toBe(old.camera.parameters.k1);
                expect(uniforms.k2.value).toBe(old.camera.parameters.k2);
            } else {
                const actual = new THREE.Vector3().fromArray(t.unprojectSfM([0, 0], 0));
                const expected = new THREE.Vector3().fromArray(f.state.currentTransform.unprojectSfM([0, 0], 0));
                expect(actual.distanceTo(expected)).toBeCloseTo(0, 10);
            }
            r.dispose();
        });
    }
    it("rebuilds a recentered background when only the foreground image changes", () => {
        const r = new SliderGLRenderer() as any;
        const f = frame("spherical", "spherical");
        const create = spyOn(r._factory, "createMesh").and.callThrough();
        r.update(f, SliderConfigurationMode.Stationary, false, true);
        f.state.currentImage = { ...f.state.currentImage, id: "replacement" };
        f.state.currentTransform = transform(f.state.currentImage, [-30, -40, -50]);
        r.update(f, SliderConfigurationMode.Stationary, false, true);
        expect(create).toHaveBeenCalledTimes(2);
        const t = create.calls.mostRecent().args[1] as any;
        const actual = new THREE.Vector3().fromArray(t.unprojectSfM([0, 0], 0));
        const expected = new THREE.Vector3().fromArray(f.state.currentTransform.unprojectSfM([0, 0], 0));
        expect(actual.distanceTo(expected)).toBeCloseTo(0, 10);
        r.dispose();
    });
});

describe("Slider viewAligned configuration", () => {
    it("defaults to false and propagates explicit true/false alongside gravityAligned", () => {
        const f = componentFixture();
        f.emit(frame());
        expect(f.update.calls.mostRecent().args.slice(1)).toEqual([
            SliderConfigurationMode.Stationary, false, false,
        ]);
        f.component.configure({ gravityAligned: true, viewAligned: true });
        expect(f.update.calls.mostRecent().args.slice(1)).toEqual([
            SliderConfigurationMode.Stationary, true, true,
        ]);
        f.component.configure({ viewAligned: false });
        expect(f.update.calls.mostRecent().args[3]).toBe(false);
        f.component.deactivate();
    });
    it("shows mixed comparisons only when opted in, and responds without a new frame", () => {
        const f = componentFixture();
        f.emit(frame());
        expect(f.dom.calls.mostRecent().args[4]).toBe(false);
        f.component.configure({ viewAligned: true });
        expect(f.dom.calls.mostRecent().args[4]).toBe(true);
        f.component.configure({ viewAligned: false });
        expect(f.dom.calls.mostRecent().args[4]).toBe(false);
        f.component.deactivate();
    });
    it("retains deliberate slider visibility and missing-background guards when opted in", () => {
        const f = componentFixture();
        f.component.configure({ viewAligned: true });
        const missing = frame();
        missing.state.previousImage = null;
        f.emit(missing);
        expect(f.dom.calls.mostRecent().args[4]).toBe(false);
        f.component.configure({ sliderVisible: false });
        f.emit(frame());
        expect(f.dom.calls.mostRecent().args[4]).toBe(false);
        f.component.deactivate();
    });
    it("projects the previous tile ROI with common live rays and its own lens, without mutating the live view", () => {
        const f = componentFixture();
        const live = liveCamera();
        const t = frame().state.previousTransform;
        const roi = { bbox: { minX: 0.1, maxX: 0.7, minY: 0.2, maxY: 0.8 }, pixelWidth: 0.001, pixelHeight: 0.002 };
        const compute = spyOn((f.component as any)._roiCalculator, "computeRegionOfInterest").and.returnValue(roi);
        const before = live.clone();
        const size = { width: 1440, height: 900 };
        expect((f.component as any)._getViewAlignedRegionOfInterest({ perspective: live }, size, t)).toBe(roi);
        const [background, usedSize, usedTransform] = compute.calls.mostRecent().args as any[];
        expect(usedSize).toBe(size);
        expect(usedTransform).toBe(t);
        expectSameView(background.perspective, live);
        expect(background.perspective.position.toArray()).toEqual(t.unprojectSfM([0, 0], 0));
        expectSameView(live, before);
        expect(live.position.toArray()).toEqual(before.position.toArray());
        f.component.deactivate();
    });
});
