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
    private _tileSubscriptions: { [key: string]: Subscription };

    private _created$: Observable<THREE.Texture>;
    private _createdSubject$: Subject<THREE.Texture>;
    private _createdSubscription: Subscription;
    private _updated$: Subject<boolean>;

    private _height: number;
    private _key: string;
    private _tileSize: number;
    private _maxLevel: number;
    private _currentLevel: number;
    private _renderedCurrentLevelTiles: { [key: string]: boolean };
    private _renderedTiles: { [level: string]: number[][] };
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
        this._currentLevel = -1;
        this._tileSize = 512;

        this._updated$ = new Subject<boolean>();
        this._createdSubject$ = new Subject<THREE.Texture>();
        this._created$ = this._createdSubject$
            .publishReplay(1)
            .refCount();

        this._createdSubscription = this._created$.subscribe();

        this._abortFunctions = [];
        this._tileSubscriptions = {};
        this._renderedCurrentLevelTiles = {};
        this._renderedTiles = {};

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
        for (let key in this._tileSubscriptions) {
            if (!this._tileSubscriptions.hasOwnProperty(key)) {
                continue;
            }

            this._tileSubscriptions[key].unsubscribe();
        }

        this._tileSubscriptions = {};

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

        let portionX: number = this._roi.bbox.maxX > this._roi.bbox.minX ?
            this._roi.bbox.maxX - this._roi.bbox.minX :
            1 - this._roi.bbox.minX + this._roi.bbox.maxX;

        let portionY: number = this._roi.bbox.maxY - this._roi.bbox.minY;

        let width: number = this._width * (this._roi.viewportWidth / this._width / portionX);
        let height: number = this._height * (this._roi.viewportHeight / this._height / portionY);
        let size: number = Math.max(height, width);

        let currentLevel: number = Math.min(this._maxLevel, Math.round(Math.log(size) / Math.log(2) - 1));
        if (currentLevel !== this._currentLevel) {
            this.abort();

            this._currentLevel = currentLevel;
            if (!(this._currentLevel in this._renderedTiles)) {
                this._renderedTiles[this._currentLevel] = [];
            }

            this._renderedCurrentLevelTiles = {};
            for (let tile of this._renderedTiles[this._currentLevel]) {
                this._renderedCurrentLevelTiles[this._tileKey(tile)] = true;
            }
        }

        let topLeft: number[] = this._getTileCoords([this._roi.bbox.minX, this._roi.bbox.minY]);
        let bottomRight: number[] = this._getTileCoords([this._roi.bbox.maxX, this._roi.bbox.maxY]);

        let tiles: number[][] = this._getTiles(topLeft, bottomRight);

        if (this._camera == null) {
            this._camera = new THREE.OrthographicCamera(
                -this._width / 2,
                this._width / 2,
                this._height / 2,
                -this._height / 2,
                -1,
                1);

            this._camera.position.z = 1;

            let gl: WebGLRenderingContext = this._renderer.getContext();
            let maxTextureSize: number = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            let backgroundSize: number = Math.max(this._width, this._height);
            let scale: number = maxTextureSize > backgroundSize ? 1 : maxTextureSize / backgroundSize;

            let targetWidth: number = Math.floor(scale * this._width);
            let targetHeight: number = Math.floor(scale * this._height);

            this._renderTarget = new THREE.WebGLRenderTarget(
                targetWidth,
                targetHeight,
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

        this._fetchTiles(tiles);
    }

    private _fetchTile(tile: number[], x: number, y: number, w: number, h: number, scaledX: number, scaledY: number): void {
        let getTile: [Observable<HTMLImageElement>, Function] =
            this._imageTileLoader.getTile(this._key, x, y, w, h, scaledX, scaledY);

        let tile$: Observable<HTMLImageElement> = getTile[0];
        let abort: Function = getTile[1];

        this._abortFunctions.push(abort);

        let tileKey: string = this._tileKey(tile);

        let subscription: Subscription = tile$
            .subscribe(
                (image: HTMLImageElement): void => {
                    this._renderToTarget(x, y, w, h, image, true);

                    this._removeFromDictionary(tileKey, this._tileSubscriptions);
                    this._removeFromArray(abort, this._abortFunctions);

                    this._setTileRendered(tile, this._currentLevel);

                    this._updated$.next(true);
                },
                (error: Error): void => {
                    this._removeFromDictionary(tileKey, this._tileSubscriptions);
                    this._removeFromArray(abort, this._abortFunctions);

                    console.error(error);
                });

        if (!subscription.closed) {
            this._tileSubscriptions[tileKey] = subscription;
        }
    }

    private _fetchTiles(tiles: number[][]): void {
        let tileSize: number = this._tileSize * Math.pow(2, this._maxLevel - this._currentLevel);
        let maxTileSize: number = Math.pow(2, this._maxLevel + 1);
        let tileScale: number = maxTileSize >= tileSize ? 1 : maxTileSize / tileSize;

        for (let tile of tiles) {
            let tileKey: string = this._tileKey(tile);
            if (tileKey in this._renderedCurrentLevelTiles ||
                tileKey in this._tileSubscriptions) {
                continue;
            }

            let tileX: number = tileSize * tile[0];
            let tileY: number = tileSize * tile[1];
            let tileWidth: number = tileX + tileSize > this._width ? this._width - tileX : tileSize;
            let tileHeight: number = tileY + tileSize > this._height ? this._height - tileY : tileSize;
            let size: number = Math.max(tileWidth, tileHeight);
            let scaledX: number = Math.floor(tileScale * (tileWidth < this._tileSize ? tileWidth : tileWidth / size * this._tileSize));
            let scaledY: number = Math.floor(tileScale * (tileHeight < this._tileSize ? tileHeight : tileHeight / size * this._tileSize));

            this._fetchTile(tile, tileX, tileY, tileWidth, tileHeight, scaledX, scaledY);
        }
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

    private _getTiles(topLeft: number[], bottomRight: number[]): number[][] {
        let xs: number[] = [];

        if (topLeft[0] > bottomRight[0]) {
            let tileSize: number = this._tileSize * Math.pow(2, this._maxLevel - this._currentLevel);
            let maxX: number = Math.ceil(this._width / tileSize) - 1;

            for (let x: number = topLeft[0]; x <= maxX; x++) {
                xs.push(x);
            }

            for (let x: number = 0; x <= bottomRight[0]; x++) {
                xs.push(x);
            }
        } else {
            for (let x: number = topLeft[0]; x <= bottomRight[0]; x++) {
                xs.push(x);
            }
        }

        let tiles: number[][] = [];

        for (let x of xs) {
            for (let y: number = topLeft[1]; y <= bottomRight[1]; y++) {
                tiles.push([x, y]);
            }
        }

        return tiles;
    }

    private _removeFromArray<T>(item: T, array: T[]): void {
        let index: number = array.indexOf(item);
        if (index !== -1) {
            array.splice(index, 1);
        }
    }

    private _removeFromDictionary<T>(key: string, dict: { [key: string]: T }): void {
        if (key in dict) {
            delete dict[key];
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

    private _setTileRendered(tile: number[], level: number): void {
        let otherLevels: number[] =
            Object.keys(this._renderedTiles)
                .map(
                    (key: string): number => {
                        return parseInt(key, 10);
                    })
                .filter(
                    (renderedLevel: number): boolean => {
                        return renderedLevel !== level;
                    });

        for (let otherLevel of otherLevels) {
            let scale: number = Math.pow(2, otherLevel - level);

            if (otherLevel < level) {
                let x: number = Math.floor(scale * tile[0]);
                let y: number = Math.floor(scale * tile[1]);

                for (let otherTile of this._renderedTiles[otherLevel].slice()) {
                    if (otherTile[0] === x && otherTile[1] === y) {
                        let index: number = this._renderedTiles[otherLevel].indexOf(otherTile);
                        this._renderedTiles[otherLevel].splice(index, 1);
                    }
                }
            } else {
                let startX: number = scale * tile[0];
                let endX: number = startX + scale - 1;
                let startY: number = scale * tile[1];
                let endY: number = startY + scale - 1;

                for (let otherTile of this._renderedTiles[otherLevel].slice()) {
                    if (otherTile[0] >= startX && otherTile[0] <= endX &&
                        otherTile[1] >= startY && otherTile[1] <= endY) {
                        let index: number = this._renderedTiles[otherLevel].indexOf(otherTile);
                        this._renderedTiles[otherLevel].splice(index, 1);

                    }
                }
            }

            if (this._renderedTiles[otherLevel].length === 0) {
                delete this._renderedTiles[otherLevel];
            }
        }

        this._renderedTiles[level].push(tile);
        this._renderedCurrentLevelTiles[this._tileKey(tile)] = true;
    }

    private _tileKey(tile: number[]): string {
        return tile[0] + "-" + tile[1];
    }
}

export default TextureProvider;
