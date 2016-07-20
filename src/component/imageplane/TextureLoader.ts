/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";
import {Subscriber} from "rxjs/Subscriber";

import {ImageSize} from "../../Viewer";
import {Urls} from "../../Utils";

export class TextureLoader {
    public load(key: string, imageSize: ImageSize): Observable<THREE.Texture> {
        return Observable.create(
            (subscriber: Subscriber<THREE.Texture>): void => {
                let image: HTMLImageElement = new Image();
                image.crossOrigin = "Anonymous";

                let xmlHTTP: XMLHttpRequest = new XMLHttpRequest();

                xmlHTTP.open("GET", Urls.image(key, imageSize), true);
                xmlHTTP.responseType = "arraybuffer";
                xmlHTTP.onload = (event: Event) => {
                    if (xmlHTTP.status !== 200) {
                        console.warn("Image texture could not be loaded for key " + key);
                        subscriber.complete();
                        return;
                    }

                    image.onload = () => {
                        let texture: THREE.Texture = new THREE.Texture(image);
                        texture.minFilter = THREE.LinearFilter;
                        texture.needsUpdate = true;

                        subscriber.next(texture);
                        subscriber.complete();
                    };

                    image.onerror = (err: Event) => {
                        console.warn("Image texture could not be loaded for key " + key);
                    };

                    let blob: Blob = new Blob([xmlHTTP.response]);
                    image.src = window.URL.createObjectURL(blob);
                };

                xmlHTTP.send();
            });
    }
}

export default TextureLoader;
