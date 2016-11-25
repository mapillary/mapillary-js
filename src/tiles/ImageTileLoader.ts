import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";

export class ImageTileLoader {
    private _origin: string;
    private _scheme: string;
    private _server: string;

    constructor(server: string, origin?: string) {
        this._scheme = "https";
        this._server = server;
        this._origin = origin != null ? `?origin=${origin}` : "";
    }

    public getTile(
        identifier: string,
        x: number,
        y: number,
        w: number,
        h: number,
        scaledW: number,
        scaledH: number): Observable<HTMLImageElement> {

        let characteristics: string = `/${identifier}/${x},${y},${w},${h}/${scaledW},${scaledH}/0/default.jpg`;
        let url: string =
            this._scheme +
            "://" +
            this._server +
            characteristics +
            this._origin;

        return Observable.create(
            (subscriber: Subscriber<HTMLImageElement>): void => {
                let xmlHTTP: XMLHttpRequest = new XMLHttpRequest();
                xmlHTTP.open("GET", url, true);
                xmlHTTP.responseType = "arraybuffer";

                xmlHTTP.onload = (event: Event) => {
                    if (xmlHTTP.status !== 200) {
                        subscriber.error(
                            new Error(
                                `Failed to fetch tile (${x},${y},${w},${h}). ` +
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
                        subscriber.error(new Error(`Failed to load tile image (${x},${y},${w},${h})`));
                    };

                    let blob: Blob = new Blob([xmlHTTP.response]);
                    image.src = window.URL.createObjectURL(blob);
                };

                xmlHTTP.onerror = (error: Event) => {
                    subscriber.error(new Error(`Failed to fetch tile (${x},${y},${w},${h})`));
                };

                xmlHTTP.onabort = (event: Event) => {
                    subscriber.error(new Error(`Tile request was aborted (${x},${y},${w},${h})`));
                };

                xmlHTTP.send(null);
            });
    }
}

export default ImageTileLoader;
