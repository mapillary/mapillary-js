/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {ImageTileLoader} from "../Tiles";

export class TextureProvider {
    private _camera: THREE.OrthographicCamera;

    private _imageTileLoader: ImageTileLoader;
    private _renderer: THREE.WebGLRenderer;

    constructor (imageTileLoader: ImageTileLoader, renderer: THREE.WebGLRenderer) {
        this._camera = new THREE.OrthographicCamera(-1, 1, -1, 1, 0, 2);
        this._camera.position.z = 1;

        this._imageTileLoader = imageTileLoader;
        this._renderer = renderer;
    }
}

export default TextureProvider;
