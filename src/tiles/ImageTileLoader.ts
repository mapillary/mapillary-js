import {Observable, Subscriber} from "rxjs";

/**
 * @class ImageTileLoader
 *
 * @classdesc Represents a loader of image tiles.
 */
export class ImageTileLoader {
    private _origin: string;
    private _scheme: string;
    private _host: string;

    /**
     * Create a new node image tile loader instance.
     *
     * @param {string} scheme - The URI scheme.
     * @param {string} host - The URI host.
     * @param {string} [origin] - The origin query param.
     */
    constructor(scheme: string, host: string, origin?: string) {
        this._scheme = scheme;
        this._host = host;
        this._origin = origin != null ? `?origin=${origin}` : "";
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

        let characteristics: string = `/${identifier}/${x},${y},${w},${h}/${scaledW},${scaledH}/0/default.jpg`;
        let url: string =
            this._scheme +
            "://" +
            this._host +
            characteristics +
            this._origin;

        let xmlHTTP: XMLHttpRequest = null;

        return [Observable.create(
            (subscriber: Subscriber<HTMLImageElement>): void => {
                xmlHTTP = new XMLHttpRequest();
                xmlHTTP.open("GET", url, true);
                xmlHTTP.responseType = "arraybuffer";
                xmlHTTP.timeout = 15000;

                xmlHTTP.onload = (event: Event) => {
                    if (xmlHTTP.status !== 200) {
                        subscriber.error(
                            new Error(
                                `Failed to fetch tile (${identifier}: ${x},${y},${w},${h}). ` +
                                `Status: ${xmlHTTP.status}, ${xmlHTTP.statusText}`));

                        return;
                    }

                    let image: HTMLImageElement = new Image();
                    image.crossOrigin = "Anonymous";

                    image.onload = (e: Event) => {
                        subscriber.next(image);
                        subscriber.complete();
                    };

                    image.onerror = (error: ErrorEvent) => {
                        subscriber.error(new Error(`Failed to load tile image (${identifier}: ${x},${y},${w},${h})`));
                    };

                    let blob: Blob = new Blob([xmlHTTP.response]);
                    image.src = window.URL.createObjectURL(blob);
                };

                xmlHTTP.onerror = (error: Event) => {
                    subscriber.error(new Error(`Failed to fetch tile (${identifier}: ${x},${y},${w},${h})`));
                };

                xmlHTTP.ontimeout = (error: Event) => {
                    subscriber.error(new Error(`Tile request timed out (${identifier}: ${x},${y},${w},${h})`));
                };

                xmlHTTP.onabort = (event: Event) => {
                    subscriber.error(new Error(`Tile request was aborted (${identifier}: ${x},${y},${w},${h})`));
                };

                xmlHTTP.send(null);
            }),
            (): void => {
                if (xmlHTTP != null) {
                    xmlHTTP.abort();
                }
            },
        ];
    }
}

export default ImageTileLoader;
