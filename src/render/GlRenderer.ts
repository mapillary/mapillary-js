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
    aspectRatio: number;
    frameId: number;
    lastCamera: Camera;
    needsRender: boolean;
    perspective: THREE.PerspectiveCamera;
}

interface ICameraRender {
    camera: ICamera;
    hashes: IRenderHashes;
    renderer: IRenderer;
}

interface ICameraOperation {
    (camera: ICamera): ICamera;
}

interface IRenderHashesOperation extends Function {
    (hashes: IRenderHashes): IRenderHashes;
}

interface ISize {
    height: number;
    width: number;
}

interface IRenderer {
    needsRender: boolean;
    renderer: THREE.WebGLRenderer;
}

interface IRendererOperation {
    (renderer: IRenderer): IRenderer;
}

export class GlRenderer {
    private element: HTMLElement;

    private _frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();
    private _resize$: rx.Subject<void> = new rx.Subject<void>();
    private _size$: rx.Observable<ISize>;
    private _cameraOperation$: rx.Subject<ICameraOperation> = new rx.Subject<ICameraOperation>();
    private _camera$: rx.Observable<ICamera>;

    private _render$: rx.Subject<IRenderHash> = new rx.Subject<IRenderHash>();
    private _clear$: rx.Subject<string> = new rx.Subject<string>();
    private _renderOperation$: rx.Subject<IRenderHashesOperation> = new rx.Subject<IRenderHashesOperation>();
    private _renderCollection$: rx.Observable<IRenderHashes>;

    private _rendererOperation$: rx.Subject<IRendererOperation> = new rx.Subject<IRendererOperation>();
    private _renderer$: rx.Observable<IRenderer>;

    constructor (element: HTMLElement) {
        this.element = element;

        this._renderer$ = this._rendererOperation$
            .scan<IRenderer>(
                (renderer: IRenderer, operation: IRendererOperation): IRenderer => {
                    return operation(renderer);
                },
                null
            );

        this._render$
            .first()
            .map<IRendererOperation>((hash: IRenderHash): IRendererOperation => {
                return (renderer: IRenderer): IRenderer => {
                    let webGLRenderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();

                    let elementWidth: number = this.element.offsetWidth;
                    webGLRenderer.setSize(elementWidth, elementWidth * 3 / 4);
                    webGLRenderer.setClearColor(new THREE.Color(0x202020), 1.0);
                    webGLRenderer.sortObjects = false;

                    webGLRenderer.domElement.style.width = "100%";
                    webGLRenderer.domElement.style.height = "100%";
                    this.element.appendChild(webGLRenderer.domElement);

                    return { needsRender: true, renderer: webGLRenderer };
                };
            })
            .subscribe(this._rendererOperation$);

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
                    aspectRatio: 4 / 3,
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

                    camera.alpha = frame.state.alpha;

                    if (camera.lastCamera.diff(current) < 0.00001) {
                        return camera;
                    }

                    let verticalFov: number = 2 * Math.atan(0.5 / camera.aspectRatio / current.focal) * 180 / Math.PI;

                    camera.perspective.fov = verticalFov;
                    camera.perspective.updateProjectionMatrix();

                    camera.perspective.up.copy(current.up);
                    camera.perspective.position.copy(current.position);
                    camera.perspective.lookAt(current.lookat);

                    camera.lastCamera.copy(current);
                    camera.needsRender = true;

                    return camera;
                };
            })
            .subscribe(this._cameraOperation$);

        this._size$ = this._resize$
            .map<ISize>((): ISize => {
                let width: number = element.offsetWidth;

                return { height: width * 3 / 4, width: width };
            });

        this._size$.map<ICameraOperation>(
            (size: ISize) => {
                return (camera: ICamera): ICamera => {
                    camera.aspectRatio = size.width / size.height;
                    camera.needsRender = true;

                    return camera;
                };
            })
            .subscribe(this._cameraOperation$);

        this._size$.map<IRendererOperation>(
            (size: ISize): IRendererOperation => {
                return (renderer: IRenderer): IRenderer => {
                    if (renderer == null) {
                        return null;
                    }

                    renderer.renderer.setSize(size.width, size.height);
                    renderer.needsRender = true;

                    return renderer;
                };
            })
            .subscribe(this._rendererOperation$);

        rx.Observable.combineLatest(
                this._camera$,
                this._renderCollection$,
                this._renderer$,
                (camera: ICamera, hashes: IRenderHashes, renderer: IRenderer): ICameraRender => {
                    return { camera: camera, hashes: hashes, renderer: renderer };
                })
            .filter((cameraRender: ICameraRender) => {
                if (!Object.keys(cameraRender.hashes).length) {
                    return false;
                }

                let needsRender: boolean =
                    cameraRender.camera.needsRender ||
                    cameraRender.renderer.needsRender;

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
            .map<void>(
                (cameraRender: ICameraRender): void => {
                    cameraRender.camera.needsRender = false;
                    cameraRender.renderer.needsRender = false;

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

                    let renderer: THREE.WebGLRenderer = cameraRender.renderer.renderer;

                    renderer.autoClear = false;
                    renderer.clear();

                    for (let render of backgroundRenders) {
                        render(alpha, perspectiveCamera, renderer);
                    }

                    renderer.clearDepth();

                    for (let render of foregroundRenders) {
                        render(alpha, perspectiveCamera, renderer);
                    }
                })
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

    public get resize$(): rx.Subject<void> {
        return this._resize$;
    }
}

export default GlRenderer;
