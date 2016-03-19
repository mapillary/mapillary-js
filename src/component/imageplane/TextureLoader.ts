/// <reference path="../../../typings/browser.d.ts" />

import * as rx from "rx";
import * as THREE from "three";

import {ImageSize} from "../../Viewer";
import {Urls} from "../../Utils";

export class TextureLoader {
    public load(key: string, imageSize: ImageSize): rx.Observable<THREE.Texture> {
        let textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
        textureLoader.setCrossOrigin("Anonymous");

        let load: (url: string) => rx.Observable<THREE.Texture> =
            rx.Observable.fromCallback<THREE.Texture, string>(
                textureLoader.load,
                textureLoader);

        let textureSource: rx.Observable<THREE.Texture> =
            load(Urls.image(key, imageSize))
                .do(
                    (texture: THREE.Texture): void => {
                        texture.minFilter = THREE.LinearFilter;
                        texture.needsUpdate = true;
                    });

        return textureSource;
    }
}

export default TextureLoader;
