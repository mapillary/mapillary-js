export class ImageTileStore {
    private _images: { [level: string]: { [key: string]: HTMLImageElement } };

    constructor() {
        this._images = {};
    }

    public addImage(image: HTMLImageElement, key: string, level: number): void {
        if (!(level in this._images)) {
            this._images[level] = {};
        }

        this._images[level][key] = image;
    }

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

    public getImage(key: string, level: number): HTMLImageElement {
        return this._images[level][key];
    }

    public hasImage(key: string, level: number): boolean {
        return level in this._images && key in this._images[level];
    }
}

export default ImageTileStore;
