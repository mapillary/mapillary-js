/// <reference path="../../../typings/browser.d.ts" />

import * as THREE from "three";

import {Tag} from "../../Component";

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

    public updateTags(tags: Tag[]): void {
        this._needsRender = true;

        this._disposeObjects();

        for (let tag of tags) {
            let lineGeometry: THREE.Geometry = new THREE.Geometry();
            for (let i: number = 0; i < tag.rectPoints3d.length - 1; ++i) {
                let a: number[] = tag.rectPoints3d[i];
                let b: number[] = tag.rectPoints3d[i + 1];
                lineGeometry.vertices.push(
                    new THREE.Vector3(a[0], a[1], a[2]),
                    new THREE.Vector3(b[0], b[1], b[2])
                );
            }

            let lineMaterial: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00, linewidth: 3 } );
            let line: THREE.Line = new THREE.Line(lineGeometry, lineMaterial);
            this._scene.add(line);
        }
    }

    public dispose(): void {
        this._disposeObjects();

        this._needsRender = false;
    }

    private _disposeObjects(): void {
        for (let object of this._scene.children.slice()) {
            this._scene.remove(object);
            let line: THREE.Line = <THREE.Line>object;
            line.geometry.dispose();
            line.material.dispose();
        }
    }
}
