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
    private _maxLevel: number;
    private _currentLevel: number;
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
        this._maxLevel = Math.ceil(Math.log(Math.max(height, width)) / Math.log(2) - 1);
        this._currentLevel = this._maxLevel;
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

    public abort(): void {
        for (let subscription of this._tileSubscriptions) {
            subscription.unsubscribe();
        }

        this._tileSubscriptions = [];

        for (let abort of this._abortFunctions) {
            abort();
        }

        this._abortFunctions = [];
    }

    public dispose(): void {
        this.abort();

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
    }

    public setRegionOfInterest(roi: IRegionOfInterest): void {
        this._roi = roi;

        let portionX: number = this._roi.bbox.maxX - this._roi.bbox.minX;
        let portionY: number = this._roi.bbox.maxY - this._roi.bbox.minY;

        let height: number = Math.min(this._height, this._height * (this._roi.viewportHeight / this._height / portionY));
        let width: number = Math.min(this._width, this._width * (this._roi.viewportWidth / this._width / portionX));
        let size: number = Math.max(height, width);

        this._currentLevel = Math.ceil(Math.log(size) / Math.log(2) - 1);

        let topLeft: number[] = this._getTileCoords([this._roi.bbox.minX, this._roi.bbox.minY]);
        let bottomRight: number[] = this._getTileCoords([this._roi.bbox.maxX, this._roi.bbox.maxY]);

        if (this._camera == null) {
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
        }

        this._fetchTiles([topLeft[0], bottomRight[0]], [topLeft[1], bottomRight[1]]);
    }

    private _getTileCoords(point: number[]): number[] {
        let tileSize: number = this._tileSize * Math.pow(2, this._maxLevel - this._currentLevel);

        let maxX: number = Math.ceil(this._width / tileSize) - 1;
        let maxY: number = Math.ceil(this._height / tileSize) - 1;

        return [
            Math.min(Math.floor(this._width * point[0] / tileSize), maxX),
            Math.min(Math.floor(this._height * point[1] / tileSize), maxY),
        ];
    }

    private _removeFromArray<T>(item: T, array: T[]): void {
        let index: number = array.indexOf(item);
        if (index !== -1) {
            array.splice(index, 1);
        }
    }

    private _fetchTile(x: number, y: number, w: number, h: number): void {
        let scaledX: number = w < this._tileSize ? w : this._tileSize;
        let scaledY: number = h < this._tileSize ? h : this._tileSize;
        let getTile: [Observable<HTMLImageElement>, Function] = this._imageTileLoader.getTile(this._key, x, y, w, h, scaledX, scaledY);

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

    private _fetchTiles(tilesX: number[], tilesY: number[]): void {
        let width: number = this._width;
        let height: number = this._height;
        let tileSize: number = this._tileSize * Math.pow(2, this._maxLevel - this._currentLevel);

        for (let x: number = tilesX[0]; x <= tilesX[1]; x++) {
            for (let y: number = tilesY[0]; y <= tilesY[1]; y++) {
                let tileX: number = tileSize * x;
                let tileY: number = tileSize * y;
                let tileWidth: number = tileX + tileSize > width ? width - tileX : tileSize;
                let tileHeight: number = tileY + tileSize > height ? height - tileY : tileSize;

                this._fetchTile(tileX, tileY, tileWidth, tileHeight);
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
