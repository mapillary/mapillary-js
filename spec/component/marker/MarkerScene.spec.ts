import * as THREE from "three";

import {ILatLon} from "../../../src/API";
import {
    Marker,
    MarkerScene,
} from "../../../src/Component";

class TestMarker extends Marker {
    constructor(id: string, latLon: ILatLon) { super(id, latLon); }
    protected _createGeometry(position: number[]): void { /* noop */ }
    protected _disposeGeometry(): void { /* noop */ }
    protected _getInteractiveObjects(): THREE.Object3D[] { return []; }
}

class RendererMock implements THREE.Renderer {
    public domElement: HTMLCanvasElement = document.createElement("canvas");

    public render(s: THREE.Scene, c: THREE.Camera): void { return; }
    public setSize(w: number, h: number, updateStyle?: boolean): void { return; }
    public setClearColor(c: THREE.Color, o: number): void { return; }
    public setPixelRatio(ratio: number): void { return; }
    public clear(): void { return; }
    public clearDepth(): void { return; }
}

describe("MarkerScene.ctor", () => {
    it("should be defined", () => {
        let markerScene: MarkerScene = new MarkerScene();

        expect(markerScene).toBeDefined();
    });

    it("should not need render after creation", () => {
        let markerScene: MarkerScene = new MarkerScene();

        expect(markerScene.needsRender).toBe(false);
    });
});

describe("MarkerScene.add", () => {
    it("should add single marker", () => {
        let scene: THREE.Scene = new THREE.Scene();
        let sceneAddSpy: jasmine.Spy = spyOn(scene, "add").and.stub();

        let markerScene: MarkerScene = new MarkerScene(scene);

        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });

        let createGeometrySpy: jasmine.Spy = spyOn(marker, "createGeometry").and.stub();
        let getInteractiveSpy: jasmine.Spy = spyOn(marker, "getInteractiveObjects");
        getInteractiveSpy.and.returnValue([]);

        markerScene.add(marker, [0, 0, 0]);

        expect(markerScene.get(marker.id)).toBe(marker);

        expect(sceneAddSpy.calls.count()).toBe(1);
        expect(createGeometrySpy.calls.count()).toBe(1);
        expect(getInteractiveSpy.calls.count()).toBe(1);

        expect(markerScene.needsRender).toBe(true);
    });
});

describe("MarkerScene.render", () => {
    it("should not need render after render", () => {
        let scene: THREE.Scene = new THREE.Scene();
        spyOn(scene, "add").and.stub();

        let markerScene: MarkerScene = new MarkerScene(scene);

        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });

        spyOn(marker, "createGeometry").and.stub();
        spyOn(marker, "getInteractiveObjects").and.returnValue([]);

        markerScene.add(marker, [0, 0, 0]);

        expect(markerScene.needsRender).toBe(true);

        let camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
        let renderer: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        let renderSpy: jasmine.Spy = spyOn(renderer, "render").and.stub();
        markerScene.render(camera, renderer);

        expect(markerScene.needsRender).toBe(false);

        expect(renderSpy.calls.count()).toBe(1);
    });
});

describe("MarkerScene.clear", () => {
    it("should clear a single marker", () => {
        let scene: THREE.Scene = new THREE.Scene();
        spyOn(scene, "add").and.stub();

        let markerScene: MarkerScene = new MarkerScene(scene);
        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });

        spyOn(marker, "createGeometry").and.stub();
        spyOn(marker, "getInteractiveObjects").and.returnValue([]);

        let disposeGeometrySpy: jasmine.Spy = spyOn(marker, "disposeGeometry");

        markerScene.add(marker, [0, 0, 0]);

        let camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
        let renderer: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(renderer, "render").and.stub();
        markerScene.render(camera, renderer);

        markerScene.clear();

        expect(markerScene.get(marker.id)).toBe(undefined);

        expect(disposeGeometrySpy.calls.count()).toBe(1);

        expect(markerScene.needsRender).toBe(true);
    });
});

describe("MarkerScene.remove", () => {
    it("should remove a single marker", () => {
        let scene: THREE.Scene = new THREE.Scene();
        spyOn(scene, "add").and.stub();

        let markerScene: MarkerScene = new MarkerScene(scene);
        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });

        spyOn(marker, "createGeometry").and.stub();
        spyOn(marker, "getInteractiveObjects").and.returnValue([]);

        let disposeGeometrySpy: jasmine.Spy = spyOn(marker, "disposeGeometry");

        markerScene.add(marker, [0, 0, 0]);

        let camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
        let renderer: THREE.WebGLRenderer = <THREE.WebGLRenderer>new RendererMock();
        spyOn(renderer, "render").and.stub();
        markerScene.render(camera, renderer);

        markerScene.remove(marker.id);

        expect(markerScene.get(marker.id)).toBe(undefined);

        expect(disposeGeometrySpy.calls.count()).toBe(1);

        expect(markerScene.needsRender).toBe(true);
    });
});

describe("MarkerScene.has", () => {
    it("should have an added marker and not have a removed one", () => {
        let scene: THREE.Scene = new THREE.Scene();
        spyOn(scene, "add").and.stub();

        let markerScene: MarkerScene = new MarkerScene(scene);

        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });

        spyOn(marker, "createGeometry").and.stub();
        spyOn(marker, "getInteractiveObjects").and.returnValue([]);
        spyOn(marker, "disposeGeometry");

        markerScene.add(marker, [0, 0, 0]);

        expect(markerScene.has(marker.id)).toBe(true);

        markerScene.remove(marker.id);

        expect(markerScene.has(marker.id)).toBe(false);
    });
});

describe("MarkerScene.update", () => {
    it("should call update", () => {
        let scene: THREE.Scene = new THREE.Scene();
        spyOn(scene, "add").and.stub();

        let markerScene: MarkerScene = new MarkerScene(scene);

        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });

        spyOn(marker, "createGeometry").and.stub();
        spyOn(marker, "getInteractiveObjects").and.returnValue([]);
        let updateSpy: jasmine.Spy = spyOn(marker, "updatePosition");

        markerScene.add(marker, [0, 0, 0]);
        markerScene.update(marker.id, [1, 1, 1], { lat: 1, lon: 1 });

        expect(updateSpy.calls.count()).toBe(1);
    });
});

describe("MarkerScene.intersectObjects", () => {
    it("should add single marker", () => {
        let scene: THREE.Scene = new THREE.Scene();
        spyOn(scene, "add").and.stub();

        let interactiveObjectId: string = "interactive-id";
        let interactiveObject: THREE.Object3D = <THREE.Object3D>{ uuid: interactiveObjectId };
        let intersection: THREE.Intersection =
            <THREE.Intersection>{ object: { uuid: interactiveObjectId }};

        let raycaster: THREE.Raycaster = new THREE.Raycaster();
        spyOn(raycaster, "intersectObjects").and.returnValue([intersection]);
        spyOn(raycaster, "setFromCamera").and.stub();

        let marker: TestMarker = new TestMarker("id", { lat: 0, lon: 0 });
        spyOn(marker, "createGeometry").and.stub();
        spyOn(marker, "getInteractiveObjects").and.returnValue([interactiveObject]);

        let markerScene: MarkerScene = new MarkerScene(scene, raycaster);
        markerScene.add(marker, [0, 0, 0]);

        let intersectedId: string = markerScene.intersectObjects([0, 0], new THREE.Camera());

        expect(intersectedId).toBe(marker.id);
    });
});
