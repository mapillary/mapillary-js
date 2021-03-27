import {
    Observable,
    Subscriber,
} from "rxjs";
import { map } from "rxjs/operators";
import { APIWrapper } from "../api/APIWrapper";
import { ImageTileEnt } from "../api/ents/ImageTileEnt";

/**
 * @class ImageTileLoader
 *
 * @classdesc Represents a loader of image tiles.
 */
export class TileLoader {
    /**
     * Create a new node image tile loader instance.
     *
     * @param {APIWrapper} _api - API wrapper.
     */
    constructor(private readonly _api: APIWrapper) { }

    /**
     * Retrieve an image tile.
     *
     * @param {string} url - URL to the image tile resource
     */
    public getImage$(
        url: string)
        : [Observable<HTMLImageElement>, Function] {
        let aborter: Function;
        const abort: Promise<void> = new Promise(
            (_, reject): void => {
                aborter = reject;
            });

        return [Observable.create(
            (subscriber: Subscriber<HTMLImageElement>): void => {
                this._api.data
                    .getImageBuffer(url, abort)
                    .then(
                        (buffer: ArrayBuffer): void => {
                            aborter = null;

                            const image: HTMLImageElement = new Image();
                            image.crossOrigin = "Anonymous";

                            image.onload = () => {
                                window.URL.revokeObjectURL(image.src);
                                subscriber.next(image);
                                subscriber.complete();
                            };

                            image.onerror = () => {
                                aborter = null;
                                window.URL.revokeObjectURL(image.src);
                                subscriber.error(
                                    new Error(
                                        `Failed to load image tile`));
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
        }];
    }

    public getURLs$(
        imageId: string,
        level: number)
        : Observable<ImageTileEnt[]> {
        const request = { imageId, z: level };
        return this._api
            .getImageTiles(request)
            .pipe(map(contract => contract.node));
    }
}
