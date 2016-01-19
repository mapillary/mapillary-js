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

export interface IRenderHash {
    name: string;
    render: IRender;
}

interface IRenderHashes {
    [name: string]: IRender;
}

interface ICamera {
    alpha: number;
    frameId: number;
    perspective: THREE.PerspectiveCamera;
}

interface ICameraRender {
    camera: ICamera;
    hashes: IRenderHashes;
}

interface IRenderHashesOperation extends Function {
    (hashes: IRenderHashes): IRenderHashes;
}

export class GlRenderer {
    private element: HTMLElement;

    private _frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();
    private _render$: rx.Subject<IRenderHash> = new rx.Subject<IRenderHash>();
    private _renderCollection$: rx.Observable<IRenderHashes>;
    private _renderOperation$: rx.Subject<IRenderHashesOperation> = new rx.Subject<IRenderHashesOperation>();
    private _clear$: rx.Subject<string> = new rx.Subject<string>();

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

        this._renderCollection$ = this._renderOperation$
            .scan<IRenderHashes>(
                (hashes: IRenderHashes, operation: IRenderHashesOperation): IRenderHashes => {
                    return operation(hashes);
                },
                {});

        this._render$
            .map<IRenderHashesOperation>((hash: IRenderHash) => {
                return (hashes: IRenderHashes): IRenderHashes => {
                    hashes[hash.name] = hash.render;

                    return hashes;
                };
            })
            .subscribe(this._renderOperation$);

        this._clear$
            .map<IRenderHashesOperation>((name: string) => {
                return (hashes: IRenderHashes): IRenderHashes => {
                    delete hashes[name];

                    return hashes;
                };
            })
            .subscribe(this._renderOperation$);

        this._frame$
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
                this._renderCollection$,
                (camera: ICamera, hashes: IRenderHashes): ICameraRender => {
                    return { camera: camera, hashes: hashes };
                })
            .filter((cameraRender: ICameraRender) => {
                let frameId: number = cameraRender.camera.frameId;

                for (let k in cameraRender.hashes) {
                    if (!cameraRender.hashes.hasOwnProperty(k)) {
                        continue;
                    }

                    if (cameraRender.hashes[k].frameId !== frameId) {
                        return false;
                    }
                }

                return true;
            })
            .scan<THREE.WebGLRenderer>(
                (renderer: THREE.WebGLRenderer, cameraRender: ICameraRender): THREE.WebGLRenderer => {
                    let alpha: number = cameraRender.camera.alpha;
                    let perspectiveCamera: THREE.PerspectiveCamera = cameraRender.camera.perspective;

                    renderer.autoClear = false;
                    renderer.clear();

                    for (let k in cameraRender.hashes) {
                        if (!cameraRender.hashes.hasOwnProperty(k)) {
                            continue;
                        }

                        cameraRender.hashes[k].render(alpha, perspectiveCamera, renderer);
                    }

                    return renderer;
                },
                webGLRenderer
            )
            .publish()
            .connect();
    }

    public get frame$(): rx.Subject<IFrame> {
        return this._frame$;
    }

    public get render$(): rx.Subject<IRenderHash> {
        return this._render$;
    }

    public get clear$(): rx.Subject<string> {
        return this._clear$;
    }
}

export default GlRenderer;
