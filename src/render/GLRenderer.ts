/// <reference path="../../node_modules/rx/ts/rx.all.d.ts" />
/// <reference path="../../typings/threejs/three.d.ts" />
/// <reference path="../../typings/underscore/underscore.d.ts" />

import * as rx from "rx";
import * as THREE from "three";
import * as _ from "underscore";

import {IFrame} from "../State";
import {Camera} from "../Geo";
import {
    GLRenderStage,
    IGLRenderFunction,
    IGLRender,
    IGLRenderHash,
} from "../Render";

interface IGLRenderer {
    needsRender: boolean;
    renderer: THREE.WebGLRenderer;
}

interface ICamera {
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
    renderer: IGLRenderer;
    renders: IGLRender[];
}

interface ISize {
    height: number;
    width: number;
}

export class GLRenderer {
    private _element: HTMLElement;
    private _currentFrame$: rx.Observable<IFrame>;

    private _resize$: rx.Subject<void> = new rx.Subject<void>();
    private _size$: rx.ConnectableObservable<ISize>;

    private _frame$: rx.Subject<IFrame> = new rx.Subject<IFrame>();
    private _cameraOperation$: rx.Subject<ICameraOperation> = new rx.Subject<ICameraOperation>();
    private _camera$: rx.Observable<ICamera>;

    private _render$: rx.Subject<IGLRenderHash> = new rx.Subject<IGLRenderHash>();
    private _clear$: rx.Subject<string> = new rx.Subject<string>();
    private _renderOperation$: rx.Subject<IGLRenderHashesOperation> = new rx.Subject<IGLRenderHashesOperation>();
    private _renderCollection$: rx.Observable<IGLRenderHashes>;

    private _rendererOperation$: rx.Subject<IGLRendererOperation> = new rx.Subject<IGLRendererOperation>();
    private _renderer$: rx.Observable<IGLRenderer>;

    private _frameSubscription: rx.IDisposable;

    constructor (element: HTMLElement, currentFrame$: rx.Observable<IFrame>) {
        this._element = element;
        this._currentFrame$ = currentFrame$;

        this._renderer$ = this._rendererOperation$
            .scan<IGLRenderer>(
                (renderer: IGLRenderer, operation: IGLRendererOperation): IGLRenderer => {
                    return operation(renderer);
                },
                { needsRender: false, renderer: null }
            );

        this._render$
            .first()
            .subscribe((hash: IGLRenderHash): void => {
                this._rendererOperation$.onNext((renderer: IGLRenderer): IGLRenderer => {
                    let webGLRenderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();

                    let elementWidth: number = this._element.offsetWidth;
                    webGLRenderer.setSize(elementWidth, elementWidth * 3 / 4);
                    webGLRenderer.setClearColor(new THREE.Color(0x202020), 1.0);
                    webGLRenderer.sortObjects = false;

                    webGLRenderer.domElement.style.width = "100%";
                    webGLRenderer.domElement.style.height = "100%";
                    this._element.appendChild(webGLRenderer.domElement);

                    renderer.needsRender = true;
                    renderer.renderer = webGLRenderer;

                    return renderer;
                });
            });

        this._frameSubscribe();

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

        this._clear$
            .map<IGLRendererOperation>((name: string) => {
                return (renderer: IGLRenderer): IGLRenderer => {
                    if (renderer.renderer == null) {
                        return renderer;
                    }

                    renderer.needsRender = true;

                    return renderer;
                };
            })
            .subscribe(this._rendererOperation$);

        this._renderCollection$
            .subscribe((hashes: IGLRenderHashes): void => {
                if (Object.keys(hashes).length || this._frameSubscription == null) {
                    return;
                }

                this._frameSubscription.dispose();
                this._frameSubscription = null;

                this._frameSubscribe();
            });

        this._camera$ = this._cameraOperation$
            .scan<ICamera>(
                (camera: ICamera, operation: ICameraOperation): ICamera => {
                    return operation(camera);
                },
                {
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
            })
            .publish();

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
                    if (renderer.renderer == null) {
                        return renderer;
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
                    return { camera: camera, renderer: renderer, renders: _.values(hashes) };
                })
            .filter((co: ICombination) => {
                let needsRender: boolean =
                    co.camera.needsRender ||
                    co.renderer.needsRender;

                let frameId: number = co.camera.frameId;

                for (let render of co.renders) {
                    if (render.frameId !== frameId) {
                        return false;
                    }

                    needsRender = needsRender || render.needsRender;
                }

                return needsRender;
            })
            .distinctUntilChanged((co: ICombination): number => { return co.camera.frameId; })
            .subscribe(
                (co: ICombination): void => {
                    co.camera.needsRender = false;
                    co.renderer.needsRender = false;

                    let perspectiveCamera: THREE.PerspectiveCamera = co.camera.perspective;

                    let backgroundRenders: IGLRenderFunction[] = [];
                    let foregroundRenders: IGLRenderFunction[] = [];

                    for (let render of co.renders) {
                        if (render.stage === GLRenderStage.BACKGROUND) {
                            backgroundRenders.push(render.render);
                        } else if (render.stage === GLRenderStage.FOREGROUND) {
                            foregroundRenders.push(render.render);
                        }
                    }

                    let renderer: THREE.WebGLRenderer = co.renderer.renderer;

                    renderer.autoClear = false;
                    renderer.clear();

                    for (let render of backgroundRenders) {
                        render(perspectiveCamera, renderer);
                    }

                    renderer.clearDepth();

                    for (let render of foregroundRenders) {
                        render(perspectiveCamera, renderer);
                    }
                });

        this._size$.connect();
    }

    public get render$(): rx.Subject<IGLRenderHash> {
        return this._render$;
    }

    public clear(name: string): void {
        return this._clear$.onNext(name);
    }

    public resize(): void {
        return this._resize$.onNext(null);
    }

    private _frameSubscribe(): void {
        this._render$
            .first()
            .subscribe((hash: IGLRenderHash): void => {
                this._frameSubscription = this._currentFrame$.subscribe(this._frame$);
            });
    }
}

export default GLRenderer;
