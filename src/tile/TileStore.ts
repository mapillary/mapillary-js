import { ImageTileEnt } from "../api/ents/ImageTileEnt";

/**
 * @class ImageTileStore
 *
 * @classdesc Represents a store for image tiles.
 */
export class TileStore {
    private readonly _tiles: Map<string, HTMLImageElement>;
    private readonly _urlLevels: Set<number>;
    private readonly _urls: Map<string, string>;

    /**
     * Create a new image image tile store instance.
     */
    constructor() {
        this._tiles = new Map();
        this._urlLevels = new Set();
        this._urls = new Map();
    }

    /**
     * Add an image tile to the store.
     *
     * @param {string} id - The identifier for the image tile.
     * @param {HTMLImageElement} image - The image tile.
     */
    public add(id: string, image: HTMLImageElement): void {
        if (this._tiles.has(id)) {
            throw new Error(`Image tile already stored (${id})`);
        }
        this._tiles.set(id, image);
    }

    public addURLs(level: number, ents: ImageTileEnt[]): void {
        const urls = this._urls;
        for (const ent of ents) {
            const id = this.inventId(ent);
            if (this._urls.has(id)) {
                throw new Error(`URL already stored (${id})`);
            }
            urls.set(id, ent.url);
        }
        this._urlLevels.add(level);
    }

    /**
     * Dispose the store.
     *
     * @description Disposes all cached assets.
     */
    public dispose(): void {
        this._tiles
            .forEach(
                image => window.URL.revokeObjectURL(image.src));
        this._tiles.clear();
        this._urls.clear();
        this._urlLevels.clear();
    }

    /**
     * Get an image tile from the store.
     *
     * @param {string} id - The identifier for the tile.
     * @param {number} level - The level of the tile.
     */
    public get(id: string): HTMLImageElement {
        return this._tiles.get(id);
    }

    public getURL(id: string): string {
        return this._urls.get(id);
    }

    /**
     * Check if an image tile exist in the store.
     *
     * @param {string} id - The identifier for the tile.
     * @param {number} level - The level of the tile.
     */
    public has(id: string): boolean {
        return this._tiles.has(id);
    }

    public hasURL(id: string): boolean {
        return this._urls.has(id);
    }

    public hasURLLevel(level: number): boolean {
        return this._urlLevels.has(level);
    }

    /**
     * Create a unique tile id from a tile.
     *
     * @description Tile ids are used as a hash for
     * storing the tile in a dictionary.
     *
     * @param {ImageTileEnt} tile - The tile.
     * @returns {string} Unique id.
     */
    public inventId(tile: ImageTileEnt): string {
        return `${tile.z}-${tile.x}-${tile.y}`;
    }
}
