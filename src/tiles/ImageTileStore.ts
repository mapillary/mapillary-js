/**
 * @class ImageTileStore
 *
 * @classdesc Represents a store for image tiles.
 */
export class ImageTileStore {
    private _images: { [level: string]: { [key: string]: HTMLImageElement } };

    /**
     * Create a new node image tile store instance.
     */
    constructor() {
        this._images = {};
    }

    /**
     * Add an image tile to the store.
     *
     * @param {HTMLImageElement} image - The image tile.
     * @param {string} key - The identifier for the tile.
     * @param {number} level - The level of the tile.
     */
    public addImage(image: HTMLImageElement, key: string, level: number): void {
        if (!(level in this._images)) {
            this._images[level] = {};
        }

        this._images[level][key] = image;
    }

    /**
     * Dispose the store.
     *
     * @description Disposes all cached assets.
     */
    public dispose(): void {
        for (let level of Object.keys(this._images)) {
            let levelImages: { [key: string]: HTMLImageElement } = this._images[level];

            for (let key of Object.keys(levelImages)) {
                window.URL.revokeObjectURL(levelImages[key].src);
                delete levelImages[key];
            }

            delete this._images[level];
        }
    }

    /**
     * Get an image tile from the store.
     *
     * @param {string} key - The identifier for the tile.
     * @param {number} level - The level of the tile.
     */
    public getImage(key: string, level: number): HTMLImageElement {
        return this._images[level][key];
    }

    /**
     * Check if an image tile exist in the store.
     *
     * @param {string} key - The identifier for the tile.
     * @param {number} level - The level of the tile.
     */
    public hasImage(key: string, level: number): boolean {
        return level in this._images && key in this._images[level];
    }
}

export default ImageTileStore;
