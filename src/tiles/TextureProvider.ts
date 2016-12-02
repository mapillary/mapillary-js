/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {Subscription} from "rxjs/Subscription";

import {
    ImageTileLoader,
    IRegionOfInterest,
} from "../Tiles";

export class TextureProvider {
    private _background: HTMLImageElement;
    private _camera: THREE.OrthographicCamera;
    private _imageTileLoader: ImageTileLoader;
    private _renderer: THREE.WebGLRenderer;
    private _renderTarget: THREE.WebGLRenderTarget;
    private _roi: IRegionOfInterest;

    private _abortFunctions: Function[];
    private _tileSubscriptions: Subscription[];

    private _created$: Observable<THREE.Texture>;
    private _createdSubject$: Subject<THREE.Texture>;
    private _createdSubscription: Subscription;
    private _updated$: Subject<boolean>;

    private _height: number;
    private _key: string;
    private _tileSize: number;
    private _width: number;

    constructor (
        key: string,
        width: number,
        height: number,
        background: HTMLImageElement,
        imageTileLoader: ImageTileLoader,
        renderer: THREE.WebGLRenderer) {

        this._key = key;

        this._width = width;
        this._height = height;
        this._tileSize = 512;

        this._updated$ = new Subject<boolean>();
        this._createdSubject$ = new Subject<THREE.Texture>();
        this._created$ = this._createdSubject$
            .publishReplay(1)
            .refCount();

        this._createdSubscription = this._created$.subscribe();

        this._abortFunctions = [];
        this._tileSubscriptions = [];

        this._background = background;
        this._camera = null;
        this._imageTileLoader = imageTileLoader;
        this._renderer = renderer;
        this._renderTarget = null;
        this._roi = null;
    }

    public get textureUpdated$(): Observable<boolean> {
        return this._updated$;
    }

    public get textureCreated$(): Observable<THREE.Texture> {
        return this._created$;
    }

    public dispose(): void {
        if (this._renderTarget != null) {
            this._renderTarget.dispose();
            this._renderTarget = null;
        }

        this._background = null;
        this._camera = null;
        this._imageTileLoader = null;
        this._renderer = null;
        this._roi = null;

        this._createdSubscription.unsubscribe();

        for (let subscription of this._tileSubscriptions) {
            subscription.unsubscribe();
        }

        this._tileSubscriptions = [];

        for (let abort of this._abortFunctions) {
            abort();
        }

        this._abortFunctions = [];
    }

    public setRegionOfInterest(roi: IRegionOfInterest): void {
        if (this._roi != null) {
            return;
        }

        this._roi = roi;

        this._camera = new THREE.OrthographicCamera(
            -this._width / 2,
            this._width / 2,
            this._height / 2,
            -this._height / 2,
            -1,
            1);

        this._camera.position.z = 1;

        this._renderTarget = new THREE.WebGLRenderTarget(
            this._width,
            this._height,
            {
                depthBuffer: false,
                format: THREE.RGBFormat,
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter,
                stencilBuffer: false,
            });

        this._renderToTarget(0, 0, this._width, this._height, this._background);

        this._createdSubject$.next((<any>this._renderTarget).texture);

        this._renderTiles();
    }

    private _removeFromArray<T>(item: T, array: T[]): void {
        let index: number = array.indexOf(item);
        if (index !== -1) {
            array.splice(index, 1);
        }
    }

    private _renderTile(x: number, y: number, w: number, h: number): void {
        let getTile: [Observable<HTMLImageElement>, Function] = this._imageTileLoader.getTile(this._key, x, y, w, h, w, h);

        let tile$: Observable<HTMLImageElement> = getTile[0];
        let abort: Function = getTile[1];

        this._abortFunctions.push(abort);

        let subscription: Subscription = tile$
            .subscribe(
                (image: HTMLImageElement): void => {
                    this._renderToTarget(x, y, w, h, image, true);

                    this._removeFromArray(subscription, this._tileSubscriptions);
                    this._removeFromArray(abort, this._abortFunctions);

                    this._updated$.next(true);
                },
                (error: Error): void => {
                    this._removeFromArray(subscription, this._tileSubscriptions);
                    this._removeFromArray(abort, this._abortFunctions);

                    console.error(error);
                });

        this._tileSubscriptions.push(subscription);
    }

    private _renderTiles(): void {
        let width: number = this._width;
        let height: number = this._height;
        let tileSize: number = this._tileSize;

        for (let x: number = 0; x < width; x = x + tileSize) {
            for (let y: number = 0; y < height; y = y + tileSize) {
                let tileWidth: number = x + tileSize > width ? width - x : tileSize;
                let tileHeight: number = y + tileSize > height ? height - y : tileSize;

                this._renderTile(x, y, tileWidth, tileHeight);
            }
        }
    }

    private _renderToTarget(x: number, y: number, w: number, h: number, image: HTMLImageElement, revoke?: boolean): void {
        let texture: THREE.Texture = new THREE.Texture(image);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        let geometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(w, h);
        let material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });

        let mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = -this._width / 2 + x + w / 2;
        mesh.position.y = this._height / 2 - y - h / 2;

        let scene: THREE.Scene = new THREE.Scene();
        scene.add(mesh);

        let ts: number = window.performance.now();

        this._renderer.render(scene, this._camera, this._renderTarget);
        this._renderer.setRenderTarget(undefined);

        let te: number = window.performance.now();
        if (te - ts > 10) {
            console.warn("Render to target", (te - ts).toFixed(2), w, h);
        }

        scene.remove(mesh);

        geometry.dispose();
        material.dispose();
        texture.dispose();

        if (revoke) {
            window.URL.revokeObjectURL(image.src);
        }
    }
}

export default TextureProvider;
