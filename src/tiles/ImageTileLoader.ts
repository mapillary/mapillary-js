import { Observable, Subscriber } from "rxjs";
import { IDataProvider } from "../api/interfaces/interfaces";

/**
 * @class ImageTileLoader
 *
 * @classdesc Represents a loader of image tiles.
 */
export class ImageTileLoader {
    private _provider: IDataProvider;

    /**
     * Create a new node image tile loader instance.
     *
     * @param {IDataProvider} provider - The data provider.
     */
    constructor(provider: IDataProvider) {
        this._provider = provider;
    }

    /**
     * Retrieve an image tile.
     *
     * @description Retrieve an image tile by specifying the area
     * as well as the scaled size.
     *
     * @param {string} identifier - The identifier of the image.
     * @param {number} x - The top left x pixel coordinate for the tile
     * in the original image.
     * @param {number} y - The top left y pixel coordinate for the tile
     * in the original image.
     * @param {number} w - The pixel width of the tile in the original image.
     * @param {number} h - The pixel height of the tile in the original image.
     * @param {number} scaledW - The scaled width of the returned tile.
     * @param {number} scaledH - The scaled height of the returned tile.
     */
    public getTile(
        identifier: string,
        x: number,
        y: number,
        w: number,
        h: number,
        scaledW: number,
        scaledH: number): [Observable<HTMLImageElement>, Function] {

        let aborter: Function;
        const abort: Promise<void> = new Promise(
            (_, reject): void => {
                aborter = reject;
            });

        return [
            Observable.create(
                (subscriber: Subscriber<HTMLImageElement>): void => {
                    this._provider
                        .getImageTile(
                            identifier,
                            x,
                            y,
                            w,
                            h,
                            scaledW,
                            scaledH,
                            abort)
                        .then(
                            (buffer: ArrayBuffer): void => {
                                aborter = null;

                                const image: HTMLImageElement = new Image();
                                image.crossOrigin = "Anonymous";

                                image.onload = () => {
                                    subscriber.next(image);
                                    subscriber.complete();
                                };

                                image.onerror = () => {
                                    aborter = null;

                                    subscriber.error(new Error(`Failed to load image (${identifier})`));
                                };

                                const blob: Blob = new Blob([buffer]);
                                image.src = window.URL.createObjectURL(blob);
                            },
                            (error: Error): void => {
                                aborter = null;
                                subscriber.error(error);
                            })
                }),
            (): void => {
                if (!!aborter) {
                    aborter();
                }
            }
        ];
    }
}

export default ImageTileLoader;
