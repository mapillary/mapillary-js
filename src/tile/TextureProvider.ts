import * as THREE from "three";
import {
    publishReplay,
    refCount,
    startWith,
    tap,
} from "rxjs/operators";
import {
    Observable,
    of as observableOf,
    Subject,
    Subscription,
} from "rxjs";

import { SubscriptionHolder } from "../util/SubscriptionHolder";
import { ImageTileEnt } from "../api/ents/ImageTileEnt";
import { TileRegionOfInterest } from "./interfaces/TileRegionOfInterest";
import {
    TileImageSize,
    TileCoords3D,
    TilePixelCoords2D,
    TileCoords2D,
    TileLevel,
    TILE_MIN_REQUEST_LEVEL,
} from "./interfaces/TileTypes";
import {
    basicToTileCoords2D,
    cornersToTilesCoords2D,
    hasOverlap2D,
    clampedImageLevel,
    tileToPixelCoords2D,
    verifySize,
    baseImageLevel,
} from "./TileMath";
import { TileLoader } from "./TileLoader";
import { TileStore } from "./TileStore";

/**
 * @class TextureProvider
 *
 * @classdesc Represents a provider of textures.
 */
export class TextureProvider {
    private readonly _loader: TileLoader;
    private readonly _store: TileStore;
    private readonly _subscriptions: Map<string, Subscription>;
    private readonly _urlSubscriptions: Map<number, Subscription>;
    private readonly _renderedLevel: Set<string>;
    private readonly _rendered: Map<string, TileCoords3D>;

    private readonly _created$: Observable<THREE.Texture>;
    private readonly _createdSubject$: Subject<THREE.Texture>;
    private readonly _hasSubject$: Subject<boolean>;
    private readonly _has$: Observable<boolean>;
    private readonly _updated$: Subject<boolean>;
    private readonly _holder: SubscriptionHolder;

    private readonly _size: TileImageSize;
    private readonly _imageId: string;
    private readonly _level: TileLevel;

    private _renderer: THREE.WebGLRenderer;
    private _render: {
        camera: THREE.OrthographicCamera;
        target: THREE.WebGLRenderTarget;
    };

    private _background: HTMLImageElement;
    private _aborts: Function[];

    private _disposed: boolean;

    /**
     * Create a new image texture provider instance.
     *
     * @param {string} imageId - The identifier of the image for which to request tiles.
     * @param {number} width - The full width of the original image.
     * @param {number} height - The full height of the original image.
     * @param {HTMLImageElement} background - Image to use as background.
     * @param {TileLoader} loader - Loader for retrieving tiles.
     * @param {TileStore} store - Store for saving tiles.
     * @param {THREE.WebGLRenderer} renderer - Renderer used for rendering tiles to texture.
     */
    constructor(
        imageId: string,
        width: number,
        height: number,
        background: HTMLImageElement,
        loader: TileLoader,
        store: TileStore,
        renderer: THREE.WebGLRenderer) {

        const size = { h: height, w: width };
        if (!verifySize(size)) {
            console.warn(
                `Original image size (${width}, ${height}) ` +
                `is invalid (${imageId}). Tiles will not be loaded.`);
        }

        this._imageId = imageId;
        this._size = size;
        this._level = {
            max: baseImageLevel(this._size),
            z: -1,
        };

        this._holder = new SubscriptionHolder();
        this._updated$ = new Subject<boolean>();
        this._createdSubject$ = new Subject<THREE.Texture>();
        this._created$ = this._createdSubject$
            .pipe(
                publishReplay(1),
                refCount());
        this._holder.push(this._created$.subscribe(() => { /*noop*/ }));

        this._hasSubject$ = new Subject<boolean>();
        this._has$ = this._hasSubject$
            .pipe(
                startWith(false),
                publishReplay(1),
                refCount());
        this._holder.push(this._has$.subscribe(() => { /*noop*/ }));

        this._renderedLevel = new Set();
        this._rendered = new Map();
        this._subscriptions = new Map();
        this._urlSubscriptions = new Map();
        this._loader = loader;
        this._store = store;

        this._background = background;
        this._renderer = renderer;
        this._aborts = [];
        this._render = null;
        this._disposed = false;
    }

    /**
     * Get disposed.
     *
     * @returns {boolean} Value indicating whether provider has
     * been disposed.
     */
    public get disposed(): boolean {
        return this._disposed;
    }

    /**
     * Get hasTexture$.
     *
     * @returns {Observable<boolean>} Observable emitting
     * values indicating when the existance of a texture
     * changes.
     */
    public get hasTexture$(): Observable<boolean> {
        return this._has$;
    }

    /**
     * Get id.
     *
     * @returns {boolean} The identifier of the image for
     * which to render textures.
     */
    public get id(): string {
        return this._imageId;
    }

    /**
     * Get textureUpdated$.
     *
     * @returns {Observable<boolean>} Observable emitting
     * values when an existing texture has been updated.
     */
    public get textureUpdated$(): Observable<boolean> {
        return this._updated$;
    }

    /**
     * Get textureCreated$.
     *
     * @returns {Observable<boolean>} Observable emitting
     * values when a new texture has been created.
     */
    public get textureCreated$(): Observable<THREE.Texture> {
        return this._created$;
    }

    /**
     * Abort all outstanding image tile requests.
     */
    public abort(): void {
        this._subscriptions.forEach(sub => sub.unsubscribe());
        this._subscriptions.clear();

        for (const abort of this._aborts) { abort(); }
        this._aborts = [];
    }

    /**
     * Dispose the provider.
     *
     * @description Disposes all cached assets and
     * aborts all outstanding image tile requests.
     */
    public dispose(): void {
        if (this._disposed) {
            console.warn(`Texture already disposed (${this._imageId})`);
            return;
        }

        this._urlSubscriptions.forEach(sub => sub.unsubscribe());
        this._urlSubscriptions.clear();

        this.abort();

        if (this._render != null) {
            this._render.target.dispose();
            this._render.target = null;
            this._render.camera = null;
            this._render = null;
        }

        this._store.dispose();
        this._holder.unsubscribe();
        this._renderedLevel.clear();

        this._background = null;
        this._renderer = null;

        this._disposed = true;
    }

    /**
     * Set the region of interest.
     *
     * @description When the region of interest is set the
     * the tile level is determined and tiles for the region
     * are fetched from the store or the loader and renderedLevel
     * to the texture.
     *
     * @param {TileRegionOfInterest} roi - Spatial edges to cache.
     */
    public setRegionOfInterest(roi: TileRegionOfInterest): void {
        if (!verifySize(this._size)) { return; }

        const virtualWidth = 1 / roi.pixelWidth;
        const virtualHeight = 1 / roi.pixelHeight;
        const level = clampedImageLevel(
            { h: virtualHeight, w: virtualWidth },
            TILE_MIN_REQUEST_LEVEL,
            this._level.max);

        if (level !== this._level.z) {
            this.abort();
            this._level.z = level;
            this._renderedLevel.clear();
            this._rendered
                .forEach((tile, id) => {
                    if (tile.z !== level) { return; }
                    this._renderedLevel.add(id);
                });
        }

        if (this._render == null) { this._initRender(); }

        const topLeft = basicToTileCoords2D(
            [roi.bbox.minX, roi.bbox.minY],
            this._size,
            this._level);

        const bottomRight = basicToTileCoords2D(
            [roi.bbox.maxX, roi.bbox.maxY],
            this._size,
            this._level);

        const tiles = cornersToTilesCoords2D(
            topLeft,
            bottomRight,
            this._size,
            this._level);

        this._fetchTiles(level, tiles);
    }

    /**
     * Retrieve an image tile.
     *
     * @description Retrieve an image tile and render it to the
     * texture. Add the tile to the store and emit to the updated
     * observable.
     *
     * @param {ImageTileEnt} tile - The tile ent.
     */
    private _fetchTile(tile: ImageTileEnt): void {
        const getTile = this._loader.getImage$(tile.url);
        const tile$ = getTile[0];
        const abort = getTile[1];
        this._aborts.push(abort);
        const tileId = this._store.inventId(tile);

        const subscription = tile$.subscribe(
            (image: HTMLImageElement): void => {
                const pixels = tileToPixelCoords2D(
                    tile,
                    this._size,
                    this._level);
                this._renderToTarget(pixels, image);
                this._subscriptions.delete(tileId);
                this._removeFromArray(abort, this._aborts);
                this._markRendered(tile);
                this._store.add(tileId, image);
                this._updated$.next(true);
            },
            (error: Error): void => {
                this._subscriptions.delete(tileId);
                this._removeFromArray(abort, this._aborts);
                console.error(error);
            });

        if (!subscription.closed) {
            this._subscriptions.set(tileId, subscription);
        }
    }

    /**
     * Fetch image tiles.
     *
     * @description Retrieve a image tiles and render them to the
     * texture. Retrieve from store if it exists, otherwise retrieve
     * from loader.
     *
     * @param {Array<TileCoords2D>} tiles - Array of tile coordinates to
     * retrieve.
     */
    private _fetchTiles(level: number, tiles: TileCoords2D[]): void {
        const urls$ = this._store.hasURLLevel(level) ?
            observableOf(undefined) :
            this._loader
                .getURLs$(this._imageId, level)
                .pipe(
                    tap(ents => {
                        if (!this._store.hasURLLevel(level)) {
                            this._store.addURLs(level, ents);
                        }
                    }));

        const subscription = urls$.subscribe(
            (): void => {
                if (level !== this._level.z) { return; }
                for (const tile of tiles) {
                    const ent: ImageTileEnt = {
                        x: tile.x,
                        y: tile.y,
                        z: level,
                        url: null,
                    };
                    const id = this._store.inventId(ent);
                    if (this._renderedLevel.has(id) ||
                        this._subscriptions.has(id)) {
                        continue;
                    }

                    if (this._store.has(id)) {
                        const pixels = tileToPixelCoords2D(
                            tile,
                            this._size,
                            this._level);

                        this._renderToTarget(
                            pixels,
                            this._store.get(id));

                        this._markRendered(ent);
                        this._updated$.next(true);
                        continue;
                    }

                    ent.url = this._store.getURL(id);
                    this._fetchTile(ent);
                }
                this._urlSubscriptions.delete(level);
            },
            (error: Error): void => {
                this._urlSubscriptions.delete(level);
                console.error(error);
            });

        if (!subscription.closed) {
            this._urlSubscriptions.set(level, subscription);
        }
    }

    private _initRender(): void {
        const dx = this._size.w / 2;
        const dy = this._size.h / 2;
        const near = -1;
        const far = 1;
        const camera =
            new THREE.OrthographicCamera(-dx, dx, dy, -dy, near, far);
        camera.position.z = 1;
        const gl = this._renderer.getContext();
        const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const backgroundSize = Math.max(this._size.w, this._size.h);
        const scale = maxTextureSize > backgroundSize ?
            1 : maxTextureSize / backgroundSize;

        const targetWidth = Math.floor(scale * this._size.w);
        const targetHeight = Math.floor(scale * this._size.h);

        const target = new THREE.WebGLRenderTarget(
            targetWidth,
            targetHeight,
            {
                depthBuffer: false,
                format: THREE.RGBFormat,
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter,
                stencilBuffer: false,
            });

        this._render = { camera, target };

        const pixels = tileToPixelCoords2D(
            { x: 0, y: 0 },
            this._size,
            { max: this._level.max, z: 0 });
        this._renderToTarget(pixels, this._background);

        this._createdSubject$.next(target.texture);
        this._hasSubject$.next(true);
    }

    /**
     * Mark a tile as rendered.
     *
     * @description Clears tiles marked as rendered in other
     * levels of the tile pyramid if they overlap the
     * newly rendered tile.
     *
     * @param {Arrary<number>} tile - The tile ent.
     */
    private _markRendered(tile: ImageTileEnt): void {
        const others =
            Array.from(this._rendered.entries())
                .filter(
                    ([_, t]: [string, TileCoords3D]): boolean => {
                        return t.z !== tile.z;
                    });

        for (const [otherId, other] of others) {
            if (hasOverlap2D(tile, other)) {
                this._rendered.delete(otherId);
            }
        }

        const id = this._store.inventId(tile);
        this._rendered.set(id, tile);
        this._renderedLevel.add(id);
    }

    /**
     * Remove an item from an array if it exists in array.
     *
     * @param {T} item - Item to remove.
     * @param {Array<T>} array - Array from which item should be removed.
     */
    private _removeFromArray<T>(item: T, array: T[]): void {
        const index = array.indexOf(item);
        if (index !== -1) {
            array.splice(index, 1);
        }
    }

    /**
     * Render an image tile to the target texture.
     *
     * @param {ImageTileEnt} tile - Tile ent.
     * @param {HTMLImageElement} image - The image tile to render.
     */
    private _renderToTarget(
        pixel: TilePixelCoords2D,
        image: HTMLImageElement): void {
        const texture = new THREE.Texture(image);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        const geometry = new THREE.PlaneGeometry(pixel.w, pixel.h);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.FrontSide,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = -this._size.w / 2 + pixel.x + pixel.w / 2;
        mesh.position.y = this._size.h / 2 - pixel.y - pixel.h / 2;

        const scene = new THREE.Scene();
        scene.add(mesh);

        const target = this._renderer.getRenderTarget();

        this._renderer.resetState();
        this._renderer.setRenderTarget(this._render.target)
        this._renderer.render(scene, this._render.camera);
        this._renderer.setRenderTarget(target);

        scene.remove(mesh);

        geometry.dispose();
        material.dispose();
        texture.dispose();
    }
}
