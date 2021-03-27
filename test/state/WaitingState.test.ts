import * as THREE from "three";

import { NodeHelper } from "../helper/NodeHelper";

import { Node } from "../../src/graph/Node";
import { SpatialImageEnt } from "../../src/api/ents/SpatialImageEnt";
import { IStateBase } from "../../src/state/interfaces/IStateBase";
import { WaitingState } from "../../src/state/state/WaitingState";
import { Camera } from "../../src/geo/Camera";
import { TransitionMode } from "../../src/state/TransitionMode";
import { TransformHelper } from "../helper/TransformHelper";

const transformHelper = new TransformHelper();

describe("WaitingState.ctor", () => {
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

        let waitingState: WaitingState = new WaitingState(state);

        expect(waitingState).toBeDefined();
    });
});

class TestWaitingState extends WaitingState {
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

describe("WaitingState.currentCamera.lookat", () => {
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

        let waitingState: TestWaitingState = new TestWaitingState(state);

        let node: TestNode = new TestNode();
        let fillNode: SpatialImageEnt = helper.createFillNode();
        node.makeFull(fillNode);

        waitingState.set([node]);

        expect(waitingState.currentCamera.position.x).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.position.y).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.position.z).toBeCloseTo(0, precision);

        expect(waitingState.currentCamera.lookat.x).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.lookat.y).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.lookat.z).toBeGreaterThan(0);
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

        let waitingState: TestWaitingState = new TestWaitingState(state);

        let previousNode: TestNode = new TestNode();
        let previousFillNode: SpatialImageEnt = helper.createFillNode();
        previousFillNode.computed_rotation = [Math.PI, 0, 0];
        previousNode.makeFull(previousFillNode);

        let currentNode: TestNode = new TestNode();
        let currentFillNode: SpatialImageEnt = helper.createFillNode();
        currentNode.makeFull(currentFillNode);

        waitingState.set([previousNode]);
        waitingState.set([currentNode]);

        expect(waitingState.currentCamera.position.x).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.position.y).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.position.z).toBeCloseTo(0, precision);

        expect(waitingState.currentCamera.lookat.x).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.lookat.y).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.lookat.z).toBeGreaterThan(0);
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

        let waitingState: TestWaitingState = new TestWaitingState(state);

        let previousNode: TestNode = new TestNode();
        let previousFillNode: SpatialImageEnt = helper.createFillNode();
        previousFillNode.computed_rotation = [Math.PI, 0, 0];
        previousNode.makeFull(previousFillNode);

        let currentNode: TestNode = new TestNode();
        let currentFillNode: SpatialImageEnt = helper.createFillNode();
        currentFillNode.camera_type = "spherical";

        currentNode.makeFull(currentFillNode);

        waitingState.set([previousNode]);
        waitingState.set([currentNode]);

        expect(waitingState.currentCamera.position.x).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.position.y).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.position.z).toBeCloseTo(0, precision);

        let cameraDirection: THREE.Vector3 = camera.lookat.clone().sub(camera.position).normalize();
        let currentDirection: THREE.Vector3 = waitingState.currentCamera.lookat
            .clone()
            .sub(waitingState.currentCamera.position)
            .normalize();

        expect(currentDirection.x).toBeCloseTo(cameraDirection.x, precision);
        expect(currentDirection.y).toBeCloseTo(cameraDirection.y, precision);
        expect(currentDirection.z).toBeCloseTo(cameraDirection.z, precision);
    });
});

describe("WaitingState.previousCamera.lookat", () => {
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

        let waitingState: TestWaitingState = new TestWaitingState(state);

        let node: TestNode = new TestNode();
        let fillNode: SpatialImageEnt = helper.createFillNode();
        node.makeFull(fillNode);

        waitingState.set([node]);

        expect(waitingState.previousCamera.position.x).toBeCloseTo(0, precision);
        expect(waitingState.previousCamera.position.y).toBeCloseTo(0, precision);
        expect(waitingState.previousCamera.position.z).toBeCloseTo(0, precision);

        expect(waitingState.previousCamera.lookat.x).toBeCloseTo(0, precision);
        expect(waitingState.previousCamera.lookat.y).toBeCloseTo(0, precision);
        expect(waitingState.previousCamera.lookat.z).toBeGreaterThan(0);
    });

    it("should correspond to previous node when previous node set", () => {
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

        let waitingState: TestWaitingState = new TestWaitingState(state);

        let previousNode: TestNode = new TestNode();
        let previousFillNode: SpatialImageEnt = helper.createFillNode();
        previousNode.makeFull(previousFillNode);

        let currentNode: TestNode = new TestNode();
        let currentFillNode: SpatialImageEnt = helper.createFillNode();
        currentFillNode.computed_rotation = [Math.PI, 0, 0];
        currentNode.makeFull(currentFillNode);

        waitingState.set([previousNode]);
        waitingState.set([currentNode]);

        expect(waitingState.previousCamera.position.x).toBeCloseTo(0, precision);
        expect(waitingState.previousCamera.position.y).toBeCloseTo(0, precision);
        expect(waitingState.previousCamera.position.z).toBeCloseTo(0, precision);

        expect(waitingState.previousCamera.lookat.x).toBeCloseTo(0, precision);
        expect(waitingState.previousCamera.lookat.y).toBeCloseTo(0, precision);
        expect(waitingState.previousCamera.lookat.z).toBeGreaterThan(0);
    });

    it("should correspond to direction of current camera when spherical and previous node set", () => {
        let camera: Camera = new Camera();

        let state: IStateBase = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lon: 0 },
            trajectory: [],
            transitionMode: TransitionMode.Default,
            zoom: 0,
        };

        let waitingState: TestWaitingState = new TestWaitingState(state);

        let previousNode: TestNode = new TestNode();
        let previousFillNode: SpatialImageEnt = helper.createFillNode();
        previousFillNode.camera_type = "spherical";

        previousNode.makeFull(previousFillNode);

        let currentNode: TestNode = new TestNode();
        let currentFillNode: SpatialImageEnt = helper.createFillNode();
        currentFillNode.computed_rotation = [0.2, 0.3, 0.4];
        currentNode.makeFull(currentFillNode);

        waitingState.set([previousNode]);
        waitingState.set([currentNode]);

        let currentDirection: THREE.Vector3 = waitingState.currentCamera.lookat
            .clone()
            .sub(waitingState.currentCamera.position);

        let previousDirection: THREE.Vector3 = waitingState.previousCamera.lookat
            .clone()
            .sub(waitingState.previousCamera.position);

        expect(previousDirection.x).not.toBe(0);
        expect(previousDirection.y).not.toBe(0);
        expect(previousDirection.z).not.toBe(0);

        expect(previousDirection.x).toBeCloseTo(currentDirection.x, precision);
        expect(previousDirection.y).toBeCloseTo(currentDirection.y, precision);
        expect(previousDirection.z).toBeCloseTo(currentDirection.z, precision);
    });
});
