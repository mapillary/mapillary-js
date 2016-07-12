/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";

import {Observable} from "rxjs/Observable";

import "rxjs/add/observable/bindCallback";

import "rxjs/add/operator/do";

import {ImageSize} from "../../Viewer";
import {Urls} from "../../Utils";

export class TextureLoader {
    public load(key: string, imageSize: ImageSize): Observable<THREE.Texture> {
        let textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
        textureLoader.setCrossOrigin("Anonymous");

        let load: (url: string) => Observable<THREE.Texture> = Observable
            .bindCallback<THREE.Texture>(
                (url: string, onLoad: (texture: THREE.Texture) => void): THREE.Texture => {
                    return textureLoader.load(url, onLoad);
                });

        let textureSource: Observable<THREE.Texture> =
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
