/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {
    Camera,
    Spatial,
} from "../Geo";
import {RenderMode} from "../Render";
import {IRotation} from "../State";

export class RenderCamera {
    public alpha: number;
    public zoom: number;
    public currentAspect: number;
    public currentPano: boolean;
    public previousAspect: number;
    public previousPano: boolean;
    public renderMode: RenderMode;

    private _spatial: Spatial;

    private _camera: Camera;
    private _perspective: THREE.PerspectiveCamera;
    private _rotation: IRotation;

    private _frameId: number;

    private _changed: boolean;
    private _changedForFrame: number;

    constructor(perspectiveCameraAspect: number, renderMode: RenderMode) {
        this.alpha = -1;
        this.zoom = 0;

        this._frameId = -1;

        this._changed = false;
        this._changedForFrame = -1;

        this.currentAspect = 1;
        this.currentPano = false;
        this.previousAspect = 1;
        this.previousPano = false;

        this.renderMode = renderMode;

        this._spatial = new Spatial();

        this._camera = new Camera();
        this._perspective = new THREE.PerspectiveCamera(
            50,
            perspectiveCameraAspect,
            0.4,
            10000);

        this._perspective.matrixAutoUpdate = false;

        this._rotation = { phi: 0, theta: 0 };
    }

    public get camera(): Camera {
        return this._camera;
    }

    public get changed(): boolean {
        return this.frameId === this._changedForFrame;
    }

    public get frameId(): number {
        return this._frameId;
    }

    public set frameId(value: number) {
        this._frameId = value;

        if (this._changed) {
            this._changed = false;
            this._changedForFrame = value;
        }
    }

    public get perspective(): THREE.PerspectiveCamera {
        return this._perspective;
    }

    public get rotation(): IRotation {
        return this._rotation;
    }

    public updateProjection(): void {
        let currentAspect: number = this._getAspect(
            this.currentAspect,
            this.currentPano,
            this.perspective.aspect);

        let previousAspect: number = this._getAspect(
            this.previousAspect,
            this.previousPano,
            this.perspective.aspect);

        let aspect: number = (1 - this.alpha) * previousAspect + this.alpha * currentAspect;

        let verticalFov: number = this._getVerticalFov(aspect, this._camera.focal, this.zoom);

        this._perspective.fov = verticalFov;
        this._perspective.updateProjectionMatrix();

        this._changed = true;
    }

    public updatePerspective(camera: Camera): void {
        this._perspective.up.copy(camera.up);
        this._perspective.position.copy(camera.position);
        this._perspective.lookAt(camera.lookat);

        this._perspective.updateMatrix();
        this._perspective.updateMatrixWorld(false);

        this._changed = true;
    }

    public updateRotation(camera: Camera): void {
        this._rotation = this._getRotation(camera);
    }

    private _getVerticalFov(aspect: number, focal: number, zoom: number): number {
        return 2 * Math.atan(0.5 / (Math.pow(2, zoom) * aspect * focal)) * 180 / Math.PI;
    }

    private _getAspect(
        nodeAspect: number,
        pano: boolean,
        perspectiveCameraAspect: number): number {

        if (pano) {
            return 1;
        }

        let coeff: number = Math.max(1, 1 / nodeAspect);

        let usePerspective: boolean = this.renderMode === RenderMode.Letterbox ?
            nodeAspect > perspectiveCameraAspect :
            nodeAspect < perspectiveCameraAspect;

        let aspect: number = usePerspective ?
            coeff * perspectiveCameraAspect :
            coeff * nodeAspect;

        return aspect;
    }

    private _getRotation(camera: Camera): IRotation {
        let direction: THREE.Vector3 = camera.lookat.clone().sub(camera.position);
        let up: THREE.Vector3 = camera.up.clone();

        let upProjection: number = direction.clone().dot(up);
        let planeProjection: THREE.Vector3 = direction.clone().sub(up.clone().multiplyScalar(upProjection));

        let phi: number = Math.atan2(planeProjection.y, planeProjection.x);
        let theta: number = Math.PI / 2 - this._spatial.angleToPlane(direction.toArray(), [0, 0, 1]);

        return { phi: phi, theta: theta };
    }
}

export default RenderCamera;
