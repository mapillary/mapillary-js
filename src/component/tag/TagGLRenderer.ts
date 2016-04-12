/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";

import {Tag} from "../../Component";

export class TagGLRenderer {
    private _scene: THREE.Scene;
    private _meshes: { [key: string]: THREE.Line };

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

    public setTags(tags: Tag[]): void {
        this._disposeObjects();

        for (let tag of tags) {
            this._addMesh(tag);
        }

        this._needsRender = true;
    }

    public updateTag(tag: Tag): void {
        this._disposeMesh(tag.id);
        this._addMesh(tag);

        this._needsRender = true;
    }

    public dispose(): void {
        this._disposeObjects();

        this._needsRender = false;
    }

    private _addMesh(tag: Tag): void {
        let lineGeometry: THREE.Geometry = new THREE.Geometry();
        for (let i: number = 0; i < tag.polygonPoints3d.length - 1; ++i) {
            let a: number[] = tag.polygonPoints3d[i];
            let b: number[] = tag.polygonPoints3d[i + 1];
            lineGeometry.vertices.push(
                new THREE.Vector3(a[0], a[1], a[2]),
                new THREE.Vector3(b[0], b[1], b[2])
            );
        }

        let lineMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00, linewidth: 3 } );
        let line: THREE.Line = new THREE.Line(lineGeometry, lineMaterial);

        this._meshes[tag.id] = line;
        this._scene.add(line);
    }

    private _disposeObjects(): void {
        for (let key of Object.keys(this._meshes)) {
            this._disposeMesh(key);
        }
    }

    private _disposeMesh(id: string): void {
        let mesh: THREE.Line = this._meshes[id];
        this._scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        delete this._meshes[id];
    }
}
