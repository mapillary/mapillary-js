/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";

import {Tag} from "../../Component";
import {Transform} from "../../Geo";

export class TagGLRenderer {
    private _scene: THREE.Scene;
    private _tags: { [key: string]: THREE.Object3D[] };

    private _needsRender: boolean;

    constructor() {
        this._scene = new THREE.Scene();
        this._tags = {};

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

    public setTags(tags: Tag[], transform: Transform): void {
        this._disposeTags();

        for (let tag of tags) {
            this._addTag(tag, transform);
        }

        this._needsRender = true;
    }

    public updateTag(tag: Tag, transform: Transform): void {
        this._disposeTag(tag.id);
        this._addTag(tag, transform);

        this._needsRender = true;
    }

    public dispose(): void {
        this._disposeTags();

        this._needsRender = false;
    }

    private _addTag(tag: Tag, transform: Transform): void {
        let objects: THREE.Object3D[] = tag.getGLObjects(transform);

        this._tags[tag.id] = [];

        for (let object of objects) {
            this._tags[tag.id].push(object);
            this._scene.add(object);
        }
    }

    private _disposeTags(): void {
        for (let key of Object.keys(this._tags)) {
            this._disposeTag(key);
        }
    }

    private _disposeTag(id: string): void {
        let objects: THREE.Object3D[] = this._tags[id];

        for (let object of objects) {
            let mesh: THREE.Mesh | THREE.Line = <THREE.Mesh | THREE.Line>object;

            this._scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        }

        delete this._tags[id];
    }
}
