import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";

import {ILoadStatusObject} from "../Graph";
import {Urls} from "../Utils";
import {ImageSize} from "../Viewer";

export class ImageLoader {
    public static load(key: string, imageSize: ImageSize): Observable<ILoadStatusObject<HTMLImageElement>> {
        return Observable.create(
            (subscriber: Subscriber<ILoadStatusObject<HTMLImageElement>>): void => {
                let image: HTMLImageElement = new Image();
                image.crossOrigin = "Anonymous";

                let xmlHTTP: XMLHttpRequest = new XMLHttpRequest();

                xmlHTTP.open("GET", Urls.image(key, imageSize), true);
                xmlHTTP.responseType = "arraybuffer";
                xmlHTTP.onload = (pe: ProgressEvent) => {
                    if (xmlHTTP.status !== 200) {
                        console.warn("Image could not be loaded for key " + key, xmlHTTP.status, xmlHTTP.statusText);
                        subscriber.next({loaded: { loaded: 0, total: 0 }, object: null });
                        subscriber.complete();
                        return;
                    }

                    image.onload = (e: Event) => {
                        subscriber.next({ loaded: { loaded: pe.loaded, total: pe.total }, object: image });
                        subscriber.complete();
                    };

                    image.onerror = (error: ErrorEvent) => {
                        console.warn("Image could not be loaded for key " + key, error.error);
                        subscriber.complete();
                    };

                    let blob: Blob = new Blob([xmlHTTP.response]);
                    image.src = window.URL.createObjectURL(blob);
                };

                xmlHTTP.onprogress = (pe: ProgressEvent) => {
                    subscriber.next({loaded: { loaded: pe.loaded, total: pe.total }, object: null });
                };

                xmlHTTP.send();
            });
    }
}

export default ImageLoader;
