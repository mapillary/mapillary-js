/// <reference path="../../../typings/index.d.ts" />

import * as THREE from "three";

import {Marker} from "../../Component";

export class MarkerScene {
    private _needsRender: boolean;
    private _markers: { [key: string]: Marker };
    private _scene: THREE.Scene;

    constructor() {
        this._needsRender = false;
        this._markers = {};
        this._scene = new THREE.Scene();
    }

    public get markers(): { [key: string]: Marker } {
        return this._markers;
    }

    public get needsRender(): boolean {
        return this._needsRender;
    }

    public add(marker: Marker, position: number[]): void {
        if (marker.id in this._markers) {
            this._dispose(marker.id);
        }

        marker.createGeometry(position);
        this._scene.add(marker.geometry);
        this._markers[marker.id] = marker;

        this._needsRender = true;
    }

    public clear(): void {
        for (let id in this._markers) {
            if (!this._markers.hasOwnProperty) {
                continue;
            }

            this._dispose(id);
        }

        this._needsRender = true;
    }

    public remove(id: string): void {
        if (!(id in this._markers)) {
            console.warn("remove", id);
            return;
        }

        this._dispose(id);

        this._needsRender = true;
    }

    public render(
        perspectiveCamera: THREE.PerspectiveCamera,
        renderer: THREE.WebGLRenderer): void {

        renderer.render(this._scene, perspectiveCamera);

        this._needsRender = false;
    }

    public update(id: string, position: number[]): void {
        if (id in this._markers) {
            console.warn("update", id);
            return;
        }

        const marker: Marker = this._markers[id];
        marker.updatePosition(position);

        this._needsRender = true;
    }

    private _dispose(id: string): void {
        const marker: Marker = this._markers[id];
        this._scene.remove(marker.geometry);
        marker.disposeGeometry();

        delete this._markers[id];
    }
}

export default MarkerScene;
