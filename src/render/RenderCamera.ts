import * as THREE from "three";

import * as Geo from "../geo/Geo";

import { RenderMode } from "./RenderMode";
import { ViewportSize } from "./interfaces/ViewportSize";

import { Camera } from "../geo/Camera";
import { Spatial } from "../geo/Spatial";
import { Transform } from "../geo/Transform";
import { ViewportCoords } from "../geo/ViewportCoords";
import { State } from "../state/State";
import { AnimationFrame } from "../state/interfaces/AnimationFrame";
import { EulerRotation } from "../state/interfaces/EulerRotation";
import { isSpherical } from "../geo/Geo";
import { MathUtils, Vector3 } from "three";

export class RenderCamera {
    private _spatial: Spatial;
    private _viewportCoords: ViewportCoords;

    private _alpha: number;
    private _stateTransitionAlpha: number;
    private _stateTransitionFov: number;
    private _renderMode: RenderMode;
    private _zoom: number;
    private _frameId: number;

    private _size: ViewportSize;

    private _camera: Camera;
    private _perspective: THREE.PerspectiveCamera;

    private _rotation: EulerRotation;

    private _changed: boolean;
    private _changedForFrame: number;

    private _currentImageId: string;
    private _previousImageId: string;

    private _currentSpherical: boolean;
    private _previousSpherical: boolean;

    private _state: State;

    private _currentBearings: {x: number[][], y: number[][]};
    private _previousBearings: {x: number[][], y: number[][]};

    private _currentFov: number;
    private _previousFov: number;

    private _currentCameraUp: Vector3;
    private _previousCameraUp: Vector3;

    private _currentTransformUp: Vector3;
    private _previousTransformUp: Vector3;

    private _currentTransformForward: Vector3;
    private _previousTransformForward: Vector3;

    private _initialFov: number;

    constructor(
        elementWidth: number,
        elementHeight: number,
        renderMode: RenderMode) {

        this._spatial = new Spatial();
        this._viewportCoords = new ViewportCoords();

        this._size = { width: elementWidth, height: elementHeight };

        this._initialFov = 60;

        this._alpha = -1;
        this._stateTransitionAlpha = -1;
        this._stateTransitionFov = -1;
        this._renderMode = renderMode;
        this._zoom = 0;

        this._frameId = -1;

        this._changed = false;
        this._changedForFrame = -1;

        this._currentImageId = null;
        this._previousImageId = null;

        this._currentSpherical = false;
        this._previousSpherical = false;

        this._state = null;

        this._currentBearings = {x: [], y: []};
        this._previousBearings = {x: [], y: []};

        this._currentFov = this._initialFov;
        this._previousFov = this._initialFov;

        this._camera = new Camera();

        this._currentCameraUp = new Vector3();
        this._previousCameraUp = new Vector3();

        this._currentTransformUp = new Vector3();
        this._previousTransformUp = new Vector3();

        this._currentTransformForward = new Vector3();
        this._previousTransformForward = new Vector3();

        this._perspective = new THREE.PerspectiveCamera(
            this._initialFov,
            this._computeAspect(elementWidth, elementHeight),
            1e-1,
            1e4);
        this._perspective.position.copy(this._camera.position);
        this._perspective.up.copy(this._camera.up);
        this._perspective.lookAt(this._camera.lookat);
        this._perspective.updateMatrixWorld(true);

        this._perspective.matrixAutoUpdate = false;

        this._rotation = { phi: 0, theta: 0 };
    }

    public get alpha(): number {
        return this._alpha;
    }

    public get camera(): Camera {
        return this._camera;
    }

    public get changed(): boolean {
        return this._frameId === this._changedForFrame;
    }

    public get frameId(): number {
        return this._frameId;
    }

    public get perspective(): THREE.PerspectiveCamera {
        return this._perspective;
    }

    public get renderMode(): RenderMode {
        return this._renderMode;
    }

    public get rotation(): EulerRotation {
        return this._rotation;
    }

    public get zoom(): number {
        return this._zoom;
    }

    public get size(): ViewportSize {
        return this._size;
    }

    public getTilt(): number {
        return 90 - this._spatial.radToDeg(this._rotation.theta);
    }

    public fovToZoom(fov: number): number {
        fov = Math.min(90, Math.max(0, fov));

        const currentFov = this._computeCurrentFov(0);
        const actualFov = this._alpha === 1 ?
            currentFov :
            this._interpolateFov(
                currentFov,
                this._computePreviousFov(0),
                this._alpha);

        const y0 = Math.tan(actualFov / 2 * Math.PI / 180);
        const y1 = Math.tan(fov / 2 * Math.PI / 180);

        const zoom = Math.log(y0 / y1) / Math.log(2);

        return zoom;
    }

    public setFrame(frame: AnimationFrame): void {
        const state = frame.state;

        if (state.state !== this._state) {
            this._state = state.state;
            if (this._state !== State.Custom) {
                this.setRenderMode(this._renderMode);
                this.setSize(this._size);
            }
            if (this._state === State.Earth) {
                this._stateTransitionFov = this._zoomedFovToFov(this._perspective.fov, this._zoom);
            }

            this._changed = true;
        }

        const currentImageId = state.currentImage.id;
        const previousImageId = !!state.previousImage ? state.previousImage.id : null;

        if (currentImageId !== this._currentImageId || this._changed) {
            this._currentImageId = currentImageId;
            this._currentSpherical = isSpherical(state.currentTransform.cameraType);
            this._currentBearings = this._computeBearings(state.currentTransform);
            this._currentCameraUp.copy(state.currentCamera.up);
            this._currentTransformUp.copy(state.currentTransform.upVector());
            this._currentTransformForward.copy(
                new Vector3().fromArray(
                    state.currentTransform.unprojectSfM([0, 0], 10))
                    .sub(
                        new Vector3().fromArray(
                            state.currentTransform.
                                unprojectSfM([0, 0], 0))));

            this._changed = true;
        }

        if (previousImageId !== this._previousImageId) {
            this._previousImageId = previousImageId;
            this._previousSpherical =
                isSpherical(state.previousTransform.cameraType);
            this._previousBearings = this._computeBearings(state.previousTransform);
            this._previousCameraUp.copy(state.previousCamera.up);
            this._previousTransformUp.copy(state.previousTransform.upVector());
            this._previousTransformForward.copy(
                new Vector3().fromArray(
                    state.previousTransform.unprojectSfM([0, 0], 10))
                    .sub(
                        new Vector3().fromArray(
                            state.previousTransform.
                                unprojectSfM([0, 0], 0))));

            this._changed = true;
        }

        const zoom = state.zoom;
        if (zoom !== this._zoom) {
            this._changed = true;
        }

        const camera = state.camera;

        if (this._changed) {
            this._currentFov = this._computeCurrentFov(zoom);
            this._previousFov = this._computePreviousFov(zoom);
        }

        const alpha = state.alpha;
        const sta = state.stateTransitionAlpha;
        if (this._changed ||
            alpha !== this._alpha ||
            sta !== this._stateTransitionAlpha) {

            this._alpha = alpha;
            this._stateTransitionAlpha = sta;

            switch (this._state) {
                case State.Earth: {
                    const startFov = this._stateTransitionFov;
                    const endFov = this._focalToFov(state.camera.focal);
                    const fov = MathUtils.lerp(startFov, endFov, sta);
                    this._perspective.fov = this._fovToZoomedFov(fov, zoom);
                    break;
                }
                case State.Custom:
                    break;
                default:
                    this._perspective.fov =
                        this._interpolateFov(
                            this._currentFov,
                            this._previousFov,
                            this._alpha);
                    this._changed = true;
                    break;
            }

            this._zoom = zoom;

            if (this._state !== State.Custom) {
                this._perspective.updateProjectionMatrix();
            }
        }

        if (this._camera.diff(camera) > 1e-9) {
            this._camera.copy(camera);

            this._rotation = this._computeRotation(camera);

            this._perspective.up.copy(camera.up);
            this._perspective.position.copy(camera.position);

            // Workaround for shaking camera
            this._perspective.matrixAutoUpdate = true;
            this._perspective.lookAt(camera.lookat);
            this._perspective.matrixAutoUpdate = false;

            this._perspective.updateMatrix();
            this._perspective.updateMatrixWorld(false);

            this._changed = true;
        }

        this._setFrameId(frame.id);
    }

    public setProjectionMatrix(matrix: number[]): void {
        this._perspective.fov = this._focalToFov(matrix[5] / 2);
        this._perspective.projectionMatrix.fromArray(matrix);
        this._perspective.projectionMatrixInverse
            .copy(this._perspective.projectionMatrix)
            .invert();

        this._changed = true;
    }

    public setRenderMode(renderMode: RenderMode): void {
        this._renderMode = renderMode;

        if (this._state === State.Custom) {
            return;
        }

        this._perspective.fov = this._computeFov();
        this._perspective.updateProjectionMatrix();

        this._changed = true;
    }

    public setSize(size: ViewportSize): void {
        this._size = size;

        if (this._state === State.Custom) {
            return;
        }

        this._perspective.aspect = this._computeAspect(size.width, size.height);
        this._perspective.fov = this._computeFov();
        this._perspective.updateProjectionMatrix();

        this._changed = true;
    }

    private _computeAspect(elementWidth: number, elementHeight: number): number {
        return elementWidth === 0 ? 0 : elementWidth / elementHeight;
    }

    private _computeCurrentFov(zoom: number): number {
        if (this._perspective.aspect === 0) {
            return 0;
        }

        if (!this._currentImageId) {
            return this._initialFov;
        }

        return this._currentSpherical ?
            this._fovToZoomedFov(90, zoom) :
            this._computeVerticalBearingFov(
                this._currentBearings,
                this._renderMode,
                zoom,
                this.perspective.aspect);
    }

    private _computeFov(): number {
        this._currentFov = this._computeCurrentFov(this._zoom);
        this._previousFov = this._computePreviousFov(this._zoom);

        return this._interpolateFov(this._currentFov, this._previousFov, this._alpha);
    }

    private _computePreviousFov(zoom: number): number {
        if (this._perspective.aspect === 0) {
            return 0;
        }

        if (!this._currentImageId) {
            return this._initialFov;
        }

        return !this._previousImageId ?
            this._currentFov :
            this._previousSpherical ?
                this._fovToZoomedFov(90, zoom) :
                this._computeVerticalBearingFov(
                    this._previousBearings,
                    this._renderMode,
                    zoom,
                    this.perspective.aspect);
    }

    private _computeBearings(transform: Transform): {x: number[][], y: number[][]} {
        const yVertices = [[0, 0]];
        const yDirections = [[1, 0]];
        const yPointsPerLine = 25;

        const y = Geo.computeBearings(
            transform,
            yVertices,
            yDirections,
            yPointsPerLine,
            this._viewportCoords);

        const xVertices = [[0, 0]];
        const xDirections = [[0, 1]];
        const xPointsPerLine = 25;

        const x = Geo.computeBearings(
            transform,
            xVertices,
            xDirections,
            xPointsPerLine,
            this._viewportCoords);

        return {x: x, y: y};
    }

    private _computeRotation(camera: Camera): EulerRotation {
        let direction: THREE.Vector3 = camera.lookat.clone().sub(camera.position);
        let up: THREE.Vector3 = camera.up.clone();

        let phi = this._spatial.azimuthal(direction.toArray(), up.toArray());
        let theta = Math.PI / 2 - this._spatial.angleToPlane(direction.toArray(), [0, 0, 1]);

        return { phi: phi, theta: theta };
    }

    private _computeVerticalBearingFov(
        bearings: {x: number[][], y: number[][]},
        renderMode: RenderMode,
        zoom: number,
        aspect: number): number {

        const {_spatial} = this;

        const yProjections = bearings.y
            .filter(b => b[1] > 0)
            .map(b => _spatial.projectToPlane(b, [1, 0, 0]))
            .map(p => [p[1], -p[2]]);

        const xProjections = bearings.x
            .filter(b => b[0] < 0)
            .map(b => _spatial.projectToPlane(b, [0, 1, 0]))
            .map(p => [p[0], -p[2]]);

        const yFovs = yProjections.map(p => 2 * _spatial.radToDeg(Math.abs(Math.atan2(p[0], p[1]))));
        const xFovs = xProjections.map(p => 2 * _spatial.radToDeg(Math.abs(Math.atan2(p[0] / aspect, p[1]))));
        const fovs = [...yFovs, ...xFovs];

        const vFovMin = fovs.length > 0 ? 0.995 * Math.min(...fovs) : 125;
        const fovMin = this._fovToZoomedFov(vFovMin, zoom);
        const fovMax = this._fovToZoomedFov(125, zoom);
        const vFovFill = Math.min(fovMin, fovMax);
        if (renderMode === RenderMode.Fill) {
            return vFovFill;
        }

        const vFovLetterbox = Math.max(...fovs);
        const hFovLetterbox = aspect * vFovLetterbox;

        const fovCoeff = 1.25;
        const hFovFill = aspect * vFovFill;
        const hFovMax = fovCoeff * hFovFill;

        let vFov = vFovLetterbox;
        if (hFovLetterbox > hFovMax) {
            vFov *= hFovMax / hFovLetterbox;
        }

        const vFovMax = fovCoeff * vFovFill;
        vFov = Math.min(vFov, vFovMax, fovMax);
        vFov = Math.max(vFov, vFovFill);

        return vFov;
    }

    private _fovToZoomedFov(fov: number, zoom: number): number {
       return fov / Math.pow(2, zoom);
    }

    private _zoomedFovToFov(zoomedFov: number, zoom: number): number {
        return Math.pow(2, zoom) * zoomedFov;
     }

    private _focalToFov(focal: number): number {
        return 2 * Math.atan2(1, 2 * focal) * 180 / Math.PI;
    }

    private _interpolateFov(v1: number, v2: number, alpha: number): number {
        return alpha * v1 + (1 - alpha) * v2;
    }

    private _setFrameId(frameId: number): void {
        this._frameId = frameId;

        if (this._changed) {
            this._changed = false;
            this._changedForFrame = frameId;
        }
    }
}
