import * as THREE from "three";

import {
    Camera,
    Spatial,
    Transform,
    ViewportCoords,
    Geo,
} from "../Geo";
import {
    RenderMode,
    ISize,
} from "../Render";
import {
    IRotation,
    IFrame,
    State,
} from "../State";
import { ICurrentState } from "../state/interfaces/interfaces";

export class RenderCamera {
    private _spatial: Spatial;
    private _viewportCoords: ViewportCoords;

    private _alpha: number;
    private _renderMode: RenderMode;
    private _zoom: number;
    private _frameId: number;

    private _camera: Camera;
    private _perspective: THREE.PerspectiveCamera;

    private _rotation: IRotation;

    private _changed: boolean;
    private _changedForFrame: number;

    private _currentNodeId: string;
    private _previousNodeId: string;

    private _currentPano: boolean;
    private _previousPano: boolean;

    private _state: State;

    private _currentProjectedPoints: number[][];
    private _previousProjectedPoints: number[][];

    private _currentFov: number;
    private _previousFov: number;

    private _initialFov: number;

    constructor(elementWidth: number, elementHeight: number, renderMode: RenderMode) {
        this._spatial = new Spatial();
        this._viewportCoords = new ViewportCoords();

        this._initialFov = 50;

        this._alpha = -1;
        this._renderMode = renderMode;
        this._zoom = 0;

        this._frameId = -1;

        this._changed = false;
        this._changedForFrame = -1;

        this._currentNodeId = null;
        this._previousNodeId = null;

        this._currentPano = false;
        this._previousPano = false;

        this._state = null;

        this._currentProjectedPoints = [];
        this._previousProjectedPoints = [];

        this._currentFov = this._initialFov;
        this._previousFov = this._initialFov;

        this._camera = new Camera();

        this._perspective = new THREE.PerspectiveCamera(
            this._initialFov,
            this._computeAspect(elementWidth, elementHeight),
            0.16,
            10000);

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

    public get rotation(): IRotation {
        return this._rotation;
    }

    public get zoom(): number {
        return this._zoom;
    }

    public getTilt(): number {
        return 90 - this._spatial.radToDeg(this._rotation.theta);
    }

    public fovToZoom(fov: number): number {
        fov = Math.min(90, Math.max(0, fov));

        const currentFov: number = this._computeCurrentFov(0);
        const actualFov: number = this._alpha === 1 ?
            currentFov :
            this._interpolateFov(currentFov, this._computePreviousFov(0), this._alpha);

        const y0: number = Math.tan(actualFov / 2 * Math.PI / 180);
        const y1: number = Math.tan(fov / 2 * Math.PI / 180);

        const zoom: number = Math.log(y0 / y1) / Math.log(2);

        return zoom;
    }

    public setFrame(frame: IFrame): void {
        const state: ICurrentState = frame.state;

        if (state.state !== this._state) {
            this._state = state.state;

            this._changed = true;
        }

        const currentNodeId: string = state.currentNode.key;
        const previousNodeId: string = !!state.previousNode ? state.previousNode.key : null;

        if (currentNodeId !== this._currentNodeId) {
            this._currentNodeId = currentNodeId;
            this._currentPano = !!state.currentTransform.gpano;
            this._currentProjectedPoints = this._computeProjectedPoints(state.currentTransform);

            this._changed = true;
        }

        if (previousNodeId !== this._previousNodeId) {
            this._previousNodeId = previousNodeId;
            this._previousPano = !!state.previousTransform.gpano;
            this._previousProjectedPoints = this._computeProjectedPoints(state.previousTransform);

            this._changed = true;
        }

        const zoom: number = state.zoom;

        if (zoom !== this._zoom) {
            this._zoom = zoom;

            this._changed = true;
        }

        if (this._changed) {
            this._currentFov = this._computeCurrentFov(this.zoom);
            this._previousFov = this._computePreviousFov(this._zoom);
        }

        const alpha: number = state.alpha;

        if (this._changed || alpha !== this._alpha) {
            this._alpha = alpha;

            this._perspective.fov = this._state === State.Earth ?
                60 :
                this._interpolateFov(
                    this._currentFov,
                    this._previousFov,
                    this._alpha);

            this._changed = true;
        }

        const camera: Camera = state.camera;

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

        if (this._changed) {
            this._perspective.updateProjectionMatrix();
        }

        this._setFrameId(frame.id);
    }

    public setRenderMode(renderMode: RenderMode): void {
        this._renderMode = renderMode;

        this._perspective.fov = this._computeFov();
        this._perspective.updateProjectionMatrix();

        this._changed = true;
    }

    public setSize(size: ISize): void {
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

        if (!this._currentNodeId) {
            return this._initialFov;
        }

        return this._currentPano ?
            this._yToFov(1, zoom) :
            this._computeVerticalFov(this._currentProjectedPoints, this._renderMode, zoom, this.perspective.aspect);
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

        if (!this._currentNodeId) {
            return this._initialFov;
        }

        return !this._previousNodeId ?
            this._currentFov :
            this._previousPano ?
                this._yToFov(1, zoom) :
                this._computeVerticalFov(this._previousProjectedPoints, this._renderMode, zoom, this.perspective.aspect);
    }

    private _computeProjectedPoints(transform: Transform): number[][] {
        const vertices: number[][] = [[0.5, 0], [1, 0]];
        const directions: number[][] = [[0.5, 0], [0, 0.5]];
        const pointsPerLine: number = 100;

        return Geo.computeProjectedPoints(transform, vertices, directions, pointsPerLine, this._viewportCoords);
    }

    private _computeRequiredVerticalFov(projectedPoint: number[], zoom: number, aspect: number): number {
        const maxY: number = Math.max(projectedPoint[0] / aspect, projectedPoint[1]);

        return this._yToFov(maxY, zoom);
    }

    private _computeRotation(camera: Camera): IRotation {
        let direction: THREE.Vector3 = camera.lookat.clone().sub(camera.position);
        let up: THREE.Vector3 = camera.up.clone();

        let phi: number = this._spatial.azimuthal(direction.toArray(), up.toArray());
        let theta: number = Math.PI / 2 - this._spatial.angleToPlane(direction.toArray(), [0, 0, 1]);

        return { phi: phi, theta: theta };
    }

    private _computeVerticalFov(projectedPoints: number[][], renderMode: RenderMode, zoom: number, aspect: number): number {
        const fovs: number[] = projectedPoints
            .map(
                (projectedPoint: number[]): number => {
                    return this._computeRequiredVerticalFov(projectedPoint, zoom, aspect);
                });

        const fov: number = renderMode === RenderMode.Fill ?
            Math.min(...fovs) * 0.995 :
            Math.max(...fovs);

        return fov;
    }

    private _yToFov(y: number, zoom: number): number {
        return 2 * Math.atan(y / Math.pow(2, zoom)) * 180 / Math.PI;
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

export default RenderCamera;
