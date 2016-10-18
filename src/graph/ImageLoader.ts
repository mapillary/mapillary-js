import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";

import {ILoadStatusObject} from "../Graph";
import {Urls} from "../Utils";
import {ImageSize} from "../Viewer";

export class ImageLoader {
    public static loadThumbnail(key: string, imageSize: ImageSize): Observable<ILoadStatusObject<HTMLImageElement>> {
        return this._load(key, imageSize, Urls.thumbnail);
    }

    public static loadDynamic(key: string, imageSize: number): Observable<ILoadStatusObject<HTMLImageElement>> {
        return this._load(key, imageSize, Urls.dynamicImage);
    }

    private static _load(
        key: string,
        size: number,
        getUrl: (key: string, size: number) => string): Observable<ILoadStatusObject<HTMLImageElement>> {

        return Observable.create(
            (subscriber: Subscriber<ILoadStatusObject<HTMLImageElement>>): void => {
                let image: HTMLImageElement = new Image();
                image.crossOrigin = "Anonymous";

                let xmlHTTP: XMLHttpRequest = new XMLHttpRequest();

                xmlHTTP.open("GET", getUrl(key, size), true);
                xmlHTTP.responseType = "arraybuffer";
                xmlHTTP.onload = (pe: ProgressEvent) => {
                    if (xmlHTTP.status !== 200) {
                        subscriber.error(
                            new Error(`Failed to fetch image (${key}). Status: ${xmlHTTP.status}, ${xmlHTTP.statusText}`));
                        return;
                    }

                    image.onload = (e: Event) => {
                        subscriber.next({ loaded: { loaded: pe.loaded, total: pe.total }, object: image });
                        subscriber.complete();
                    };

                    image.onerror = (error: ErrorEvent) => {
                        subscriber.error(new Error(`Failed to load image (${key})`));
                    };

                    let blob: Blob = new Blob([xmlHTTP.response]);
                    image.src = window.URL.createObjectURL(blob);
                };

                xmlHTTP.onprogress = (pe: ProgressEvent) => {
                    subscriber.next({loaded: { loaded: pe.loaded, total: pe.total }, object: null });
                };

                xmlHTTP.onerror = (error: Event) => {
                    subscriber.error(new Error(`Failed to fetch image (${key})`));
                };

                xmlHTTP.send(null);
            });
    }
}

export default ImageLoader;
