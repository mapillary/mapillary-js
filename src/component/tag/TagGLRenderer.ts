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
        let geometry: THREE.BufferGeometry = new THREE.BufferGeometry();

        let polygonPoints2d: number[][] = tag.polygonPoints2d;

        let sides: number = polygonPoints2d.length - 1;
        let sections: number = 8;

        let positions: Float32Array = new Float32Array(sides * sections * 3);

        for (let i: number = 0; i < sides; ++i) {
            let startX: number = polygonPoints2d[i][0];
            let startY: number = polygonPoints2d[i][1];

            let endX: number = polygonPoints2d[i + 1][0];
            let endY: number = polygonPoints2d[i + 1][1];

            let intervalX: number = (endX - startX) / (sections - 1);
            let intervalY: number = (endY - startY) / (sections - 1);

            for (let j: number = 0; j < sections; ++j) {
                let rectPosition: number[] = [
                    startX + j * intervalX,
                    startY + j * intervalY,
                ];

                let position: number[] = tag.getPoint3d(rectPosition[0], rectPosition[1]);
                let index: number = 3 * sections * i + 3 * j;

                positions[index] = position[0];
                positions[index + 1] = position[1];
                positions[index + 2] = position[2];
            }
        }

        geometry.addAttribute("position", new THREE.BufferAttribute(positions, 3));

        let material: THREE.LineBasicMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00, linewidth: 1 } );
        let line: THREE.Line = new THREE.Line(geometry, material);

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
