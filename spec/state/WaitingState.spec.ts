/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {IAPINavImIm} from "../../src/API";
import {Camera} from "../../src/Geo";
import {Node} from "../../src/Graph";
import {IState, WaitingState} from "../../src/State";

describe("WaitingState.ctor", () => {
    it("should be defined", () => {
        let state: IState = {
            alpha: 1,
            camera: new Camera(),
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lon: 0 },
            trajectory: [],
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
    public get loaded(): boolean {
        return true;
    }
}

describe("WaitingState.currentCamera.lookat", () => {
    let precision: number = 1e-8;

    it("should correspond to set node", () => {
        let camera: Camera = new Camera();
        camera.position.fromArray([10, 10, 0]);
        camera.lookat.fromArray([15, 15, 0]);

        let state: IState = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lon: 0 },
            trajectory: [],
            zoom: 0,
        };

        let waitingState: TestWaitingState = new TestWaitingState(state);

        let apiNavImIm: IAPINavImIm = { calt: 0, key: "", rotation: [0, 0, 0] };
        let node: TestNode = new TestNode(0, {lat: 0, lon: 0}, true, null, apiNavImIm, null);

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

        let state: IState = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lon: 0 },
            trajectory: [],
            zoom: 0,
        };

        let waitingState: TestWaitingState = new TestWaitingState(state);

        let previousApiNavImIm: IAPINavImIm = { calt: 0, key: "", rotation: [Math.PI, 0, 0] };
        let previousNode: TestNode = new TestNode(0, {lat: 0, lon: 0}, true, null, previousApiNavImIm, null);

        let currentApiNavImIm: IAPINavImIm = { calt: 0, key: "", rotation: [0, 0, 0] };
        let currentNode: TestNode = new TestNode(0, {lat: 0, lon: 0}, true, null, currentApiNavImIm, null);

        waitingState.set([previousNode]);
        waitingState.set([currentNode]);

        expect(waitingState.currentCamera.position.x).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.position.y).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.position.z).toBeCloseTo(0, precision);

        expect(waitingState.currentCamera.lookat.x).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.lookat.y).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.lookat.z).toBeGreaterThan(0);
    });

    it("should correspond to lookat of camera when pano", () => {
        let camera: Camera = new Camera();
        camera.position.fromArray([10, 10, 0]);
        camera.lookat.fromArray([15, 15, 0]);

        let state: IState = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lon: 0 },
            trajectory: [],
            zoom: 0,
        };

        let waitingState: TestWaitingState = new TestWaitingState(state);

        let previousApiNavImIm: IAPINavImIm = { calt: 0, key: "", rotation: [Math.PI, 0, 0] };
        let previousNode: TestNode = new TestNode(0, {lat: 0, lon: 0}, true, null, previousApiNavImIm, null);

        let currentApiNavImIm: IAPINavImIm = {
            calt: 0,
            gpano: {
                CroppedAreaImageHeightPixels: 1,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0.5,
                FullPanoHeightPixels: 1,
                FullPanoWidthPixels: 1,
            },
            key: "",
            rotation: [0, 0, 0],
        };

        let currentNode: TestNode = new TestNode(0, {lat: 0, lon: 0}, true, null, currentApiNavImIm, null);

        waitingState.set([previousNode]);
        waitingState.set([currentNode]);

        expect(waitingState.currentCamera.position.x).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.position.y).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.position.z).toBeCloseTo(0, precision);

        let lookat: THREE.Vector3 = camera.lookat.clone().sub(camera.position);

        expect(waitingState.currentCamera.lookat.x).toBeCloseTo(lookat.x, precision);
        expect(waitingState.currentCamera.lookat.y).toBeCloseTo(lookat.y, precision);
        expect(waitingState.currentCamera.lookat.z).toBeCloseTo(lookat.z, precision);
    });
});

describe("WaitingState.previousCamera.lookat", () => {
    let precision: number = 1e-8;

    it("should correspond to current node camera when previous node not set", () => {
        let camera: Camera = new Camera();
        camera.position.fromArray([10, 10, 0]);
        camera.lookat.fromArray([15, 15, 0]);

        let state: IState = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lon: 0 },
            trajectory: [],
            zoom: 0,
        };

        let waitingState: TestWaitingState = new TestWaitingState(state);

        let apiNavImIm: IAPINavImIm = { calt: 0, key: "", rotation: [0, 0, 0] };
        let node: TestNode = new TestNode(0, {lat: 0, lon: 0}, true, null, apiNavImIm, null);

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

        let state: IState = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lon: 0 },
            trajectory: [],
            zoom: 0,
        };

        let waitingState: TestWaitingState = new TestWaitingState(state);

        let previousApiNavImIm: IAPINavImIm = { calt: 0, key: "", rotation: [0, 0, 0] };
        let previousNode: TestNode = new TestNode(0, {lat: 0, lon: 0}, true, null, previousApiNavImIm, null);

        let currentApiNavImIm: IAPINavImIm = { calt: 0, key: "", rotation: [Math.PI, 0, 0] };

        let currentNode: TestNode = new TestNode(0, {lat: 0, lon: 0}, true, null, currentApiNavImIm, null);

        waitingState.set([previousNode]);
        waitingState.set([currentNode]);

        expect(waitingState.previousCamera.position.x).toBeCloseTo(0, precision);
        expect(waitingState.previousCamera.position.y).toBeCloseTo(0, precision);
        expect(waitingState.previousCamera.position.z).toBeCloseTo(0, precision);

        expect(waitingState.previousCamera.lookat.x).toBeCloseTo(0, precision);
        expect(waitingState.previousCamera.lookat.y).toBeCloseTo(0, precision);
        expect(waitingState.previousCamera.lookat.z).toBeGreaterThan(0);
    });

    it("should correspond to lookat of camera when pano and previous node set", () => {
        let camera: Camera = new Camera();
        camera.position.fromArray([10, 10, 0]);
        camera.lookat.fromArray([15, 15, 0]);

        let state: IState = {
            alpha: 1,
            camera: camera,
            currentIndex: -1,
            reference: { alt: 0, lat: 0, lon: 0 },
            trajectory: [],
            zoom: 0,
        };

        let waitingState: TestWaitingState = new TestWaitingState(state);

        let previousApiNavImIm: IAPINavImIm = {
                calt: 0,
                gpano: {
                CroppedAreaImageHeightPixels: 1,
                CroppedAreaImageWidthPixels: 1,
                CroppedAreaLeftPixels: 0,
                CroppedAreaTopPixels: 0.5,
                FullPanoHeightPixels: 1,
                FullPanoWidthPixels: 1,
            },
            key: "",
            rotation: [0, 0, 0],
        };
        let previousNode: TestNode = new TestNode(0, {lat: 0, lon: 0}, true, null, previousApiNavImIm, null);

        let currentApiNavImIm: IAPINavImIm = { calt: 0, key: "", rotation: [Math.PI, 0, 0] };
        let currentNode: TestNode = new TestNode(0, {lat: 0, lon: 0}, true, null, currentApiNavImIm, null);

        waitingState.set([previousNode]);
        waitingState.set([currentNode]);

        expect(waitingState.currentCamera.position.x).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.position.y).toBeCloseTo(0, precision);
        expect(waitingState.currentCamera.position.z).toBeCloseTo(0, precision);

        let lookat: THREE.Vector3 = camera.lookat.clone().sub(camera.position);

        expect(waitingState.currentCamera.lookat.x).toBeCloseTo(lookat.x, precision);
        expect(waitingState.currentCamera.lookat.y).toBeCloseTo(lookat.y, precision);
        expect(waitingState.currentCamera.lookat.z).toBeCloseTo(lookat.z, precision);
    });
});
