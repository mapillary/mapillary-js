import * as THREE from "three";
import { Subject } from "rxjs";
import { SliderAutomaticMotion, translatedSliderPerspective } from "../../../src/component/slider/SliderAutomaticMotion";
import { SliderConfigurationMode as Mode } from "../../../src/component/interfaces/SliderConfiguration";
import { SliderTransform } from "../../../src/component/slider/SliderTransform";
import { SliderMeshFactory } from "../../../src/component/slider/SliderMeshFactory";
import { SliderGLRenderer } from "../../../src/component/slider/SliderGLRenderer";
import { SliderComponent } from "../../../src/component/slider/SliderComponent";
import { SliderDOMRenderer } from "../../../src/component/slider/SliderDOMRenderer";
import { Camera } from "../../../src/geo/Camera";
import { State } from "../../../src/state/State";
import { TextureProvider } from "../../../src/tile/TextureProvider";
import { ContainerMockCreator } from "../../helper/ContainerMockCreator";
import { NavigatorMockCreator } from "../../helper/NavigatorMockCreator";
import { MockCreator } from "../../helper/MockCreator";

function image(id: string): any {
    return { id, merged: true, mergeId: "shared-merge", cameraType: "perspective", width: 1600, height: 1200,
        scale: 1, exifOrientation: 1, rotation: [0, 0, 0], clusterId: "cluster",
        camera: { type: "perspective", parameters: { focal: 0.8, k1: 0, k2: 0 } },
        image: document.createElement("img"),
        mesh: { vertices: [-10, -10, 20, 10, -10, 20, 10, 10, 20, -10, 10, 20, 0, 0, 20],
            faces: [0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4] } };
}
function transform(i: any, origin: number): SliderTransform {
    return new SliderTransform(i.exifOrientation, i.width, i.height, i.scale,
        i.rotation, [-origin, 0, 0], i.image, undefined, Object.values(i.camera.parameters), i.cameraType);
}
function fixture(): any {
    const previousImage = image("previous");
    const currentImage = image("current");
    const previousTransform = transform(previousImage, 0);
    const currentTransform = transform(currentImage, 2);
    const state = { previousImage, currentImage, previousTransform, currentTransform,
        previousCamera: new Camera(previousTransform as any), motionless: false, trajectory: [previousImage, currentImage] };
    const camera = new THREE.PerspectiveCamera(20, 4 / 3, 0.1, 1000);
    camera.position.set(2, 0, 0);
    camera.up.set(0, -1, 0);
    camera.lookAt(2, 0, 20);
    camera.updateMatrixWorld(true);
    camera.matrixAutoUpdate = false;
    return { state, camera, frame: { id: 3, state },
        configuration: { automaticMotion: true, viewAligned: true, mode: Mode.Motion,
            ids: { foreground: "current", background: "previous" } },
        size: { width: 1200, height: 900 } };
}
function resolve(s: SliderAutomaticMotion, f: any): Mode {
    return s.resolve(f.configuration, f.state, f.camera, f.size, "current");
}
function sameView(a: THREE.PerspectiveCamera, b: THREE.PerspectiveCamera): void {
    expect(a.quaternion.toArray()).toEqual(b.quaternion.toArray());
    expect(a.up.toArray()).toEqual(b.up.toArray());
    expect(a.projectionMatrix.elements).toEqual(b.projectionMatrix.elements);
    expect(a.projectionMatrixInverse.elements).toEqual(b.projectionMatrixInverse.elements);
    expect(a.view).toEqual(b.view);
    expect(a.zoom).toBe(b.zoom);
    expect(a.getWorldDirection(new THREE.Vector3()).distanceTo(b.getWorldDirection(new THREE.Vector3()))).toBeCloseTo(0, 12);
}

describe("Slider automatic motion safety", () => {
    it("enables a hydrated synthetic perspective pair with real meshes", () => {
        const s = new SliderAutomaticMotion();
        expect(resolve(s, fixture())).toBe(Mode.Motion);
        s.dispose();
    });
    const invalid: { [name: string]: (f: any) => void } = {
        unmerged: f => { f.state.previousImage.merged = false; },
        "different merged components despite same cluster/close pose": f => { f.state.currentImage.mergeId = "unrelated-merge"; },
        "missing previous merge ID": f => { delete f.state.previousImage.mergeId; },
        "missing current merge ID": f => { f.state.currentImage.mergeId = null; },
        "both merge IDs missing": f => { delete f.state.previousImage.mergeId; delete f.state.currentImage.mergeId; },
        "both merge IDs empty": f => { f.state.previousImage.mergeId = f.state.currentImage.mergeId = ""; },
        "both merge IDs blank": f => { f.state.previousImage.mergeId = f.state.currentImage.mergeId = "  "; },
        "invalid numeric merge IDs": f => { f.state.previousImage.mergeId = f.state.currentImage.mergeId = 123; },
        "missing mesh": f => { f.state.currentImage.mesh = null; },
        "malformed mesh": f => { f.state.currentImage.mesh = {}; },
        "default cube": f => { f.state.currentImage.mesh = { vertices: Array(24).fill(1), faces: Array(36).fill(0) }; },
        "invalid scale": f => { f.state.currentImage.scale = NaN; },
        "infinite transform scale": f => { f.state.currentTransform = transform({ ...f.state.currentImage, scale: Infinity }, 2); },
        "zero scale": f => { f.state.currentImage.scale = 0; },
        "mixed pair": f => { f.state.currentImage.cameraType = "spherical"; },
        spherical: f => { f.state.currentImage.cameraType = f.state.previousImage.cameraType = "spherical"; },
        fisheye: f => { f.state.previousImage.cameraType = "fisheye"; },
        motionless: f => { f.state.motionless = true; },
        "bad up": f => { f.state.previousImage.rotation = [0, 0, Math.PI / 4]; },
        "invalid rotation": f => { f.state.previousImage.rotation = [NaN, 0, 0]; },
        "invalid lens": f => { f.state.previousImage.camera.parameters.k1 = Infinity; },
        "invalid dimensions": f => { f.state.previousImage.height = Infinity; },
        "missing image": f => { f.state.previousImage = null; },
        "missing transform": f => { f.state.previousTransform = null; },
        "stale selected pair": f => { f.configuration.ids.foreground = "new"; },
        "missing selected ids": f => { f.configuration.ids = null; },
        "invalid projection": f => { f.camera.projectionMatrix.elements[0] = NaN; },
        "singular projection": f => { f.camera.projectionMatrix.elements.fill(0); },
        "nonfinite near": f => { f.camera.near = NaN; },
        "nonfinite far": f => { f.camera.far = Infinity; },
        "invalid clip range": f => { f.camera.far = f.camera.near; },
        "invalid viewport": f => { f.size.width = 0; },
        "invalid faces": f => { f.state.previousImage.mesh.faces[0] = 65536; },
        "negative depth": f => { f.state.previousImage.mesh.vertices[2] = -1; },
        "nonfinite mesh": f => { f.state.previousImage.mesh.vertices[0] = Infinity; },
        "over vertex budget": f => { f.state.previousImage.mesh.vertices = Array(3 * 65536).fill(1); },
        "over triangle budget": f => { f.state.previousImage.mesh.faces = Array(30003).fill(0); },
        "baseline over 2m even in same cluster/component": f => { f.state.currentTransform = transform(f.state.currentImage, 2.01); },
        "far same-cluster pose": f => { f.state.currentTransform = transform(f.state.currentImage, 51); },
        "far unrelated pose": f => { f.state.currentTransform = transform(f.state.currentImage, 21); f.state.currentImage.clusterId = "other"; },
        "nonfinite camera origin": f => { f.state.currentTransform.rt.elements[12] = Infinity; },
        "no shared photo coverage": f => { f.camera.lookAt(20, 0, 2); f.camera.updateMatrix(); f.camera.updateMatrixWorld(true); },
        "no mesh coverage": f => { f.state.previousImage.mesh.faces = [0, 0, 0]; },
    };
    for (const name of Object.keys(invalid)) {
        it(`fails closed without throwing for ${name}, including repeated requests`, () => {
            const f = fixture(); const s = new SliderAutomaticMotion();
            invalid[name](f);
            expect(resolve(s, f)).toBe(Mode.Stationary);
            expect(resolve(s, f)).toBe(Mode.Stationary);
            s.dispose();
        });
    }
    describe("relaxed policy", () => {
        function relaxed(): any {
            const f = fixture();
            f.configuration.automaticMotionPolicy = "relaxed";
            const wide = (i: any) => { i.mesh.vertices = i.mesh.vertices.map((v: number, n: number) => n % 3 === 2 ? v : 3 * v); };
            wide(f.state.previousImage); wide(f.state.currentImage);
            return f;
        }
        it("accepts different merged reconstructions that strict rejects", () => {
            const f = relaxed(); const s = new SliderAutomaticMotion();
            f.state.previousImage.mergeId = "1278340129";
            f.state.currentImage.mergeId = "1085082133386200";
            expect(resolve(s, f)).toBe(Mode.Motion);
            f.configuration.automaticMotionPolicy = "strict";
            expect(resolve(s, f)).toBe(Mode.Stationary);
            f.configuration.automaticMotionPolicy = "relaxed";
            expect(resolve(s, f)).toBe(Mode.Motion);
            s.dispose();
        });
        it("accepts baselines up to the 12m Time Travel radius and rejects beyond", () => {
            const f = relaxed(); const s = new SliderAutomaticMotion();
            f.state.currentImage.mergeId = "other-merge";
            // A distant facade keeps both photos overlapping across 12m.
            const far = (i: any) => { i.mesh.vertices = i.mesh.vertices.map((v: number) => 3 * v); };
            far(f.state.previousImage); far(f.state.currentImage);
            for (const baseline of [2.01, 5, 7, 12]) {
                f.state.currentTransform = transform(f.state.currentImage, baseline);
                expect(resolve(s, f)).toBe(Mode.Motion);
            }
            f.state.currentTransform = transform(f.state.currentImage, 12.01);
            expect(resolve(s, f)).toBe(Mode.Stationary);
            s.dispose();
        });
        it("still fails closed without meshes, merged poses, perspective cameras or coverage", () => {
            const cases: Array<(f: any) => void> = [
                f => { f.state.previousImage.merged = false; },
                f => { f.state.currentImage.mesh = null; },
                f => { f.state.currentImage.cameraType = "spherical"; },
                f => { f.state.previousImage.mesh.faces = [0, 0, 0]; },
                f => { f.camera.lookAt(20, 0, 2); f.camera.updateMatrix(); f.camera.updateMatrixWorld(true); },
            ];
            for (const apply of cases) {
                const f = relaxed(); const s = new SliderAutomaticMotion();
                apply(f);
                expect(resolve(s, f)).toBe(Mode.Stationary);
                s.dispose();
            }
        });
        it("rejects reconstructions that disagree on surface depth (e.g. a garage under a street)", () => {
            const f = relaxed(); const s = new SliderAutomaticMotion();
            f.state.currentImage.mergeId = "other-merge";
            expect(resolve(s, f)).toBe(Mode.Motion);
            f.state.currentImage.mesh = { ...f.state.currentImage.mesh,
                vertices: f.state.currentImage.mesh.vertices.map((v: number, n: number) => n % 3 === 2 ? 50 : 2.5 * v) };
            expect(resolve(s, f)).toBe(Mode.Stationary);
            s.dispose();
        });
        it("keeps explicit Stationary as manual 2D", () => {
            const f = relaxed(); const s = new SliderAutomaticMotion();
            f.configuration.mode = Mode.Stationary;
            expect(resolve(s, f)).toBe(Mode.Stationary);
            s.dispose();
        });
    });
    it("permits covered small baselines but rejects 7m even with the same cluster and merge component", () => {
        const f = fixture(); const s = new SliderAutomaticMotion();
        for (const baseline of [0, 0.5, 1, 2]) {
            f.state.currentTransform = transform(f.state.currentImage, baseline);
            expect(resolve(s, f)).toBe(Mode.Motion);
        }
        f.state.currentTransform = transform(f.state.currentImage, 7);
        expect(resolve(s, f)).toBe(Mode.Stationary);
        s.dispose();
    });
    it("rejects excessive reprojection parallax at a surface hit even when all photo bounds pass", () => {
        const f = fixture(); const s = new SliderAutomaticMotion() as any;
        f.camera.fov = 5; f.camera.aspect = 1; f.camera.updateProjectionMatrix();
        // A near foreground plane has ample shared photo/mesh coverage but
        // >10-degree reprojection from its native origin at the other endpoint.
        f.state.currentImage.mesh.vertices = f.state.currentImage.mesh.vertices.map((v: number, n: number) => n % 3 === 2 ? 5 : v);
        const photo = spyOn(s, "_insidePhoto").and.callThrough();
        expect(resolve(s, f)).toBe(Mode.Stationary);
        expect(photo.calls.count()).toBeGreaterThan(0);
        photo.calls.allArgs().forEach(args => expect(s._insidePhoto(args[0], args[1])).toBe(true));
        s.dispose();
    });
    it("rejects unrelated merge frames before raycasting and revalidates when shared merge IDs change in place", () => {
        const f = fixture(); const s = new SliderAutomaticMotion() as any;
        const covered = spyOn(s, "_covered").and.callThrough();
        // Coverage can be ample for overlapping GPS frames while reconstruction
        // components are unrelated. Same cluster/close pose is NOT an override.
        f.state.previousImage.mergeId = "1278340129";
        f.state.currentImage.mergeId = "1085082133386200";
        expect(resolve(s, f)).toBe(Mode.Stationary);
        expect(covered).not.toHaveBeenCalled();
        f.state.currentImage.mergeId = f.state.previousImage.mergeId;
        expect(resolve(s, f)).toBe(Mode.Motion);
        expect(covered.calls.count()).toBe(1);
        f.state.previousImage.mergeId = f.state.currentImage.mergeId = "another-shared-frame";
        expect(resolve(s, f)).toBe(Mode.Motion);
        expect(covered.calls.count()).toBe(2);
        f.state.currentImage.mergeId = "unrelated-again";
        expect(resolve(s, f)).toBe(Mode.Stationary);
        s.dispose();
    });
    it("rejects missing live camera and mismatched rendered image", () => {
        const f = fixture(); const s = new SliderAutomaticMotion();
        expect(s.resolve(f.configuration, f.state, null, f.size, "current")).toBe(Mode.Stationary);
        expect(s.resolve(f.configuration, f.state, f.camera, f.size, "old")).toBe(Mode.Stationary);
    });
    it("checks endpoints AND seven intermediate stops using both meshes", () => {
        const f = fixture(); const s = new SliderAutomaticMotion();
        const rays = spyOn(THREE.Raycaster.prototype, "setFromCamera").and.callThrough();
        const photo = spyOn(s as any, "_insidePhoto").and.callThrough();
        expect(resolve(s, f)).toBe(Mode.Motion);
        const xs = rays.calls.allArgs().map(args => (args[1] as THREE.PerspectiveCamera).position.x);
        expect(Array.from(new Set(xs))).toEqual([0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
        expect(rays.calls.count()).toBe(9 * 49);
        expect(photo.calls.count()).toBe(9 * 49 * 2 * 2);
        s.dispose();
    });
    it("rejects an interior-only hole even when endpoint sampled rays are covered", () => {
        const f = fixture(); const s = new SliderAutomaticMotion() as any;
        f.state.currentTransform = transform(f.state.currentImage, 2);
        f.camera.fov = 5; f.camera.aspect = 1; f.camera.updateProjectionMatrix();
        const mesh = { vertices: Array(12).fill(1), faces: [] as number[] };
        // Four rectangles surround a narrow hole at world x=1,y=0,z=20.
        for (const [x0, x1, y0, y1] of [[-10, 0.95, -10, 10], [1.05, 10, -10, 10],
            [0.95, 1.05, -10, -0.05], [0.95, 1.05, 0.05, 10]]) {
            const n = mesh.vertices.length / 3;
            mesh.vertices.push(x0, y0, 20, x1, y0, 20, x1, y1, 20, x0, y1, 20);
            mesh.faces.push(n, n + 1, n + 2, n, n + 2, n + 3);
        }
        f.state.previousImage.mesh = mesh;
        expect(s._prepare(f.state)).toBe(true);
        const original = THREE.Raycaster.prototype.setFromCamera;
        const rays = spyOn(THREE.Raycaster.prototype, "setFromCamera").and.callFake(function(coords: any, camera: any): void {
            // First run deliberately examines endpoints only.
            const endpoint = camera.clone(); endpoint.position.x = camera.position.x < 1 ? 0 : 2;
            endpoint.updateMatrix(); endpoint.updateMatrixWorld(true);
            original.call(this, coords, endpoint);
        });
        expect(s._covered(f.camera)).toBe(true);
        rays.and.callThrough();
        expect(s._covered(f.camera)).toBe(false);
        s.dispose();
    });
    it("shares EXACT renderer-clamped reconstruction geometry without textures", () => {
        const f = fixture(); const factory = new SliderMeshFactory();
        f.state.previousImage.mesh.vertices[2] = 1;
        const t = f.state.previousTransform;
        const texture = spyOn(factory as any, "_createTexture").and.callThrough();
        const geometry = factory.createReconstructionGeometry(f.state.previousImage, t);
        expect(texture).not.toHaveBeenCalled();
        const rendered = factory.createMesh(f.state.previousImage, t, true);
        expect(Array.from((geometry.getAttribute("position") as THREE.BufferAttribute).array)).toEqual(
            Array.from((rendered.geometry.getAttribute("position") as THREE.BufferAttribute).array));
        geometry.dispose(); rendered.geometry.dispose(); (rendered.material as THREE.Material).dispose();
    });
    it("reuses coverage for manual 2D/3D, bounds cache and invalidates pair/lens/viewport", () => {
        const f = fixture(); const s = new SliderAutomaticMotion() as any;
        const covered = spyOn(s, "_covered").and.callThrough();
        expect(resolve(s, f)).toBe(Mode.Motion);
        f.configuration.mode = Mode.Stationary;
        expect(resolve(s, f)).toBe(Mode.Stationary);
        f.configuration.mode = Mode.Motion;
        expect(resolve(s, f)).toBe(Mode.Motion);
        expect(covered.calls.count()).toBe(1);
        f.camera.zoom = 1.1; f.camera.updateProjectionMatrix(); resolve(s, f);
        f.size.width++; resolve(s, f);
        expect(covered.calls.count()).toBe(3);
        f.state.currentImage.camera.parameters.focal = 0.85; resolve(s, f);
        expect(covered.calls.count()).toBe(4);
        for (let n = 0; n < 10; n++) { f.size.width++; resolve(s, f); }
        expect(s._coverage.size).toBe(8);
        f.state.currentImage.mesh = { vertices: [], faces: [] };
        expect(resolve(s, f)).toBe(Mode.Stationary);
        s.dispose();
    });
    it("does not affect default or non-viewAligned modes", () => {
        const f = fixture(); const s = new SliderAutomaticMotion();
        f.configuration.automaticMotion = false; f.state.previousImage = null;
        expect(resolve(s, f)).toBe(Mode.Motion);
        f.configuration.automaticMotion = true; f.configuration.viewAligned = false;
        expect(resolve(s, f)).toBe(Mode.Motion);
    });
});

describe("Slider automatic rendering", () => {
    it("translates actual frozen world matrices even when live position and matrixWorld disagree", () => {
        const f = fixture();
        const worldBefore = f.camera.matrixWorld.elements.slice();
        f.camera.position.set(123, 45, 67); // Deliberately stale public pose.
        f.camera.matrixAutoUpdate = false;
        (f.camera as any).matrixWorldAutoUpdate = false;
        f.camera.matrixWorldNeedsUpdate = false;
        for (const position of [0, 0.5, 1]) {
            const translated = translatedSliderPerspective(f.camera,
                new THREE.Vector3(0, 0, 0), new THREE.Vector3(2, 0, 0), position);
            const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(), translated);
            expect(translated.position.toArray()).toEqual([2 * position, 0, 0]);
            expect(ray.ray.origin.toArray()).toEqual([2 * position, 0, 0]);
            expect(translated.position.clone().applyMatrix4(translated.matrixWorldInverse).length()).toBeCloseTo(0, 12);
            sameView(translated, f.camera);
        }
        expect(f.camera.position.toArray()).toEqual([123, 45, 67]);
        expect(f.camera.matrixWorld.elements).toEqual(worldBefore);
    });
    it("rebuilds same-object calibration/rotation/RT geometry and origins while safety still permits Motion", () => {
        const f = fixture(); const safety = new SliderAutomaticMotion(); const r = new SliderGLRenderer() as any;
        expect(resolve(safety, f)).toBe(Mode.Motion);
        r.update(f.frame, Mode.Motion, false, true, true);
        let mesh = r._scene.planes[0].mesh;
        f.state.currentImage.camera.parameters.focal = 0.85;
        expect(resolve(safety, f)).toBe(Mode.Motion);
        r.update(f.frame, Mode.Motion, false, true, true);
        expect(r._scene.planes[0].mesh).not.toBe(mesh);
        expect(r._scene.planes[0].mesh.material.uniforms.focal.value).toBe(0.85);
        mesh = r._scene.planes[0].mesh;
        const points = Array.from(mesh.geometry.getAttribute("position").array);
        f.state.currentImage.rotation[2] = 0.01;
        expect(resolve(safety, f)).toBe(Mode.Motion);
        r.update(f.frame, Mode.Motion, false, true, true);
        expect(r._scene.planes[0].mesh).not.toBe(mesh);
        expect(Array.from(r._scene.planes[0].mesh.geometry.getAttribute("position").array)).not.toEqual(points);
        mesh = r._scene.planes[0].mesh;
        // Mutate RT itself without updating Transform's cached inverse.
        f.state.currentTransform.rt.elements[12] = -1.5;
        expect(resolve(safety, f)).toBe(Mode.Motion);
        r.update(f.frame, Mode.Motion, false, true, true);
        expect(r._scene.planes[0].mesh).not.toBe(mesh);
        expect(r._motionOrigins[1].toArray()).toEqual([1.5, 0, 0]);
        r.updateCurtain(0.5, true);
        expect(r._getCurrentPerspective(f.camera).position.toArray()).toEqual([0.75, 0, 0]);
        expect(r._getPreviousPerspective(f.camera).position.toArray()).toEqual([0.75, 0, 0]);
        r.dispose(); safety.dispose();
    });
    it("enforces stationary rendering for mixed viewAligned pairs even with direct requested Motion", () => {
        const f = fixture(); const r = new SliderGLRenderer() as any;
        f.state.previousImage.cameraType = f.state.previousImage.camera.type = "spherical";
        f.state.previousTransform = transform(f.state.previousImage, 0);
        r.update(f.frame, Mode.Motion, false, true, false);
        expect(r._mode).toBe(Mode.Stationary);
        expect(r._getCurrentPerspective(f.camera)).toBe(f.camera);
        expect(r._scene.planes[0].mesh.geometry.index.count).toBe(6);
        r.dispose();
    });
    it("uses an immutable shared snapshot despite same-object, same-length provider mesh mutation", () => {
        const f = fixture(); const safety = new SliderAutomaticMotion(); const r = new SliderGLRenderer() as any;
        expect(resolve(safety, f)).toBe(Mode.Motion);
        r.update(f.frame, Mode.Motion, false, true, true);
        const before = Array.from(r._scene.planes[0].mesh.geometry.getAttribute("position").array);
        f.state.currentImage.mesh.vertices.fill(NaN);
        expect(resolve(safety, f)).toBe(Mode.Motion);
        r.update(f.frame, Mode.Stationary, false, true, true);
        r.update(f.frame, Mode.Motion, false, true, true);
        expect(Array.from(r._scene.planes[0].mesh.geometry.getAttribute("position").array)).toEqual(before);
        // A new object is a new version and must be rejected/revalidated.
        f.state.currentImage.mesh = { vertices: f.state.currentImage.mesh.vertices.slice(), faces: f.state.currentImage.mesh.faces.slice() };
        expect(resolve(safety, f)).toBe(Mode.Stationary);
        r.dispose(); safety.dispose();
    });
    for (const automatic of [false, true]) {
    it(`retains same-id high-res providers/textures across repeated mode rebuilds (automatic=${automatic})`, () => {
        const f = fixture(); const r = new SliderGLRenderer() as any;
        r.update(f.frame, Mode.Stationary, false, true, automatic);
        const providers = ["current", "previous"].map(id => ({ id, textureCreated$: new Subject<THREE.Texture>(),
            textureUpdated$: new Subject<boolean>(), dispose: jasmine.createSpy("dispose") }));
        const textures = [new THREE.Texture(), new THREE.Texture()];
        const disposers = textures.map(t => spyOn(t, "dispose").and.callThrough());
        r.setTextureProvider("current", providers[0]); r.setTextureProviderPrev("previous", providers[1]);
        providers.forEach((p, n) => p.textureCreated$.next(textures[n]));
        for (const mode of [Mode.Motion, Mode.Stationary, Mode.Motion, Mode.Stationary]) {
            r.update(f.frame, mode, false, true, automatic);
            expect(r._scene.planes[0].mesh.material.uniforms.projectorTex.value).toBe(textures[0]);
            expect(r._scene.planesOld[0].mesh.material.uniforms.projectorTex.value).toBe(textures[1]);
            providers.forEach(p => expect(p.dispose).not.toHaveBeenCalled());
            disposers.forEach(d => expect(d).not.toHaveBeenCalled());
        }
        const previousImage = f.state.previousImage, previousTransform = f.state.previousTransform;
        f.state.previousImage = null; f.state.previousTransform = null;
        r.update(f.frame, Mode.Motion, false, true, automatic);
        expect(r.disabled).toBe(true);
        providers.forEach(p => expect(p.dispose).not.toHaveBeenCalled());
        disposers.forEach(d => expect(d).not.toHaveBeenCalled());
        f.state.previousImage = previousImage; f.state.previousTransform = previousTransform;
        r.update(f.frame, Mode.Motion, false, true, automatic);
        expect(r.disabled).toBe(false);
        expect(r._scene.planes[0].mesh.material.uniforms.projectorTex.value).toBe(textures[0]);
        expect(r._scene.planesOld[0].mesh.material.uniforms.projectorTex.value).toBe(textures[1]);
        providers.forEach(p => p.textureUpdated$.next(true));
        expect(r.needsRender).toBe(true);
        r.dispose();
        providers.forEach(p => expect(p.dispose).toHaveBeenCalledTimes(1));
        disposers.forEach(d => expect(d).toHaveBeenCalledTimes(1));
    });
    }
    it("handles corrupt opt-in renderer data without throwing", () => {
        const f = fixture(); const r = new SliderGLRenderer();
        f.state.currentImage.camera = null;
        expect(() => r.update(f.frame, Mode.Stationary, false, true, true)).not.toThrow();
        expect(r.disabled).toBe(true); r.dispose();
    });
    it("renders both real meshes from the translated live clone, preserving exact direction/up/projection/crop", () => {
        const f = fixture(); const r = new SliderGLRenderer() as any;
        f.camera.up.set(0.1, -0.9, 0.2).normalize(); f.camera.lookAt(2.5, 0.3, 20);
        f.camera.zoom = 1.4; f.camera.setViewOffset(1400, 1000, 30, 40, 1200, 900);
        f.camera.updateMatrixWorld(true);
        const before = f.camera.clone();
        r.update(f.frame, Mode.Motion, true, true, true);
        expect(r._scene.planes[0].mesh.geometry.index.count).toBe(12);
        expect(r._scene.planesOld[0].mesh.geometry.index.count).toBe(12);
        for (const position of [0, 0.25, 0.5, 0.75, 1]) {
            r.updateCurtain(position, true);
            const render = jasmine.createSpy("render");
            r.render(f.camera, { render });
            const cameras = render.calls.allArgs().map(args => args[1]);
            expect(cameras.length).toBe(2);
            cameras.forEach(camera => {
                expect(camera.position.toArray()).toEqual([2 * position, 0, 0]);
                expect(new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld).toArray()).toEqual([2 * position, 0, 0]);
                expect(camera.position.clone().applyMatrix4(camera.matrixWorldInverse).length()).toBeCloseTo(0, 12);
                const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(), camera);
                expect(ray.ray.origin.toArray()).toEqual([2 * position, 0, 0]);
                sameView(camera, before);
            });
            sameView(f.camera, before);
            expect(f.camera.position.toArray()).toEqual(before.position.toArray());
        }
        r.update(f.frame, Mode.Stationary, true, true, true);
        expect(r._scene.planes[0].mesh.geometry.index.count).toBe(6);
        expect(r._scene.planesOld[0].mesh.geometry.index.count).toBe(6);
        for (const position of [0, 0.5, 1]) {
            r.updateCurtain(position, true);
            expect(r._getCurrentPerspective(f.camera)).toBe(f.camera);
            expect(r._getPreviousPerspective(f.camera).position.toArray()).toEqual([0, 0, 0]);
        }
        r.dispose();
    });
});

describe("Slider view-aligned native mode roundtrip", () => {
    it("preserves projection and direction while translating only Motion render cameras, including repeated 2D returns", () => {
        const f = fixture(); const r = new SliderGLRenderer() as any;
        f.state.previousImage.scale = 1.07;
        f.state.currentImage.scale = 1.025;
        f.state.previousTransform = transform(f.state.previousImage, -1.3);
        f.state.currentTransform = transform(f.state.currentImage, 2.1);
        f.camera.position.set(2.1, 0, 0);
        f.camera.up.set(0.1, -0.9, 0.2).normalize(); f.camera.lookAt(2.5, 0.3, 20);
        f.camera.zoom = 1.4; f.camera.setViewOffset(1400, 1000, 30, 40, 1200, 900);
        f.camera.updateMatrix(); f.camera.updateMatrixWorld(true);
        const before = f.camera.clone();
        for (const mode of [Mode.Stationary, Mode.Motion, Mode.Stationary, Mode.Motion, Mode.Stationary]) {
            r.update(f.frame, mode, true, true, false);
            for (const position of [0, 0.25, 0.5, 0.75, 1]) {
                r.updateCurtain(position, true);
                const current = r._getCurrentPerspective(f.camera);
                const previous = r._getPreviousPerspective(f.camera);
                sameView(current, before); sameView(previous, before); sameView(f.camera, before);
                expect(f.camera.position.toArray()).toEqual(before.position.toArray());
                const currentX = mode === Mode.Motion ? -1.3 + 3.4 * position : 2.1;
                const previousX = mode === Mode.Motion ? currentX : -1.3;
                [current, previous].forEach((camera, n) => {
                    const x = n === 0 ? currentX : previousX;
                    expect(camera.position.x).toBeCloseTo(x, 12);
                    expect(new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld).x).toBeCloseTo(x, 12);
                    const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(), camera);
                    expect(ray.ray.origin.x).toBeCloseTo(x, 12);
                    expect(camera.position.clone().applyMatrix4(camera.matrixWorldInverse).length()).toBeCloseTo(0, 12);
                });
            }
        }
        r.dispose();
    });
    it("revalidates native same-ID pose and motionless changes instead of retaining stale camera origins", () => {
        const f = fixture(); const r = new SliderGLRenderer() as any;
        r.update(f.frame, Mode.Motion, false, true, false); r.updateCurtain(0.5, true);
        expect(r._getCurrentPerspective(f.camera).position.x).toBeCloseTo(1, 12);
        const first = r._scene.planes[0].mesh;
        f.state.currentTransform.rt.elements[12] = -1.5;
        r.update(f.frame, Mode.Motion, false, true, false);
        expect(r._scene.planes[0].mesh).not.toBe(first);
        expect(r._getCurrentPerspective(f.camera).position.x).toBeCloseTo(0.75, 12);
        expect(r._getPreviousPerspective(f.camera).position.x).toBeCloseTo(0.75, 12);
        f.state.motionless = true;
        r.update(f.frame, Mode.Motion, false, true, false);
        expect(r._mode).toBe(Mode.Stationary);
        expect(r._motionOrigins).toEqual([]);
        expect(r._getCurrentPerspective(f.camera)).toBe(f.camera);
        expect(r._scene.planes[0].mesh.geometry.index.count).toBe(6);
        f.state.motionless = false;
        r.update(f.frame, Mode.Motion, false, true, false);
        expect(r._mode).toBe(Mode.Motion);
        expect(r._getCurrentPerspective(f.camera).position.x).toBeCloseTo(0.75, 12);
        r.dispose();
    });
    for (const automatic of [false, true]) {
    it(`uses fresh previous RT origins on Stationary return and motionless fallback (automatic=${automatic})`, () => {
        const f = fixture(); const r = new SliderGLRenderer() as any;
        r.update(f.frame, Mode.Motion, false, true, automatic); r.updateCurtain(0.5, true);
        // Change RT in place while leaving Transform's cached inverse stale.
        f.state.previousTransform.rt.elements[12] = 1.25;
        r.update(f.frame, Mode.Motion, false, true, automatic);
        expect(r._getCurrentPerspective(f.camera).position.x).toBeCloseTo(0.375, 12);
        const assertStationary = () => {
            const previous = r._getPreviousPerspective(f.camera);
            expect(previous.position.x).toBeCloseTo(-1.25, 12);
            expect(new THREE.Vector3().setFromMatrixPosition(previous.matrixWorld).x).toBeCloseTo(-1.25, 12);
            const component = new SliderComponent("slider", new ContainerMockCreator().create(), new NavigatorMockCreator().create()) as any;
            const compute = spyOn(component._roiCalculator, "computeRegionOfInterest").and.returnValue({});
            component._getViewAlignedRegionOfInterest({ perspective: f.camera }, f.size, f.state.previousTransform);
            const roiCamera = compute.calls.mostRecent().args[0].perspective;
            expect(roiCamera.matrixWorld.elements).toEqual(previous.matrixWorld.elements);
            sameView(roiCamera, previous);
        };
        r.update(f.frame, Mode.Stationary, false, true, automatic); assertStationary();
        r.update(f.frame, Mode.Motion, false, true, automatic);
        f.state.motionless = true;
        r.update(f.frame, Mode.Motion, false, true, automatic); expect(r._mode).toBe(Mode.Stationary); assertStationary();
        r.dispose();
    });
    }
    it("does not kill native view-aligned rendering while the comparison transform is still hydrating", () => {
        const f = fixture(); const r = new SliderGLRenderer() as any;
        const previous = f.state.previousTransform;
        f.state.previousTransform = null;
        f.state.previousImage = null;
        expect(() => r.update(f.frame, Mode.Motion, false, true, false)).not.toThrow();
        expect(r.disabled).toBe(true);
        // The previousCamera can precede previousTransform in the same frame.
        expect(r._previousCamera).not.toBeNull();
        f.state.previousImage = image("previous");
        f.state.previousTransform = previous;
        expect(() => r.update(f.frame, Mode.Motion, false, true, false)).not.toThrow();
        expect(r.disabled).toBe(false);
        expect(r._scene.planesOld.length).toBe(1);
        r.dispose();
    });
    for (const missing of ["currentImage", "previousTransform", "currentTransform"]) {
    it(`survives a missing ${missing} and recovers the same-ID view-aligned pair`, () => {
        const f = fixture(); const r = new SliderGLRenderer() as any;
        r.update(f.frame, Mode.Motion, false, true, false);
        const saved = f.state[missing]; f.state[missing] = null;
        expect(() => r.update(f.frame, Mode.Motion, false, true, false)).not.toThrow();
        expect(r.disabled).toBe(true); expect(r._motionOrigins.length).toBe(0);
        f.state[missing] = saved;
        expect(() => r.update(f.frame, Mode.Motion, false, true, false)).not.toThrow();
        expect(r.disabled).toBe(false); expect(r._scene.planesOld.length).toBe(1);
        r.dispose();
    });
    }
    it("does not translate non-reconstructed/motionless view-aligned fallback cameras", () => {
        const f = fixture(); const r = new SliderGLRenderer() as any;
        f.state.motionless = true;
        r.update(f.frame, Mode.Motion, false, true, false);
        r.updateCurtain(0.25, true);
        expect(r._getCurrentPerspective(f.camera)).toBe(f.camera);
        r.dispose();
    });
});

describe("Slider automatic shared decision and interactive state", () => {
    function componentFixture(): any {
        const container = new ContainerMockCreator().create();
        const navigator = new NavigatorMockCreator().create();
        new MockCreator().mockProperty(container, "domContainer", document.createElement("div"));
        const dom = spyOn(SliderDOMRenderer.prototype, "render").and.returnValue({} as any);
        const update = spyOn(SliderGLRenderer.prototype, "update");
        const component = new SliderComponent("slider", container, navigator);
        const f = fixture();
        // Avoid initiating mock graph loads; ids are installed with configure
        // before activation and the graph cache returns an empty stream.
        spyOn((component as any), "_catchCacheImage$").and.returnValue(new Subject());
        component.configure({ ...f.configuration, initialPosition: 0.5, screenSpace: true });
        component.activate();
        (container.renderService.size$ as Subject<any>).next(f.size);
        (navigator.stateService.state$ as Subject<any>).next(State.Traversing);
        const frame = () => (navigator.stateService.currentState$ as Subject<any>).next(f.frame);
        const view = () => (container.renderService.renderCameraFrame$ as Subject<any>).next({ perspective: f.camera, currentImageId: "current" });
        frame(); view();
        return { ...f, component, container, navigator, dom, update, emitFrame: frame, emitView: view };
    }
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());
    for (const side of ["current", "previous"]) {
        it(`keeps merged mixed ${side}-spherical comparisons in 2D despite manual Motion with automaticMotion=false`, () => {
            const f = componentFixture();
            const i = f.state[`${side}Image`];
            i.cameraType = i.camera.type = "spherical";
            f.state[`${side}Transform`] = transform(i, side === "current" ? 2 : 0);
            f.component.configure({ automaticMotion: false, viewAligned: true, mode: Mode.Motion });
            f.emitFrame();
            (f.component as any)._domRenderer._notifyModeChanged$.next(Mode.Motion);
            expect(f.update.calls.mostRecent().args[1]).toBe(Mode.Stationary);
            expect(f.dom.calls.mostRecent().args[1]).toBe(Mode.Stationary);
            expect(f.dom.calls.mostRecent().args[2]).toBe(true);
            f.component.setPosition(0.25);
            expect(f.navigator.stateService.moveTo.calls.mostRecent().args).toEqual([1]);
            expect(f.navigator.stateService.wait).not.toHaveBeenCalled();
            expect(f.navigator.stateService.waitInteractively).toHaveBeenCalled();
            f.component.deactivate();
        });
    }
    it("keeps native view-aligned mode changes interactive and alpha1 without resetting the selected crop", () => {
        const f = componentFixture();
        f.component.configure({ automaticMotion: false, viewAligned: true, mode: Mode.Stationary });
        f.navigator.stateService.wait.calls.reset();
        f.navigator.stateService.moveTo.calls.reset();
        for (const mode of [Mode.Motion, Mode.Stationary, Mode.Motion, Mode.Stationary]) {
            (f.component as any)._domRenderer._notifyModeChanged$.next(mode);
            f.component.setPosition(0.25);
            expect(f.update.calls.mostRecent().args[1]).toBe(mode);
            expect(f.dom.calls.mostRecent().args[1]).toBe(mode);
            expect(f.navigator.stateService.moveTo.calls.mostRecent().args).toEqual([1]);
            expect(f.navigator.stateService.wait).not.toHaveBeenCalled();
        }
        expect(f.navigator.stateService.waitInteractively).toHaveBeenCalled();
        f.component.deactivate();
    });
    it("snapshots legacy interaction primitives before distinct when one frame/state object is repeatedly mutated", () => {
        const f = componentFixture();
        f.component.configure({ automaticMotion: false, viewAligned: false, mode: Mode.Motion });
        f.navigator.stateService.wait.calls.reset();
        f.navigator.stateService.waitInteractively.calls.reset();
        f.state.motionless = true;
        f.emitFrame();
        expect(f.navigator.stateService.waitInteractively).toHaveBeenCalledTimes(1);
        expect(f.navigator.stateService.moveTo.calls.mostRecent().args).toEqual([1]);
        f.state.motionless = false;
        f.emitFrame();
        expect(f.navigator.stateService.wait).toHaveBeenCalledTimes(1);
        expect(f.navigator.stateService.moveTo.calls.mostRecent().args).toEqual([0.5]);
        f.state.currentImage.id = "new-current";
        f.state.previousImage.id = "new-previous";
        f.emitFrame();
        expect(f.navigator.stateService.wait).toHaveBeenCalledTimes(2);
        f.component.deactivate();
    });
    for (const automatic of [false, true]) {
    it(`updates both Motion tile ROIs on curtain/mode changes (automatic=${automatic})`, () => {
        const f = componentFixture();
        f.component.configure({ automaticMotion: automatic, viewAligned: true, mode: Mode.Motion });
        const roi = { bbox: { minX: 0.2, maxX: 0.8, minY: 0.3, maxY: 0.7 }, pixelWidth: 0.001, pixelHeight: 0.002 };
        const compute = spyOn((f.component as any)._roiCalculator, "computeRegionOfInterest").and.returnValue(roi);
        const setROI = spyOn(TextureProvider.prototype, "setRegionOfInterest");
        (f.container.configurationService.imageTiling$ as Subject<any>).next(true);
        (f.container.glRenderer.webGLRenderer$ as Subject<any>).next({});
        (f.container.renderService.size$ as Subject<any>).next(f.size);
        f.emitFrame();
        (f.navigator.stateService.currentTransform$ as Subject<any>).next(f.state.currentTransform);
        f.emitView();
        (f.container.renderService.size$ as Subject<any>).next(f.size);
        jest.advanceTimersByTime(100);
        setROI.calls.reset(); compute.calls.reset();
        f.component.setPosition(0.25);
        expect(setROI.calls.count()).toBe(2);
        expect(compute.calls.count()).toBe(2);
        compute.calls.allArgs().forEach(args => {
            expect(args[0].perspective.position.toArray()).toEqual([0.5, 0, 0]);
            expect(new THREE.Vector3().setFromMatrixPosition(args[0].perspective.matrixWorld).toArray()).toEqual([0.5, 0, 0]);
            const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(), args[0].perspective);
            expect(ray.ray.origin.toArray()).toEqual([0.5, 0, 0]);
            sameView(args[0].perspective, f.camera);
        });
        setROI.calls.allArgs().forEach(args => expect(args[0].bbox).toEqual({ minX: 0, maxX: 1, minY: 0, maxY: 1 }));
        expect(new Set(compute.calls.allArgs().map(args => args[2]))).toEqual(new Set([f.state.currentTransform, f.state.previousTransform]));
        f.component.configure({ mode: Mode.Stationary });
        f.component.configure({ mode: Mode.Motion });
        expect(setROI.calls.count()).toBeGreaterThan(2);
        const previousImage = f.state.previousImage, previousTransform = f.state.previousTransform;
        setROI.calls.reset(); compute.calls.reset();
        f.state.previousImage = null; f.state.previousTransform = null;
        f.emitFrame(); f.component.setPosition(0.75); f.emitView();
        expect(compute.calls.count()).toBe(0); expect(setROI.calls.count()).toBe(0);
        f.state.previousImage = previousImage; f.state.previousTransform = previousTransform;
        f.emitFrame(); jest.advanceTimersByTime(100);
        setROI.calls.reset(); compute.calls.reset(); f.component.setPosition(0.25);
        expect(compute.calls.count()).toBe(2); expect(setROI.calls.count()).toBe(2);
        f.component.deactivate();
    });
    }
    it("uses stationary render cameras for native motionless fallback tile footprints", () => {
        const f = componentFixture();
        f.component.configure({ automaticMotion: false, viewAligned: true, mode: Mode.Motion });
        f.state.motionless = true; f.emitFrame();
        const roi = { bbox: { minX: 0.2, maxX: 0.8, minY: 0.3, maxY: 0.7 }, pixelWidth: 0.001, pixelHeight: 0.002 };
        const compute = spyOn((f.component as any)._roiCalculator, "computeRegionOfInterest").and.returnValue(roi);
        const setROI = spyOn(TextureProvider.prototype, "setRegionOfInterest");
        (f.container.configurationService.imageTiling$ as Subject<any>).next(true);
        (f.container.glRenderer.webGLRenderer$ as Subject<any>).next({});
        (f.container.renderService.size$ as Subject<any>).next(f.size); f.emitFrame();
        (f.navigator.stateService.currentTransform$ as Subject<any>).next(f.state.currentTransform);
        f.emitView(); (f.container.renderService.size$ as Subject<any>).next(f.size);
        setROI.calls.reset(); compute.calls.reset(); f.component.setPosition(0.25);
        expect(f.update.calls.mostRecent().args[1]).toBe(Mode.Stationary);
        expect(compute.calls.count()).toBe(2); expect(setROI.calls.count()).toBe(2);
        f.update.and.callThrough();
        const r = new SliderGLRenderer() as any; r.update(f.frame, Mode.Motion, false, true, false); r.updateCurtain(0.25, true);
        for (const args of compute.calls.allArgs()) {
            const expected = args[2] === f.state.currentTransform ? r._getCurrentPerspective(f.camera) : r._getPreviousPerspective(f.camera);
            expect(args[0].perspective.matrixWorld.elements).toEqual(expected.matrixWorld.elements);
            sameView(args[0].perspective, expected);
        }
        setROI.calls.allArgs().forEach(args => expect(args[0].bbox).toEqual(roi.bbox));
        r.dispose(); f.component.deactivate();
    });
    it("waits interactively and holds native alpha at 1 even when effective Motion", () => {
        const f = componentFixture();
        expect(f.component.defaultConfiguration.automaticMotion).toBe(false);
        expect(f.update.calls.mostRecent().args[1]).toBe(Mode.Stationary);
        jest.advanceTimersByTime(100);
        expect(f.update.calls.mostRecent().args.slice(1)).toEqual([Mode.Motion, false, true, true]);
        expect(f.dom.calls.mostRecent().args[1]).toBe(Mode.Motion);
        f.component.setPosition(0.25);
        expect(f.navigator.stateService.moveTo.calls.mostRecent().args).toEqual([1]);
        expect(f.navigator.stateService.wait).not.toHaveBeenCalled();
        expect(f.navigator.stateService.waitInteractively).toHaveBeenCalled();
        f.component.deactivate();
    });
    it("immediately revokes Motion for a same-object merge-ID mismatch and cannot be bypassed by the mode control", () => {
        const f = componentFixture(); jest.advanceTimersByTime(100);
        expect(f.update.calls.mostRecent().args[1]).toBe(Mode.Motion);
        f.state.currentImage.mergeId = "different-component";
        f.emitFrame();
        expect(f.update.calls.mostRecent().args[1]).toBe(Mode.Stationary);
        expect(f.dom.calls.mostRecent().args[2]).toBe(true);
        (f.component as any)._domRenderer._notifyModeChanged$.next(Mode.Motion);
        expect(f.update.calls.mostRecent().args[1]).toBe(Mode.Stationary);
        expect(f.navigator.stateService.moveTo.calls.mostRecent().args).toEqual([1]);
        expect(f.navigator.stateService.wait).not.toHaveBeenCalled();
        f.component.deactivate();
    });
    it("never enables a stale pair and mode button cannot override an unsafe rejection", () => {
        const f = componentFixture(); jest.advanceTimersByTime(100);
        f.component.configure({ ids: { background: "replacement", foreground: "current" } });
        expect(f.update.calls.mostRecent().args[1]).toBe(Mode.Stationary);
        expect(f.dom.calls.mostRecent().args[2]).toBe(true);
        (f.component as any)._domRenderer._notifyModeChanged$.next(Mode.Motion);
        expect(f.update.calls.mostRecent().args[1]).toBe(Mode.Stationary);
        f.component.deactivate();
    });
    it("revokes on view/resize changes and only checks a settled view, reusing manual2D coverage", () => {
        const f = componentFixture(); const covered = spyOn(SliderAutomaticMotion.prototype as any, "_covered").and.callThrough();
        jest.advanceTimersByTime(100); expect(covered.calls.count()).toBe(1);
        f.component.configure({ mode: Mode.Stationary });
        expect(f.update.calls.mostRecent().args[1]).toBe(Mode.Stationary);
        expect(f.dom.calls.mostRecent().args[2]).toBe(false);
        f.component.configure({ mode: Mode.Motion }); expect(covered.calls.count()).toBe(1);
        for (let n = 0; n < 20; n++) { f.emitFrame(); f.emitView(); }
        expect(covered.calls.count()).toBe(1);
        f.camera.zoom = 1.2; f.camera.updateProjectionMatrix(); f.emitView();
        expect(f.update.calls.mostRecent().args[1]).toBe(Mode.Stationary);
        expect(covered.calls.count()).toBe(1);
        jest.advanceTimersByTime(100); expect(covered.calls.count()).toBe(2);
        (f.container.renderService.size$ as Subject<any>).next({ width: 1000, height: 900 });
        expect(covered.calls.count()).toBe(2);
        expect(f.update.calls.mostRecent().args[1]).toBe(Mode.Stationary);
        jest.advanceTimersByTime(100);
        expect(covered.calls.count()).toBe(3);
        f.component.deactivate();
    });
});
