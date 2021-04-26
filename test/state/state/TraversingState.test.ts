import { bootstrap } from "../../Bootstrap";
bootstrap();

import * as THREE from "three";

import { ImageHelper } from "../../helper/ImageHelper";

import { Image } from "../../../src/graph/Image";
import { SpatialImageEnt } from "../../../src/api/ents/SpatialImageEnt";
import { IStateBase } from "../../../src/state/interfaces/IStateBase";
import { TraversingState } from "../../../src/state/state/TraversingState";
import { Camera } from "../../../src/geo/Camera";
import { TransitionMode } from "../../../src/state/TransitionMode";
import { TransformHelper } from "../../helper/TransformHelper";

const transformHelper = new TransformHelper();

describe("TraversingState.ctor", () => {
    it("should be defined", () => {
        let state: IStateBase = {
            alpha: 1,
            camera: new Camera(),
            currentIndex: -1,
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

    public get previousCamera(): Camera {
        return this._previousCamera;
    }
}

class TestImage extends Image {
    constructor() {
        super({
            computed_geometry: { lat: 0, lng: 0 },
            id: "key",
            geometry: { lat: 0, lng: 0 },
            sequence: { id: "skey" },
        });
    }

    public get assetsCached(): boolean {
        return true;
    }

    public get image(): HTMLImageElement {
        return null;
    }
}

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
            reference: { alt: 0, lat: 0, lng: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let image: TestImage = new TestImage();
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        image.makeComplete(spatialImage);

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
            reference: { alt: 0, lat: 0, lng: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let previousImage: TestImage = new TestImage();
        let previousSpatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        previousSpatialImage.computed_rotation = [Math.PI, 0, 0];
        previousImage.makeComplete(previousSpatialImage);

        let currentImage: TestImage = new TestImage();
        let currentSpatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        currentImage.makeComplete(currentSpatialImage);

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
            reference: { alt: 0, lat: 0, lng: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let previousImage: TestImage = new TestImage();
        let preivousSpatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        preivousSpatialImage.computed_rotation = [Math.PI, 0, 0];
        previousImage.makeComplete(preivousSpatialImage);

        let currentImage: TestImage = new TestImage();
        let currentSpatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        currentSpatialImage.camera_type = "spherical";

        currentImage.makeComplete(currentSpatialImage);

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
            reference: { alt: 0, lat: 0, lng: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let image: TestImage = new TestImage();
        let spatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        image.makeComplete(spatialImage);

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
            reference: { alt: 0, lat: 0, lng: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let previousImage: TestImage = new TestImage();
        let previousSpatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        previousSpatialImage.computed_rotation = [Math.PI, 0, 0];
        previousImage.makeComplete(previousSpatialImage);

        let currentImage: TestImage = new TestImage();
        let currentSpatialImage: SpatialImageEnt = helper.createSpatialImageEnt();
        currentImage.makeComplete(currentSpatialImage);

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
