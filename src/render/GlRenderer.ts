/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {IFrame} from "../State";
import {Camera} from "../Geo";

export enum RenderStage {
    BACKGROUND,
    FOREGROUND
}

export interface IRenderFunction extends Function {
    (
        alpha: number,
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer
    ): void;
}

export interface IRender {
    frameId: number;
    needsRender: boolean;
    render: IRenderFunction;
    stage: RenderStage;
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
    lastCamera: Camera;
    needsRender: boolean;
    perspective: THREE.PerspectiveCamera;
}

interface ICameraRender {
    camera: ICamera;
    hashes: IRenderHashes;
}

interface ICameraOperation {
    (camera: ICamera): ICamera;
}

interface IRenderHashesOperation extends Function {
    (hashes: IRenderHashes): IRenderHashes;
}

export class GlRenderer {
    private element: HTMLElement;

    private _frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();
    private _cameraOperation$: rx.Subject<ICameraOperation> = new rx.Subject<ICameraOperation>();
    private _camera$: rx.Observable<ICamera>;

    private _render$: rx.Subject<IRenderHash> = new rx.Subject<IRenderHash>();
    private _clear$: rx.Subject<string> = new rx.Subject<string>();
    private _renderOperation$: rx.Subject<IRenderHashesOperation> = new rx.Subject<IRenderHashesOperation>();
    private _renderCollection$: rx.Observable<IRenderHashes>;

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

        this._camera$ = this._cameraOperation$
            .scan<ICamera>(
                (camera: ICamera, operation: ICameraOperation): ICamera => {
                    return operation(camera);
                },
                {
                    alpha: 0,
                    frameId: 0,
                    lastCamera: new Camera(),
                    needsRender: false,
                    perspective: new THREE.PerspectiveCamera(50, 4 / 3, 0.4, 10000),
                });

        this._frame$
            .map<ICameraOperation>((frame: IFrame) => {
                return (camera: ICamera): ICamera => {
                    camera.frameId = frame.id;

                    let current: Camera = frame.state.camera;

                    if (camera.alpha === frame.state.alpha &&
                        camera.lastCamera.diff(current) < 0.00001) {
                        camera.needsRender = false;

                        return camera;
                    }

                    let aspect: number = 4 / 3;
                    let verticalFov: number = 2 * Math.atan(0.5 / aspect / current.focal) * 180 / Math.PI;

                    camera.perspective.fov = verticalFov;
                    camera.perspective.updateProjectionMatrix();

                    camera.perspective.up.copy(current.up);
                    camera.perspective.position.copy(current.position);
                    camera.perspective.lookAt(current.lookat);

                    camera.alpha = frame.state.alpha;
                    camera.lastCamera.copy(current);
                    camera.needsRender = true;

                    return camera;
                };
            })
            .subscribe(this._cameraOperation$);

        rx.Observable.combineLatest(
                this._camera$,
                this._renderCollection$,
                (camera: ICamera, hashes: IRenderHashes): ICameraRender => {
                    return { camera: camera, hashes: hashes };
                })
            .filter((cameraRender: ICameraRender) => {
                if (!Object.keys(cameraRender.hashes).length) {
                    return false;
                }

                let needsRender: boolean = cameraRender.camera.needsRender;
                let frameId: number = cameraRender.camera.frameId;

                for (let k in cameraRender.hashes) {
                    if (!cameraRender.hashes.hasOwnProperty(k)) {
                        continue;
                    }

                    if (cameraRender.hashes[k].frameId !== frameId) {
                        return false;
                    }

                    needsRender = needsRender || cameraRender.hashes[k].needsRender;
                }

                return needsRender;
            })
            .scan<THREE.WebGLRenderer>(
                (renderer: THREE.WebGLRenderer, cameraRender: ICameraRender): THREE.WebGLRenderer => {
                    let alpha: number = cameraRender.camera.alpha;
                    let perspectiveCamera: THREE.PerspectiveCamera = cameraRender.camera.perspective;

                    let backgroundRenders: IRenderFunction[] = [];
                    let foregroundRenders: IRenderFunction[] = [];

                    for (let k in cameraRender.hashes) {
                        if (!cameraRender.hashes.hasOwnProperty(k)) {
                            continue;
                        }

                        let hash: IRender = cameraRender.hashes[k];
                        if (hash.stage === RenderStage.BACKGROUND) {
                            backgroundRenders.push(hash.render);
                        } else if (hash.stage === RenderStage.FOREGROUND) {
                            foregroundRenders.push(hash.render);
                        }
                    }

                    renderer.autoClear = false;
                    renderer.clear();

                    for (let render of backgroundRenders) {
                        render(alpha, perspectiveCamera, renderer);
                    }

                    renderer.clearDepth();

                    for (let render of foregroundRenders) {
                        render(alpha, perspectiveCamera, renderer);
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
