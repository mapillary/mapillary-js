/// <reference path="../../typings/index.d.ts" />

import * as THREE from "three";

import {ImageTileLoader} from "../Tiles";

export class TextureProvider {
    private _camera: THREE.OrthographicCamera;
    private _height: number;
    private _imageTileLoader: ImageTileLoader;
    private _renderer: THREE.WebGLRenderer;
    private _renderTarget: THREE.WebGLRenderTarget;
    private _width: number;

    constructor (
        width: number,
        height: number,
        background: HTMLImageElement,
        imageTileLoader: ImageTileLoader,
        renderer: THREE.WebGLRenderer) {

        this._width = width;
        this._height = height;

        this._camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, -1, 1);
        this._camera.position.z = 1;

        this._imageTileLoader = imageTileLoader;
        this._renderer = renderer;

        this._renderTarget = new THREE.WebGLRenderTarget(
            width,
            height,
            {
                depthBuffer: false,
                format: THREE.RGBFormat,
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter,
                stencilBuffer: false,
            });

        this._renderToTarget(0, 0, width, height, background);
    }

    public get texture(): THREE.Texture {
        return this._texture;
    }

    public dispose(): void {
        this._renderTarget.dispose();
    }

    private get _texture(): THREE.Texture {
        return (<any>this._renderTarget).texture;
    }

    private _renderToTarget(x: number, y: number, w: number, h: number, image: HTMLImageElement): void {
        let texture: THREE.Texture = new THREE.Texture(image);
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        let geometry: THREE.PlaneGeometry = new THREE.PlaneGeometry(w, h);
        let material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });

        let mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = -this._width / 2 + x + w / 2;
        mesh.position.y = this._height / 2 - y - h / 2;

        let scene: THREE.Scene = new THREE.Scene();
        scene.add(mesh);

        let ts: number = window.performance.now();

        this._renderer.render(scene, this._camera, this._renderTarget);
        this._renderer.setRenderTarget(undefined);

        let te: number = window.performance.now();
        if (te - ts > 10) {
            console.warn("Render to target", (te - ts).toFixed(2), w, h);
        }

        scene.remove(mesh);

        geometry.dispose();
        material.dispose();
        texture.dispose();
    }
}

export default TextureProvider;
