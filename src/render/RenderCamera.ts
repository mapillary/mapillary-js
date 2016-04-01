/// <reference path="../../typings/browser.d.ts" />

import * as THREE from "three";

import {Camera} from "../Geo";
import {RenderMode} from "../Render";

export class RenderCamera {
    public frameId: number;
    public alpha: number;
    public currentAspect: number;
    public currentOrientation: number;
    public currentPano: boolean;
    public previousAspect: number;
    public previousOrientation: number;
    public previousPano: boolean;
    public renderMode: RenderMode;

    private _camera: Camera;
    private _perspective: THREE.PerspectiveCamera;

    constructor(perspectiveCameraAspect: number, renderMode: RenderMode) {
        this.frameId = -1;
        this.alpha = -1;

        this.currentAspect = 1;
        this.currentOrientation = 1;
        this.currentPano = false;
        this.previousAspect = 1;
        this.previousOrientation = 1;
        this.previousPano = false;

        this.renderMode = renderMode;

        this._camera = new Camera();
        this._perspective = new THREE.PerspectiveCamera(
            50,
            perspectiveCameraAspect,
            0.4,
            10000);
    }

    public get perspective(): THREE.PerspectiveCamera {
        return this._perspective;
    }

    public get camera(): Camera {
        return this._camera;
    }

    public updateProjection(): void {
        let currentAspect: number = this._getAspect(
            this.currentAspect,
            this.currentOrientation,
            this.currentPano,
            this.perspective.aspect);

        let previousAspect: number = this._getAspect(
            this.previousAspect,
            this.previousOrientation,
            this.previousPano,
            this.perspective.aspect);

        let aspect: number = (1 - this.alpha) * previousAspect + this.alpha * currentAspect;

        let verticalFov: number = this._getVerticalFov(aspect, this._camera.focal);

        this._perspective.fov = verticalFov;
        this._perspective.updateProjectionMatrix();
    }

    public updatePerspective(camera: Camera): void {
        this._perspective.up.copy(camera.up);
        this._perspective.position.copy(camera.position);
        this._perspective.lookAt(camera.lookat);
    }

    private _getVerticalFov(aspect: number, focal: number): number {
        return 2 * Math.atan(0.5 / aspect / focal) * 180 / Math.PI;
    }

    private _getAspect(
        nodeAspect: number,
        orientation: number,
        pano: boolean,
        perspectiveCameraAspect: number): number {

        if (pano) {
            return 4 / 3 > perspectiveCameraAspect ? perspectiveCameraAspect : 4 / 3;
        }

        let coeff: number = orientation < 5 ?
            1 :
            1 / nodeAspect / nodeAspect;

        let usePerspective: boolean = this.renderMode === RenderMode.Letterbox ?
            nodeAspect > perspectiveCameraAspect :
            nodeAspect < perspectiveCameraAspect;

        let aspect: number = usePerspective ?
            coeff * perspectiveCameraAspect :
            coeff * nodeAspect;

        return aspect;
    }
}

export default RenderCamera;
