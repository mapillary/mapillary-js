/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {GLRenderer} from "../Render";

export class TextureRenderer {
    private _camera: THREE.OrthographicCamera;
    private _glRenderer: GLRenderer;

    constructor (glRenderer: GLRenderer) {
        this._camera = new THREE.OrthographicCamera(-1, 1, -1, 1, 0, 2);
        this._camera.position.z = 1;

        this._glRenderer = glRenderer;
    }
}

export default TextureRenderer;
