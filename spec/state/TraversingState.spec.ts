import { bootstrap } from "../Bootstrap";
bootstrap();

import * as THREE from "three";

import { NodeHelper } from "../helper/NodeHelper";

import { Node } from "../../src/graph/Node";
import { SpatialImageEnt } from "../../src/api/ents/SpatialImageEnt";
import { IStateBase } from "../../src/state/interfaces/IStateBase";
import { TraversingState } from "../../src/state/states/TraversingState";
import { Camera } from "../../src/geo/Camera";
import { TransitionMode } from "../../src/state/TransitionMode";
import { TransformHelper } from "../helper/TransformHelper";

const transformHelper = new TransformHelper();

describe("TraversingState.ctor", () => {
    it("should be defined", () => {
        let state: IStateBase = {
            alpha: 1,
            camera: new Camera(),
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lon: 0 },
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

class TestNode extends Node {
    constructor() {
        super({
            computed_geometry: { lat: 0, lon: 0 },
            id: "key",
            geometry: { lat: 0, lon: 0 },
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

    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should correspond to set node", () => {
        let camera: Camera = new Camera();
        camera.position.fromArray([10, 10, 0]);
        camera.lookat.fromArray([15, 15, 0]);

        let state: IStateBase = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lon: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let node: TestNode = new TestNode();
        let fillNode: SpatialImageEnt = helper.createFillNode();
        node.makeFull(fillNode);

        traversingState.set([node]);

        expect(traversingState.currentCamera.position.x).toBeCloseTo(0, precision);
        expect(traversingState.currentCamera.position.y).toBeCloseTo(0, precision);
        expect(traversingState.currentCamera.position.z).toBeCloseTo(0, precision);

        expect(traversingState.currentCamera.lookat.x).toBeCloseTo(0, precision);
        expect(traversingState.currentCamera.lookat.y).toBeCloseTo(0, precision);
        expect(traversingState.currentCamera.lookat.z).toBeGreaterThan(0);
    });

    it("should correspond to set nodes", () => {
        let camera: Camera = new Camera();
        camera.position.fromArray([10, 10, 0]);
        camera.lookat.fromArray([15, 15, 0]);

        let state: IStateBase = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lon: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let previousNode: TestNode = new TestNode();
        let previousFillNode: SpatialImageEnt = helper.createFillNode();
        previousFillNode.computed_rotation = [Math.PI, 0, 0];
        previousNode.makeFull(previousFillNode);

        let currentNode: TestNode = new TestNode();
        let currentFillNode: SpatialImageEnt = helper.createFillNode();
        currentNode.makeFull(currentFillNode);

        traversingState.set([previousNode]);
        traversingState.set([currentNode]);

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
            reference: { alt: 0, lat: 0, lon: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let previousNode: TestNode = new TestNode();
        let preivousFillNode: SpatialImageEnt = helper.createFillNode();
        preivousFillNode.computed_rotation = [Math.PI, 0, 0];
        previousNode.makeFull(preivousFillNode);

        let currentNode: TestNode = new TestNode();
        let currentFillNode: SpatialImageEnt = helper.createFillNode();
        currentFillNode.camera_type = "spherical";

        currentNode.makeFull(currentFillNode);

        traversingState.set([previousNode]);
        traversingState.set([currentNode]);

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

    let helper: NodeHelper;

    beforeEach(() => {
        helper = new NodeHelper();
    });

    it("should correspond to current node camera when previous node not set", () => {
        let camera: Camera = new Camera();
        camera.position.fromArray([10, 10, 0]);
        camera.lookat.fromArray([15, 15, 0]);

        let state: IStateBase = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lon: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let node: TestNode = new TestNode();
        let fillNode: SpatialImageEnt = helper.createFillNode();
        node.makeFull(fillNode);

        traversingState.set([node]);

        expect(traversingState.previousCamera.position.x).toBeCloseTo(0, precision);
        expect(traversingState.previousCamera.position.y).toBeCloseTo(0, precision);
        expect(traversingState.previousCamera.position.z).toBeCloseTo(0, precision);

        expect(traversingState.previousCamera.lookat.x).toBeCloseTo(0, precision);
        expect(traversingState.previousCamera.lookat.y).toBeCloseTo(0, precision);
        expect(traversingState.previousCamera.lookat.z).toBeGreaterThan(0);
    });

    it("should correspond to camera when previous node set", () => {
        let camera: Camera = new Camera();
        camera.position.fromArray([10, 10, 0]);
        camera.lookat.fromArray([15, 15, 0]);

        let state: IStateBase = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lon: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let traversingState: TestTraversingState = new TestTraversingState(state);

        let previousNode: TestNode = new TestNode();
        let previousFillNode: SpatialImageEnt = helper.createFillNode();
        previousFillNode.computed_rotation = [Math.PI, 0, 0];
        previousNode.makeFull(previousFillNode);

        let currentNode: TestNode = new TestNode();
        let currentFillNode: SpatialImageEnt = helper.createFillNode();
        currentNode.makeFull(currentFillNode);

        traversingState.set([previousNode]);
        traversingState.set([currentNode]);

        expect(traversingState.previousCamera.position.x).toBeCloseTo(0, precision);
        expect(traversingState.previousCamera.position.y).toBeCloseTo(0, precision);
        expect(traversingState.previousCamera.position.z).toBeCloseTo(0, precision);

        let lookat: THREE.Vector3 = camera.lookat.clone().sub(camera.position);

        expect(traversingState.previousCamera.lookat.x).toBeCloseTo(lookat.x, precision);
        expect(traversingState.previousCamera.lookat.y).toBeCloseTo(lookat.y, precision);
        expect(traversingState.previousCamera.lookat.z).toBeCloseTo(lookat.z, precision);
    });
});
