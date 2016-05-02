/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";

import {Tag} from "../../Component";
import {Transform} from "../../Geo";

export class TagGLRenderer {
    private _scene: THREE.Scene;
    private _meshes: { [key: string]: THREE.Object3D };

    private _needsRender: boolean;

    constructor() {
        this._scene = new THREE.Scene();
        this._meshes = {};

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
        this._disposeObjects();

        for (let tag of tags) {
            this._addMesh(tag, transform);
        }

        this._needsRender = true;
    }

    public updateTag(tag: Tag, transform: Transform): void {
        this._disposeMesh(tag.id);
        this._addMesh(tag, transform);

        this._needsRender = true;
    }

    public dispose(): void {
        this._disposeObjects();

        this._needsRender = false;
    }

    private _addMesh(tag: Tag, transform: Transform): void {
        let object: THREE.Object3D = tag.getGLGeometry(transform);

        this._meshes[tag.id] = object;
        this._scene.add(object);
    }

    private _disposeObjects(): void {
        for (let key of Object.keys(this._meshes)) {
            this._disposeMesh(key);
        }
    }

    private _disposeMesh(id: string): void {
        let mesh: THREE.Mesh | THREE.Line = <THREE.Mesh | THREE.Line>this._meshes[id];
        this._scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        delete this._meshes[id];
    }
}
