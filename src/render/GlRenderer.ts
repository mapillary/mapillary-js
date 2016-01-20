/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {GLRenderStage} from "../Render";
import {IFrame} from "../State";
import {Camera} from "../Geo";

export interface IGLRenderFunction extends Function {
    (
        alpha: number,
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer
    ): void;
}

export interface IGLRender {
    frameId: number;
    needsRender: boolean;
    render: IGLRenderFunction;
    stage: GLRenderStage;
}

export interface IGLRenderHash {
    name: string;
    render: IGLRender;
}

interface IGLRenderer {
    needsRender: boolean;
    renderer: THREE.WebGLRenderer;
}

interface ICamera {
    alpha: number;
    aspectRatio: number;
    frameId: number;
    lastCamera: Camera;
    needsRender: boolean;
    perspective: THREE.PerspectiveCamera;
}

interface IGLRenderHashes {
    [name: string]: IGLRender;
}

interface IGLRendererOperation {
    (renderer: IGLRenderer): IGLRenderer;
}

interface ICameraOperation {
    (camera: ICamera): ICamera;
}

interface IGLRenderHashesOperation extends Function {
    (hashes: IGLRenderHashes): IGLRenderHashes;
}

interface ICombination {
    camera: ICamera;
    hashes: IGLRenderHashes;
    renderer: IGLRenderer;
}

interface ISize {
    height: number;
    width: number;
}

export class GlRenderer {
    private element: HTMLElement;

    private _frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();
    private _resize$: rx.Subject<void> = new rx.Subject<void>();
    private _size$: rx.Observable<ISize>;
    private _cameraOperation$: rx.Subject<ICameraOperation> = new rx.Subject<ICameraOperation>();
    private _camera$: rx.Observable<ICamera>;

    private _render$: rx.Subject<IGLRenderHash> = new rx.Subject<IGLRenderHash>();
    private _clear$: rx.Subject<string> = new rx.Subject<string>();
    private _renderOperation$: rx.Subject<IGLRenderHashesOperation> = new rx.Subject<IGLRenderHashesOperation>();
    private _renderCollection$: rx.Observable<IGLRenderHashes>;

    private _rendererOperation$: rx.Subject<IGLRendererOperation> = new rx.Subject<IGLRendererOperation>();
    private _renderer$: rx.Observable<IGLRenderer>;

    constructor (element: HTMLElement) {
        this.element = element;

        this._renderer$ = this._rendererOperation$
            .scan<IGLRenderer>(
                (renderer: IGLRenderer, operation: IGLRendererOperation): IGLRenderer => {
                    return operation(renderer);
                },
                null
            );

        this._render$
            .first()
            .map<IGLRendererOperation>((hash: IGLRenderHash): IGLRendererOperation => {
                return (renderer: IGLRenderer): IGLRenderer => {
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
            .scan<IGLRenderHashes>(
                (hashes: IGLRenderHashes, operation: IGLRenderHashesOperation): IGLRenderHashes => {
                    return operation(hashes);
                },
                {});

        this._render$
            .map<IGLRenderHashesOperation>((hash: IGLRenderHash) => {
                return (hashes: IGLRenderHashes): IGLRenderHashes => {
                    hashes[hash.name] = hash.render;

                    return hashes;
                };
            })
            .subscribe(this._renderOperation$);

        this._clear$
            .map<IGLRenderHashesOperation>((name: string) => {
                return (hashes: IGLRenderHashes): IGLRenderHashes => {
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

        this._size$.map<IGLRendererOperation>(
            (size: ISize): IGLRendererOperation => {
                return (renderer: IGLRenderer): IGLRenderer => {
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
                (camera: ICamera, hashes: IGLRenderHashes, renderer: IGLRenderer): ICombination => {
                    return { camera: camera, hashes: hashes, renderer: renderer };
                })
            .filter((co: ICombination) => {
                if (!Object.keys(co.hashes).length) {
                    return false;
                }

                let needsRender: boolean =
                    co.camera.needsRender ||
                    co.renderer.needsRender;

                let frameId: number = co.camera.frameId;

                for (let k in co.hashes) {
                    if (!co.hashes.hasOwnProperty(k)) {
                        continue;
                    }

                    if (co.hashes[k].frameId !== frameId) {
                        return false;
                    }

                    needsRender = needsRender || co.hashes[k].needsRender;
                }

                return needsRender;
            })
            .map<void>(
                (co: ICombination): void => {
                    co.camera.needsRender = false;
                    co.renderer.needsRender = false;

                    let alpha: number = co.camera.alpha;
                    let perspectiveCamera: THREE.PerspectiveCamera = co.camera.perspective;

                    let backgroundRenders: IGLRenderFunction[] = [];
                    let foregroundRenders: IGLRenderFunction[] = [];

                    for (let k in co.hashes) {
                        if (!co.hashes.hasOwnProperty(k)) {
                            continue;
                        }

                        let hash: IGLRender = co.hashes[k];
                        if (hash.stage === GLRenderStage.BACKGROUND) {
                            backgroundRenders.push(hash.render);
                        } else if (hash.stage === GLRenderStage.FOREGROUND) {
                            foregroundRenders.push(hash.render);
                        }
                    }

                    let renderer: THREE.WebGLRenderer = co.renderer.renderer;

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

    public get render$(): rx.Subject<IGLRenderHash> {
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
