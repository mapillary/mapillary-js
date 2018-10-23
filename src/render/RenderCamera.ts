import * as THREE from "three";

import {
    Camera,
    Spatial,
    Transform,
    ViewportCoords,
} from "../Geo";
import {
    RenderMode,
    ISize,
} from "../Render";
import {
    IRotation,
    IFrame,
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

    public setFrame(frame: IFrame): void {
        const state: ICurrentState = frame.state;

        const currentNodeId: string = state.currentNode.key;
        const previousNodeId: string = !!state.previousNode ? state.previousNode.key : null;

        if (currentNodeId !== this._currentNodeId) {
            this._currentNodeId = currentNodeId;
            this._currentPano = state.currentTransform.fullPano;
            this._currentProjectedPoints = this._computeProjectedPoints(state.currentTransform);

            this._changed = true;
        }

        if (previousNodeId !== this._previousNodeId) {
            this._previousNodeId = previousNodeId;
            this._previousPano = state.previousTransform.fullPano;
            this._previousProjectedPoints = this._computeProjectedPoints(state.previousTransform);

            this._changed = true;
        }

        const zoom: number = state.zoom;

        if (zoom !== this._zoom) {
            this._zoom = zoom;

            this._changed = true;
        }

        if (this._changed) {
            this._currentFov = this._computeCurrentFov();
            this._previousFov = this._computePreviousFov();
        }

        const alpha: number = state.alpha;

        if (this._changed || alpha !== this._alpha) {
            this._alpha = alpha;

            this._perspective.fov = this._interpolateFov(
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
            this._perspective.lookAt(camera.lookat);
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

    private _computeCurrentFov(): number {
        if (!this._currentNodeId) {
            return this._initialFov;
        }

        return this._currentPano ?
            this._yToFov(1, this._zoom) :
            this._computeVerticalFov(this._currentProjectedPoints, this._renderMode, this._zoom, this.perspective.aspect);
    }

    private _computeFov(): number {
        this._currentFov = this._computeCurrentFov();
        this._previousFov = this._computePreviousFov();

        return this._interpolateFov(this._currentFov, this._previousFov, this._alpha);
    }

    private _computePreviousFov(): number {
        if (!this._currentNodeId) {
            return this._initialFov;
        }

        return !this._previousNodeId ?
            this._currentFov :
            this._previousPano ?
                this._yToFov(1, this._zoom) :
                this._computeVerticalFov(this._previousProjectedPoints, this._renderMode, this._zoom, this.perspective.aspect);
    }

    private _computeProjectedPoints(transform: Transform): number[][] {
        const os: number[][] = [[0.5, 0], [1, 0]];
        const ds: number[][] = [[0.5, 0], [0, 0.5]];
        const pointsPerSide: number = 100;

        const basicPoints: number[][] = [];

        for (let side: number = 0; side < os.length; ++side) {
            const o: number[] = os[side];
            const d: number[] = ds[side];

            for (let i: number = 0; i <= pointsPerSide; ++i) {
                basicPoints.push([o[0] + d[0] * i / pointsPerSide,
                                o[1] + d[1] * i / pointsPerSide]);
            }
        }

        const camera: THREE.Camera = new THREE.Camera();
        camera.up.copy(transform.upVector());
        camera.position.copy(new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 0)));
        camera.lookAt(new THREE.Vector3().fromArray(transform.unprojectSfM([0, 0], 10)));
        camera.updateMatrix();
        camera.updateMatrixWorld(true);

        const projectedPoints: number[][] = basicPoints
            .map(
                (basicPoint: number[]): number[] => {
                    const worldPoint: number[] = transform.unprojectBasic(basicPoint, 10000);
                    const cameraPoint: number[] = this._viewportCoords.worldToCamera(worldPoint, camera);

                    return [
                        Math.abs(cameraPoint[0] / cameraPoint[2]),
                        Math.abs(cameraPoint[1] / cameraPoint[2]),
                    ];
                });

        return projectedPoints;
    }

    private _computeRequiredVerticalFov(projectedPoint: number[], zoom: number, aspect: number): number {
        const maxY: number = Math.max(projectedPoint[0] / aspect, projectedPoint[1]);

        return this._yToFov(maxY, zoom);
    }

    private _computeRotation(camera: Camera): IRotation {
        let direction: THREE.Vector3 = camera.lookat.clone().sub(camera.position);
        let up: THREE.Vector3 = camera.up.clone();

        let upProjection: number = direction.clone().dot(up);
        let planeProjection: THREE.Vector3 = direction.clone().sub(up.clone().multiplyScalar(upProjection));

        let phi: number = Math.atan2(planeProjection.y, planeProjection.x);
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
