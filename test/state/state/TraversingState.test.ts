import { bootstrap } from "../../Bootstrap";
bootstrap();

import * as THREE from "three";

import { ImageHelper } from "../../helper/ImageHelper";

import { SpatialImageEnt } from "../../../src/api/ents/SpatialImageEnt";
import { IStateBase } from "../../../src/state/interfaces/IStateBase";
import { TraversingState } from "../../../src/state/state/TraversingState";
import { Camera } from "../../../src/geo/Camera";
import { TransitionMode } from "../../../src/state/TransitionMode";
import { ImageCache } from "../../../src/graph/ImageCache";
import { DataProvider } from "../../helper/ProviderHelper";
import { ProjectionService } from "../../../src/viewer/ProjectionService";
import { TestImage } from "../../helper/TestImage";
import { S2GeometryProvider } from "../../../src/api/S2GeometryProvider";

describe("TraversingState.ctor", () => {
    it("should be defined", () => {
        let state: IStateBase = {
            alpha: 1,
            camera: new Camera(),
            currentIndex: -1,
            geometry: new S2GeometryProvider(),
            reference: { alt: 0, lat: 0, lng: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TraversingState = new TraversingState(state);

        expect(traversingState).toBeDefined();
    });
});

class TestTraversingState extends TraversingState {
    public get currentCamera(): Camera {
        return this._currentCamera;
    }

    public get desiredZoom(): number {
        return this._desiredZoom;
    }

    public get previousCamera(): Camera {
        return this._previousCamera;
    }
}

function createTestImage(id: string = "key", lng: number = 0): TestImage {
    const image = new TestImage({
        computed_geometry: { lat: 0, lng },
        id,
        geometry: { lat: 0, lng },
        sequence: { id: "skey" },
    });
    image.mesh = { vertices: [], faces: [] };
    return image;
}

describe("TraversingState.zoomTo", () => {
    it("should update desired zoom without changing current zoom", () => {
        const state: IStateBase = {
            alpha: 1,
            camera: new Camera(),
            currentIndex: -1,
            geometry: new S2GeometryProvider(),
            reference: { alt: 0, lat: 0, lng: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 1,
        };
        const traversingState = new TestTraversingState(state);

        traversingState.zoomTo(0.25);

        expect(traversingState.zoom).toBe(1);
        expect(traversingState.desiredZoom).toBe(0.25);
    });
});

describe("TraversingState.currentCamera.lookat", () => {
    let precision: number = 1e-8;

    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should correspond to set image", () => {
        let camera: Camera = new Camera();
        camera.position.fromArray([10, 10, 0]);
        camera.lookat.fromArray([15, 15, 0]);

        let state: IStateBase = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            geometry: new S2GeometryProvider(),
            reference: { alt: 0, lat: 0, lng: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let image: TestImage = createTestImage();
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        image.makeComplete(spatialImage);
        image.initializeCache(new ImageCache(new DataProvider()));
        image.cacheCamera(new ProjectionService());

        traversingState.set([image]);

        expect(traversingState.currentCamera.position.x).toBeCloseTo(0, precision);
        expect(traversingState.currentCamera.position.y).toBeCloseTo(0, precision);
        expect(traversingState.currentCamera.position.z).toBeCloseTo(0, precision);

        expect(traversingState.currentCamera.lookat.x).toBeCloseTo(0, precision);
        expect(traversingState.currentCamera.lookat.y).toBeCloseTo(0, precision);
        expect(traversingState.currentCamera.lookat.z).toBeGreaterThan(0);
    });

    it("should correspond to set images", () => {
        let camera: Camera = new Camera();
        camera.position.fromArray([10, 10, 0]);
        camera.lookat.fromArray([15, 15, 0]);

        let state: IStateBase = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            geometry: new S2GeometryProvider(),
            reference: { alt: 0, lat: 0, lng: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let previousImage: TestImage = createTestImage();
        let previousSpatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        previousSpatialImage.computed_rotation = [Math.PI, 0, 0];
        previousImage.makeComplete(previousSpatialImage);
        previousImage.initializeCache(new ImageCache(new DataProvider()));
        previousImage.cacheCamera(new ProjectionService());

        let currentImage: TestImage = createTestImage();
        let currentSpatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        currentImage.makeComplete(currentSpatialImage);
        currentImage.initializeCache(new ImageCache(new DataProvider()));
        currentImage.cacheCamera(new ProjectionService());

        traversingState.set([previousImage]);
        traversingState.set([currentImage]);

        expect(traversingState.currentCamera.position.x).toBeCloseTo(0, precision);
        expect(traversingState.currentCamera.position.y).toBeCloseTo(0, precision);
        expect(traversingState.currentCamera.position.z).toBeCloseTo(0, precision);

        expect(traversingState.currentCamera.lookat.x).toBeCloseTo(0, precision);
        expect(traversingState.currentCamera.lookat.y).toBeCloseTo(0, precision);
        expect(traversingState.currentCamera.lookat.z).toBeGreaterThan(0);
    });

    it("should correspond to lookat of camera when spherical", () => {
        let camera: Camera = new Camera();
        camera.position.fromArray([10, 10, 0]);
        camera.lookat.fromArray([15, 15, 0]);

        let state: IStateBase = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            geometry: new S2GeometryProvider(),
            reference: { alt: 0, lat: 0, lng: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let previousImage: TestImage = createTestImage();
        let preivousSpatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        preivousSpatialImage.computed_rotation = [Math.PI, 0, 0];
        previousImage.makeComplete(preivousSpatialImage);
        previousImage.initializeCache(new ImageCache(new DataProvider()));
        previousImage.cacheCamera(new ProjectionService());

        let currentImage: TestImage = createTestImage();
        let currentSpatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        currentSpatialImage.camera_type = "spherical";

        currentImage.makeComplete(currentSpatialImage);
        currentImage.initializeCache(new ImageCache(new DataProvider()));
        currentImage.cacheCamera(new ProjectionService());

        traversingState.set([previousImage]);
        traversingState.set([currentImage]);

        expect(traversingState.currentCamera.position.x).toBeCloseTo(0, precision);
        expect(traversingState.currentCamera.position.y).toBeCloseTo(0, precision);
        expect(traversingState.currentCamera.position.z).toBeCloseTo(0, precision);

        let lookat: THREE.Vector3 = camera.lookat.clone().sub(camera.position);

        expect(traversingState.currentCamera.lookat.x).toBeCloseTo(lookat.x, precision);
        expect(traversingState.currentCamera.lookat.y).toBeCloseTo(lookat.y, precision);
        expect(traversingState.currentCamera.lookat.z).toBeCloseTo(lookat.z, precision);
    });
});

describe("TraversingState.previousCamera.lookat", () => {
    let precision: number = 1e-8;

    let helper: ImageHelper;

    beforeEach(() => {
        helper = new ImageHelper();
    });

    it("should correspond to current image camera when previous image not set", () => {
        let camera: Camera = new Camera();
        camera.position.fromArray([10, 10, 0]);
        camera.lookat.fromArray([15, 15, 0]);

        let state: IStateBase = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            geometry: new S2GeometryProvider(),
            reference: { alt: 0, lat: 0, lng: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let image: TestImage = createTestImage();
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        image.makeComplete(spatialImage);
        image.initializeCache(new ImageCache(new DataProvider()));
        image.cacheCamera(new ProjectionService());

        traversingState.set([image]);

        expect(traversingState.previousCamera.position.x).toBeCloseTo(0, precision);
        expect(traversingState.previousCamera.position.y).toBeCloseTo(0, precision);
        expect(traversingState.previousCamera.position.z).toBeCloseTo(0, precision);

        expect(traversingState.previousCamera.lookat.x).toBeCloseTo(0, precision);
        expect(traversingState.previousCamera.lookat.y).toBeCloseTo(0, precision);
        expect(traversingState.previousCamera.lookat.z).toBeGreaterThan(0);
    });

    it("should correspond to camera when previous image set", () => {
        let camera: Camera = new Camera();
        camera.position.fromArray([10, 10, 0]);
        camera.lookat.fromArray([15, 15, 0]);

        let state: IStateBase = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            geometry: new S2GeometryProvider(),
            reference: { alt: 0, lat: 0, lng: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let previousImage: TestImage = createTestImage();
        let previousSpatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        previousSpatialImage.computed_rotation = [Math.PI, 0, 0];
        previousImage.makeComplete(previousSpatialImage);
        previousImage.initializeCache(new ImageCache(new DataProvider()));
        previousImage.cacheCamera(new ProjectionService());

        let currentImage: TestImage = createTestImage();
        let currentSpatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        currentImage.makeComplete(currentSpatialImage);
        currentImage.initializeCache(new ImageCache(new DataProvider()));
        currentImage.cacheCamera(new ProjectionService());

        traversingState.set([previousImage]);
        traversingState.set([currentImage]);

        expect(traversingState.previousCamera.position.x).toBeCloseTo(0, precision);
        expect(traversingState.previousCamera.position.y).toBeCloseTo(0, precision);
        expect(traversingState.previousCamera.position.z).toBeCloseTo(0, precision);

        let lookat: THREE.Vector3 = camera.lookat.clone().sub(camera.position);

        expect(traversingState.previousCamera.lookat.x).toBeCloseTo(lookat.x, precision);
        expect(traversingState.previousCamera.lookat.y).toBeCloseTo(lookat.y, precision);
        expect(traversingState.previousCamera.lookat.z).toBeCloseTo(lookat.z, precision);
    });
});

describe("TraversingState mesh-less transition", () => {
    function createCachedImage(
        id: string,
        lng: number,
        spherical: boolean = false): TestImage {
        const helper = new ImageHelper();
        const image = createTestImage(id, lng);
        const spatialImage = helper.createSpatialImageEnt();
        spatialImage.camera_type = spherical ? "spherical" : "perspective";
        image.makeComplete(spatialImage);
        image.initializeCache(new ImageCache(new DataProvider()));
        image.cacheCamera(new ProjectionService());
        return image;
    }

    function createTraversingState(mode: TransitionMode): TestTraversingState {
        return new TestTraversingState({
            alpha: 1,
            camera: new Camera(),
            currentIndex: -1,
            geometry: new S2GeometryProvider(),
            reference: { alt: 0, lat: 0, lng: 0 },
            trajectory: [],
            transitionMode: mode,
            zoom: 0,
        });
    }

    it("should cross-fade while snapping the camera", () => {
        const traversingState = createTraversingState(TransitionMode.Default);
        traversingState.set([createCachedImage("previous", 0)]);
        traversingState.set([createCachedImage("current", 0.00001)]);

        traversingState.update(0.1);

        expect(traversingState.motionless).toBe(true);
        expect(traversingState.alpha).toBeGreaterThan(0.2);
        expect(traversingState.alpha).toBeLessThan(1);
        expect(traversingState.camera.position.distanceTo(
            traversingState.currentCamera.position)).toBeCloseTo(0);
    });

    it("should preserve instantaneous transition mode", () => {
        const traversingState = createTraversingState(TransitionMode.Instantaneous);
        traversingState.set([createCachedImage("previous", 0)]);
        traversingState.set([createCachedImage("current", 0.00001)]);

        traversingState.update(0.1);

        expect(traversingState.alpha).toBe(1);
    });

    it("should force a reorientation hint onto rejected reconstruction", () => {
        const current = createCachedImage("current", 0, true);
        current.mesh = {
            vertices: [0, 0, 1, 1, 0, 1, 0, 1, 1],
            faces: [0, 1, 2],
        };
        const unforced = createTraversingState(TransitionMode.Default);
        unforced.setReorientation("current", [0.25, 0.5]);
        unforced.set([current]);
        const originalLookat = unforced.currentCamera.lookat.clone();

        const forced = createTraversingState(TransitionMode.Default);
        forced.setReorientation("current", [0.25, 0.5], true);
        forced.set([current]);

        expect(forced.motionless).toBe(true);
        expect(forced.currentCamera.lookat.equals(originalLookat)).toBe(false);
        const expected = new THREE.Vector3().fromArray(
            forced.currentTransform.unprojectBasic(
                [0.25, 0.5], (forced as any)._lookatDepth));
        expect(forced.currentCamera.lookat.distanceTo(expected))
            .toBeCloseTo(0, 8);
    });
});
