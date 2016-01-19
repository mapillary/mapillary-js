/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {IFrame} from "../State";
import {Camera} from "../Geo";

export interface IRenderFunction extends Function {
    (
        alpha: number,
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer
    ): void;
}

export interface IRender {
    frameId: number;
    render: IRenderFunction;
}

interface ICamera {
    alpha: number;
    frameId: number;
    perspective: THREE.PerspectiveCamera;
}

interface ICameraRender {
    camera: ICamera;
    render: IRender;
}

export class GlRenderer {
    private element: HTMLElement;

    private _updateCamera$: rx.Subject<IFrame> = new rx.Subject<IFrame>();
    private _render$: rx.Subject<IRender> = new rx.Subject<IRender>();

    constructor (element: HTMLElement) {
        this.element = element;

        let webGLRenderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();

        let width: number = element.offsetWidth;
        webGLRenderer.setSize(width, width * 3 / 4);
        webGLRenderer.setClearColor(new THREE.Color(0x202020), 1.0);
        webGLRenderer.sortObjects = false;

        webGLRenderer.domElement.style.width = "100%";
        webGLRenderer.domElement.style.height = "100%";
        element.appendChild(webGLRenderer.domElement);

        this._updateCamera$
            .scan<ICamera>(
                (cam: ICamera, frame: IFrame): ICamera => {
                    let current: Camera = frame.state.camera;

                    let aspect: number = 4 / 3;
                    let verticalFov: number = 2 * Math.atan(0.5 / aspect / current.focal) * 180 / Math.PI;

                    cam.perspective.fov = verticalFov;
                    cam.perspective.updateProjectionMatrix();

                    cam.perspective.up.copy(current.up);
                    cam.perspective.position.copy(current.position);
                    cam.perspective.lookAt(current.lookat);

                    cam.alpha = frame.state.alpha;
                    cam.frameId = frame.id;

                    return cam;
                },
                { alpha: 0, frameId: 0, perspective: new THREE.PerspectiveCamera(50, 4 / 3, 0.4, 10000) }
            )
            .combineLatest(
                this._render$,
                (camera: ICamera, render: IRender): ICameraRender => {
                    return { camera: camera, render: render };
                })
            .filter((cameraRender: ICameraRender) => {
                return cameraRender.camera.frameId === cameraRender.render.frameId;
            })
            .scan<THREE.WebGLRenderer>(
                (renderer: THREE.WebGLRenderer, camRender: ICameraRender): THREE.WebGLRenderer => {
                    let alpha: number = camRender.camera.alpha;
                    let perspectiveCamera: THREE.PerspectiveCamera = camRender.camera.perspective;
                    let render: IRenderFunction = camRender.render.render;

                    renderer.autoClear = false;
                    renderer.clear();
                    render(alpha, perspectiveCamera, renderer);

                    return renderer;
                },
                webGLRenderer
            )
            .publish()
            .connect();
    }

    public get updateCamera$(): rx.Subject<IFrame> {
        return this._updateCamera$;
    }

    public get render$(): rx.Subject<IRender> {
        return this._render$;
    }
}

export default GlRenderer;
