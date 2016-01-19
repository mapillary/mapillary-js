/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {ICurrentState} from "../State";
import {Camera} from "../Geo";

export interface IRenderFunction extends Function {
    (
        alpha: number,
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer
    ): void;
}

interface ICamera {
    alpha: number;
    perspective: THREE.PerspectiveCamera;
}

interface ICameraRender {
    cam: ICamera;
    render: IRenderFunction;
}

export class GlRenderer {
    private element: HTMLElement;

    private _updateCamera$: rx.Subject<ICurrentState> = new rx.Subject<ICurrentState>();
    private _render$: rx.Subject<IRenderFunction> = new rx.Subject<IRenderFunction>();

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
                (cam: ICamera, state: ICurrentState): ICamera => {
                    let current: Camera = state.camera;

                    let aspect: number = 4 / 3;
                    let verticalFov: number = 2 * Math.atan(0.5 / aspect / current.focal) * 180 / Math.PI;

                    cam.perspective.fov = verticalFov;
                    cam.perspective.updateProjectionMatrix();

                    cam.perspective.up.copy(current.up);
                    cam.perspective.position.copy(current.position);
                    cam.perspective.lookAt(current.lookat);

                    cam.alpha = state.alpha;

                    return cam;
                },
                { alpha: 0, perspective: new THREE.PerspectiveCamera(50, 4 / 3, 0.4, 10000) }
            )
            .combineLatest(
                this._render$,
                (cam: ICamera, render: IRenderFunction): ICameraRender => {
                    return { cam: cam, render: render };
                })
            .scan<THREE.WebGLRenderer>(
                (renderer: THREE.WebGLRenderer, camRender: ICameraRender): THREE.WebGLRenderer => {
                    let alpha: number = camRender.cam.alpha;
                    let perspectiveCamera: THREE.PerspectiveCamera = camRender.cam.perspective;
                    let render: IRenderFunction = camRender.render;

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

    public get updateCamera$(): rx.Subject<ICurrentState> {
        return this._updateCamera$;
    }

    public get render$(): rx.Subject<IRenderFunction> {
        return this._render$;
    }
}

export default GlRenderer;
