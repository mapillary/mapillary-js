/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";

import {ITag} from "../../Component";

export class TagGLRenderer {
    private _scene: THREE.Scene;

    private _needsRender: boolean;

    constructor() {
        this._scene = new THREE.Scene();

        this._needsRender = false;
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        renderer.render(this._scene, perspectiveCamera);

        this._needsRender = false;
    }

    public updateTags(tags: ITag[]): void {
        this._needsRender = true;
    }

    public dispose(): void {
        this._needsRender = false;
    }
}
